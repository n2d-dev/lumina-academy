import { NextResponse } from 'next/server';
import { momoProvider } from '@/lib/payments/momo';
import { fulfillPayment } from '@/lib/payments';

/**
 * GET /api/payments/momo/return
 * Browser redirect khi user thanh toán xong (hoặc cancel).
 *
 * KHÔNG phải source of truth — IPN mới là source of truth.
 * Tuy nhiên ta vẫn gọi fulfillPayment ở đây để cover trường hợp:
 *   - IPN tới chậm (network lag)
 *   - User mở instant page mà chưa được enroll
 *
 * fulfillPayment idempotent nên gọi cùng lúc với IPN cũng OK.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query: Record<string, string> = {};
  searchParams.forEach((v, k) => {
    query[k] = v;
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  try {
    const verified = momoProvider.verifyReturn(query);

    // Update DB best-effort, kết quả thật sự sẽ confirm bởi IPN
    await fulfillPayment(verified).catch((e) =>
      console.error('MoMo return fulfill error:', e)
    );

    const status = verified.success ? 'success' : 'failed';
    const orderId = verified.providerOrderId;
    return NextResponse.redirect(
      `${baseUrl}/checkout/success?provider=momo&status=${status}&order=${encodeURIComponent(orderId)}`
    );
  } catch (err) {
    console.error('MoMo return handler error:', err);
    return NextResponse.redirect(`${baseUrl}/checkout/success?provider=momo&status=failed`);
  }
}
