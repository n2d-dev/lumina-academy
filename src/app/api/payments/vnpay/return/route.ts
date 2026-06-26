import { NextResponse } from 'next/server';
import { vnpayProvider } from '@/lib/payments/vnpay';
import { fulfillPayment } from '@/lib/payments';

/**
 * GET /api/payments/vnpay/return
 * Browser redirect khi user thanh toán xong tại VNPay.
 *
 * KHÔNG phải source of truth — IPN mới là.
 * Mục đích: hiển thị UI cho user, đồng thời best-effort fulfill nếu IPN tới chậm.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query: Record<string, string> = {};
  searchParams.forEach((v, k) => {
    query[k] = v;
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  try {
    const verified = vnpayProvider.verifyReturn(query);

    await fulfillPayment(verified).catch((e) =>
      console.error('VNPay return fulfill error:', e)
    );

    const status = verified.success ? 'success' : 'failed';
    const orderId = verified.providerOrderId;
    return NextResponse.redirect(
      `${baseUrl}/checkout/success?provider=vnpay&status=${status}&order=${encodeURIComponent(orderId)}`
    );
  } catch (err) {
    console.error('VNPay return handler error:', err);
    return NextResponse.redirect(`${baseUrl}/checkout/success?provider=vnpay&status=failed`);
  }
}
