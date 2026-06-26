import { NextResponse } from 'next/server';
import { momoProvider } from '@/lib/payments/momo';
import { fulfillPayment } from '@/lib/payments';

/**
 * POST /api/webhooks/momo
 * MoMo IPN (Instant Payment Notification) — server-to-server.
 *
 * MoMo gửi POST với JSON body sau khi user thanh toán xong.
 * Đây là SOURCE OF TRUTH cho việc cấp quyền — KHÔNG dùng return URL.
 *
 * MoMo expect response format:
 *   { resultCode: 0, message: "success" }
 * → Bắt buộc trả 200 + format này, nếu không MoMo sẽ retry tới 3 lần.
 *
 * IPN có thể tới TRƯỚC HOẶC SAU return URL — fulfillPayment idempotent
 * nên gọi nhiều lần vẫn an toàn.
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const verified = momoProvider.verifyIpn(payload);
    const result = await fulfillPayment(verified);

    // MoMo expect resultCode=0 trong mọi trường hợp xử lý xong (kể cả fail business logic),
    // chỉ trả khác 0 khi muốn MoMo RETRY (server lỗi tạm thời).
    if (!result.ok && !verified.success) {
      // Verify fail (sai signature) hoặc payment fail — log nhưng vẫn ack
      console.warn('MoMo IPN verify/fulfill issue:', result.reason);
    }

    return NextResponse.json({ resultCode: 0, message: 'success' });
  } catch (err: any) {
    console.error('MoMo IPN handler error:', err);
    // Trả 5xx để MoMo retry (chỉ dùng cho transient error như DB down)
    return NextResponse.json(
      { resultCode: 99, message: 'Internal error' },
      { status: 500 }
    );
  }
}
