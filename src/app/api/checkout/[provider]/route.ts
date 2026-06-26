import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe, vndToCents } from '@/lib/stripe';
import { getProvider } from '@/lib/payments';

const checkoutSchema = z.object({
  courseIds: z.array(z.string()).min(1, 'Cần ít nhất 1 khóa học'),
});

const ALLOWED_PROVIDERS = ['stripe', 'momo', 'vnpay'] as const;
type AllowedProvider = (typeof ALLOWED_PROVIDERS)[number];

/**
 * POST /api/checkout/[provider]
 * Tạo phiên thanh toán cho provider tương ứng (stripe | momo | vnpay).
 *
 * Workflow:
 *   1. Validate session + body + provider
 *   2. Validate courses tồn tại, tính tổng tiền
 *   3. Tạo Payment record (status PENDING)
 *   4. Dispatch sang provider tương ứng
 *   5. Lưu providerOrderId, return paymentUrl cho client redirect
 */
export async function POST(
  request: Request,
  { params }: { params: { provider: string } }
) {
  try {
    const provider = params.provider as AllowedProvider;
    if (!ALLOWED_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { message: `Provider không hỗ trợ: ${provider}` },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const body = await request.json();
    const { courseIds } = checkoutSchema.parse(body);

    // Mock data — production swap sang prisma.course.findMany
    const { MOCK_COURSES } = await import('@/data/courses');
    const courses = MOCK_COURSES.filter((c) => courseIds.includes(c.id));

    if (courses.length !== courseIds.length) {
      return NextResponse.json(
        { message: 'Một số khóa học không tồn tại' },
        { status: 400 }
      );
    }

    const totalAmount = courses.reduce((sum, c) => sum + c.price, 0);
    const userId = (session.user as any).id;

    // Tạo Payment record TRƯỚC khi gọi provider
    // → nếu provider call fail vẫn có audit trail
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: totalAmount,
        currency: 'VND',
        status: 'PENDING',
        provider,
        courseIds,
      },
    });

    // ====== STRIPE FLOW (giữ nguyên logic cũ) ======
    if (provider === 'stripe') {
      const stripeSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: session.user.email!,
        line_items: courses.map((c) => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: c.title,
              description: c.subtitle ?? c.description.slice(0, 200),
            },
            unit_amount: vndToCents(c.price),
          },
          quantity: 1,
        })),
        success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
        cancel_url: `${process.env.NEXTAUTH_URL}/cart`,
        metadata: {
          paymentId: payment.id,
          userId,
          courseIds: courseIds.join(','),
        },
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: { providerOrderId: stripeSession.id },
      });

      return NextResponse.json({ url: stripeSession.url });
    }

    // ====== MOMO / VNPAY FLOW ======
    const paymentProvider = getProvider(provider);
    if (!paymentProvider) {
      return NextResponse.json({ message: 'Provider không hợp lệ' }, { status: 400 });
    }

    // Lấy IP của user (VNPay yêu cầu BẮT BUỘC)
    const headersList = headers();
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0].trim() ??
      headersList.get('x-real-ip') ??
      '127.0.0.1';

    const { paymentUrl, providerOrderId } = await paymentProvider.createPayment({
      paymentId: payment.id,
      userId,
      userEmail: session.user.email!,
      amount: totalAmount,
      courseIds,
      courseTitles: courses.map((c) => c.title),
      ipAddress,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerOrderId },
    });

    return NextResponse.json({ url: paymentUrl });
  } catch (err: any) {
    console.error(`Checkout ${params.provider} error:`, err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { message: err.message ?? 'Lỗi tạo phiên thanh toán' },
      { status: 500 }
    );
  }
}
