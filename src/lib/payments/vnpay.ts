import crypto from 'crypto';
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  VerifiedCallback,
} from './types';

/**
 * VNPay integration (sandbox + production).
 *
 * Docs: https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop/
 *
 * Flow:
 *   1. createPayment() build URL có sẵn signature → trả về cho client redirect
 *   2. User thanh toán trên VNPay → VNPay redirect về vnp_ReturnUrl với params trong query string
 *   3. VNPay GỌI IPN (vnp_IpnUrl) server-to-server → /api/webhooks/vnpay
 *      → ĐÂY là source of truth
 *   4. User redirect về returnUrl chỉ để show UI
 *
 * Sandbox credentials (public, VNPay cấp cho dev test):
 *   TmnCode  = 2QXUI4J4
 *   HashSecret = SECRETKEY123456789  (lấy từ sandbox dashboard, ví dụ này là placeholder)
 *   endpoint = https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
 *
 * Signature algorithm: HMAC SHA512
 *   1. Loại bỏ vnp_SecureHash & vnp_SecureHashType (nếu có)
 *   2. Sort tất cả params theo alphabet
 *   3. URL-encode value theo chuẩn application/x-www-form-urlencoded (space → +)
 *   4. Build query string: key1=encoded1&key2=encoded2&...
 *   5. HMAC SHA512(query_string, hashSecret)
 *
 * ⚠️ Bug phổ biến: dùng encodeURIComponent (space → %20) thay vì querystring.stringify
 * (space → +). VNPay verify sẽ fail. Dùng URLSearchParams hoặc qs để tránh.
 */

const VNPAY_ENDPOINT =
  process.env.VNPAY_ENDPOINT ?? 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const TMN_CODE = process.env.VNPAY_TMN_CODE ?? '2QXUI4J4';
const HASH_SECRET = process.env.VNPAY_HASH_SECRET ?? 'SECRETKEY123456789';
const VNPAY_VERSION = '2.1.0';
const VNPAY_LOCALE = 'vn';
const VNPAY_CURRENCY = 'VND';

function hmacSha512(data: string, key: string): string {
  return crypto.createHmac('sha512', key).update(data, 'utf-8').digest('hex');
}

/**
 * Sort params theo alphabet và URL-encode theo chuẩn x-www-form-urlencoded.
 * Dùng URLSearchParams thay vì manual encode để space được convert thành '+' đúng chuẩn.
 */
function sortAndEncode(params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  const sp = new URLSearchParams();
  for (const k of sortedKeys) {
    if (params[k] !== '' && params[k] !== undefined && params[k] !== null) {
      sp.append(k, params[k]);
    }
  }
  return sp.toString();
}

/** Format Date thành YYYYMMDDHHmmss theo timezone Việt Nam (GMT+7) */
function formatVnpDate(date: Date): string {
  // Convert sang GMT+7
  const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${vnTime.getUTCFullYear()}` +
    `${pad(vnTime.getUTCMonth() + 1)}` +
    `${pad(vnTime.getUTCDate())}` +
    `${pad(vnTime.getUTCHours())}` +
    `${pad(vnTime.getUTCMinutes())}` +
    `${pad(vnTime.getUTCSeconds())}`
  );
}

export const vnpayProvider: PaymentProvider = {
  id: 'vnpay',

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const now = new Date();

    // vnp_TxnRef phải UNIQUE trong ngày. Dùng paymentId + timestamp.
    const txnRef = `${input.paymentId}-${Date.now()}`;
    const orderInfo = `Lumina Academy thanh toan don hang ${input.paymentId}`;

    // ⚠️ amount phải nhân 100 (VNPay tính bằng đơn vị nhỏ nhất)
    const params: Record<string, string> = {
      vnp_Version: VNPAY_VERSION,
      vnp_Command: 'pay',
      vnp_TmnCode: TMN_CODE,
      vnp_Amount: String(input.amount * 100),
      vnp_CreateDate: formatVnpDate(now),
      vnp_CurrCode: VNPAY_CURRENCY,
      vnp_IpAddr: input.ipAddress,
      vnp_Locale: VNPAY_LOCALE,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other', // 250000 = Education theo VNPay code list, nhưng 'other' an toàn hơn
      vnp_ReturnUrl: `${baseUrl}/api/payments/vnpay/return`,
      vnp_TxnRef: txnRef,
      // ExpireDate: 15 phút sau (optional nhưng nên có)
      vnp_ExpireDate: formatVnpDate(new Date(now.getTime() + 15 * 60 * 1000)),
    };

    const queryString = sortAndEncode(params);
    const signature = hmacSha512(queryString, HASH_SECRET);

    // Build final URL với signature
    const paymentUrl = `${VNPAY_ENDPOINT}?${queryString}&vnp_SecureHash=${signature}`;

    return {
      paymentUrl,
      providerOrderId: txnRef,
    };
  },

  verifyIpn(payload: Record<string, unknown>): VerifiedCallback {
    return verifyVnpayCallback(payload);
  },

  verifyReturn(query: Record<string, string>): VerifiedCallback {
    return verifyVnpayCallback(query);
  },
};

function verifyVnpayCallback(payload: Record<string, unknown>): VerifiedCallback {
  // Convert mọi value sang string
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v !== null && v !== undefined) params[k] = String(v);
  }

  const receivedSignature = params['vnp_SecureHash'] ?? '';
  const txnRef = params['vnp_TxnRef'] ?? '';
  const transactionNo = params['vnp_TransactionNo'] ?? '';
  const responseCode = params['vnp_ResponseCode'] ?? '';
  const transactionStatus = params['vnp_TransactionStatus'] ?? '';
  const amount = Number(params['vnp_Amount'] ?? '0') / 100; // chia 100 ngược lại

  // Loại bỏ secure hash trước khi sign
  const paramsForSign = { ...params };
  delete paramsForSign['vnp_SecureHash'];
  delete paramsForSign['vnp_SecureHashType'];

  const queryString = sortAndEncode(paramsForSign);
  const expectedSignature = hmacSha512(queryString, HASH_SECRET);

  let sigValid = false;
  try {
    if (receivedSignature.length === expectedSignature.length) {
      sigValid = crypto.timingSafeEqual(
        Buffer.from(receivedSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    }
  } catch {
    sigValid = false;
  }

  if (!sigValid) {
    return {
      providerOrderId: txnRef,
      success: false,
      amount,
      message: 'Chữ ký không hợp lệ',
      raw: params,
    };
  }

  // VNPay: cả 2 đều phải = '00' mới tính là success
  // vnp_ResponseCode = '00' nghĩa là giao dịch thành công về phía bank
  // vnp_TransactionStatus = '00' nghĩa là đã xác nhận hoàn tất
  const success = responseCode === '00' && transactionStatus === '00';

  return {
    providerOrderId: txnRef,
    providerTransactionId: transactionNo || undefined,
    success,
    amount,
    message: success ? 'Thành công' : `VNPay code ${responseCode}/${transactionStatus}`,
    raw: params,
  };
}
