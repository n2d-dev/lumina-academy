import { NextResponse } from 'next/server';
import { vnpayProvider } from '@/lib/payments/vnpay';
import { fulfillPayment } from '@/lib/payments';

/**
 * GET /api/webhooks/vnpay
 * VNPay IPN — VNPay gửi GET request với query string sau khi user thanh toán.
 *
 * Đây là SOURCE OF TRUTH cho việc cấp quyền.
 *
 * VNPay expect response format JSON:
 *   { RspCode: '00', Message: 'Confirm Success' }
 *
 * Các mã VNPay yêu cầu trả về:
 *   '00' = Confirm Success
 *   '01' = Order not found
 *   '02' = Order already confirmed
 *   '04' = Invalid amount
 *   '97' = Invalid signature
 *   '99' = Unknown error
 *
 * VNPay sẽ retry nếu nhận response khác hoặc HTTP 5xx.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query: Record<string, string> = {};
  searchParams.forEach((v, k) => {
    query[k] = v;
  });

  try {
    const verified = vnpayProvider.verifyIpn(query);

    if (!verified.success && verified.message === 'Chữ ký không hợp lệ') {
      return NextResponse.json({ RspCode: '97', Message: 'Invalid Checksum' });
    }

    const result = await fulfillPayment(verified);

    if (!result.ok) {
      // Phân loại lý do để trả mã chuẩn cho VNPay
      if (result.reason?.includes('không tồn tại')) {
        return NextResponse.json({ RspCode: '01', Message: 'Order Not Found' });
      }
      if (result.reason?.includes('không khớp')) {
        return NextResponse.json({ RspCode: '04', Message: 'Invalid Amount' });
      }
      // Payment thất bại từ phía bank — vẫn ack '00' để VNPay không retry
      return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
    }

    if (result.alreadyProcessed) {
      return NextResponse.json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
  } catch (err: any) {
    console.error('VNPay IPN handler error:', err);
    return NextResponse.json({ RspCode: '99', Message: 'Unknown error' });
  }
}
