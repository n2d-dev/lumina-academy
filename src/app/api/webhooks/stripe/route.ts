import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';

/**
 * POST /api/webhooks/stripe
 * Xử lý các sự kiện từ Stripe (payment completed, failed, refunded...)
 *
 * Setup webhook:
 *   1. Tạo webhook endpoint trong Stripe Dashboard
 *   2. URL: https://your-domain.com/api/webhooks/stripe
 *   3. Events: checkout.session.completed, payment_intent.payment_failed
 *   4. Copy signing secret vào STRIPE_WEBHOOK_SECRET env var
 */
export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ message: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(intent);
        break;
      }
      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ message: 'Handler error' }, { status: 500 });
  }
}

/**
 * Khi checkout thành công:
 * 1. Update Payment status -> COMPLETED
 * 2. Tạo Enrollment cho mỗi course
 * 3. Xóa CartItem
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.paymentId;
  const userId = session.metadata?.userId;
  const courseIds = session.metadata?.courseIds?.split(',') ?? [];

  if (!paymentId || !userId || courseIds.length === 0) {
    console.error('Missing metadata in webhook');
    return;
  }

  await prisma.$transaction([
    // Update payment
    prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        providerTransactionId: session.payment_intent as string | undefined,
        rawResponse: session as any,
      },
    }),
    // Tạo enrollments
    ...courseIds.map((courseId) =>
      prisma.enrollment.upsert({
        where: { userId_courseId: { userId, courseId } },
        create: { userId, courseId },
        update: {},
      })
    ),
    // Xóa khỏi cart
    prisma.cartItem.deleteMany({
      where: { userId, courseId: { in: courseIds } },
    }),
  ]);

  console.log(`✅ Enrollment created for user ${userId}, courses: ${courseIds.join(', ')}`);
}

async function handlePaymentFailed(intent: Stripe.PaymentIntent) {
  const paymentId = intent.metadata?.paymentId;
  if (!paymentId) return;

  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'FAILED' },
  });
}
