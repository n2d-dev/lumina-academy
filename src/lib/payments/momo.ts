import crypto from 'crypto';
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  VerifiedCallback,
} from './types';

/**
 * MoMo Payment Gateway integration (flow: captureWallet → QR + redirect).
 *
 * Docs: https://developers.momo.vn/v3/docs/payment/api/payment-method/onetime
 *
 * Flow:
 *   1. createPayment() → POST /v2/gateway/api/create → trả về payUrl
 *   2. User redirect sang payUrl, scan QR / login MoMo, thanh toán
 *   3. MoMo gọi IPN (notifyUrl) server-to-server → /api/webhooks/momo
 *      → ĐÂY là source of truth, KHÔNG dùng returnUrl để cấp quyền
 *   4. MoMo redirect user về returnUrl (browser) → /api/payments/momo/return
 *      → chỉ để show UI, vẫn check status từ DB (đã update bởi IPN)
 *
 * Sandbox credentials (public, MoMo cấp cho dev test, có thể commit):
 *   partnerCode = MOMO
 *   accessKey   = F8BBA842ECF85
 *   secretKey   = K951B6PE1waDMi640xX08PD3vg6EkVlz
 *   endpoint    = https://test-payment.momo.vn/v2/gateway/api/create
 *
 * Signature algorithm: HMAC SHA256 với raw signature string format:
 *   accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl
 *   &orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode
 *   &redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
 *
 * ⚠️ Order field theo alphabet, KHÔNG được đổi. Sai 1 ký tự là invalid signature.
 */

const MOMO_ENDPOINT =
  process.env.MOMO_ENDPOINT ?? 'https://test-payment.momo.vn/v2/gateway/api/create';
const PARTNER_CODE = process.env.MOMO_PARTNER_CODE ?? 'MOMO';
const ACCESS_KEY = process.env.MOMO_ACCESS_KEY ?? 'F8BBA842ECF85';
const SECRET_KEY = process.env.MOMO_SECRET_KEY ?? 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const REQUEST_TYPE = 'captureWallet'; // QR + redirect cho web

function hmacSha256(data: string, key: string): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

/** Build signature string đúng thứ tự theo MoMo docs */
function buildCreateSignature(params: {
  accessKey: string;
  amount: string;
  extraData: string;
  ipnUrl: string;
  orderId: string;
  orderInfo: string;
  partnerCode: string;
  redirectUrl: string;
  requestId: string;
  requestType: string;
}): string {
  return (
    `accessKey=${params.accessKey}` +
    `&amount=${params.amount}` +
    `&extraData=${params.extraData}` +
    `&ipnUrl=${params.ipnUrl}` +
    `&orderId=${params.orderId}` +
    `&orderInfo=${params.orderInfo}` +
    `&partnerCode=${params.partnerCode}` +
    `&redirectUrl=${params.redirectUrl}` +
    `&requestId=${params.requestId}` +
    `&requestType=${params.requestType}`
  );
}

/** Build signature cho callback (IPN/return) — thứ tự fields KHÁC với create */
function buildCallbackSignature(params: {
  accessKey: string;
  amount: string;
  extraData: string;
  message: string;
  orderId: string;
  orderInfo: string;
  orderType: string;
  partnerCode: string;
  payType: string;
  requestId: string;
  responseTime: string;
  resultCode: string;
  transId: string;
}): string {
  return (
    `accessKey=${params.accessKey}` +
    `&amount=${params.amount}` +
    `&extraData=${params.extraData}` +
    `&message=${params.message}` +
    `&orderId=${params.orderId}` +
    `&orderInfo=${params.orderInfo}` +
    `&orderType=${params.orderType}` +
    `&partnerCode=${params.partnerCode}` +
    `&payType=${params.payType}` +
    `&requestId=${params.requestId}` +
    `&responseTime=${params.responseTime}` +
    `&resultCode=${params.resultCode}` +
    `&transId=${params.transId}`
  );
}

export const momoProvider: PaymentProvider = {
  id: 'momo',

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

    // MoMo yêu cầu orderId & requestId UNIQUE. Dùng paymentId + timestamp để chống collision.
    const orderId = `${input.paymentId}-${Date.now()}`;
    const requestId = orderId;
    const amount = String(input.amount);
    const orderInfo = `Lumina Academy - ${input.courseTitles.length} khóa học`;
    const redirectUrl = `${baseUrl}/api/payments/momo/return`;
    const ipnUrl = `${baseUrl}/api/webhooks/momo`;
    const extraData = ''; // base64-encoded JSON nếu cần truyền thêm metadata

    const rawSig = buildCreateSignature({
      accessKey: ACCESS_KEY,
      amount,
      extraData,
      ipnUrl,
      orderId,
      orderInfo,
      partnerCode: PARTNER_CODE,
      redirectUrl,
      requestId,
      requestType: REQUEST_TYPE,
    });

    const signature = hmacSha256(rawSig, SECRET_KEY);

    const body = {
      partnerCode: PARTNER_CODE,
      partnerName: 'Lumina Academy',
      storeId: 'LuminaStore',
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      extraData,
      requestType: REQUEST_TYPE,
      signature,
    };

    const res = await fetch(MOMO_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as {
      resultCode: number;
      message: string;
      payUrl?: string;
      shortLink?: string;
    };

    if (data.resultCode !== 0 || !data.payUrl) {
      throw new Error(`MoMo: ${data.message ?? 'Không tạo được payment URL'}`);
    }

    return {
      paymentUrl: data.payUrl,
      providerOrderId: orderId,
    };
  },

  verifyIpn(payload: Record<string, unknown>): VerifiedCallback {
    return verifyMomoCallback(payload);
  },

  verifyReturn(query: Record<string, string>): VerifiedCallback {
    // MoMo return URL dùng cùng schema như IPN, chỉ là method GET thay vì POST
    return verifyMomoCallback(query);
  },
};

function verifyMomoCallback(payload: Record<string, unknown>): VerifiedCallback {
  const get = (k: string) => String(payload[k] ?? '');

  const orderId = get('orderId');
  const transId = get('transId');
  const amount = get('amount');
  const resultCode = get('resultCode');
  const message = get('message');
  const receivedSignature = get('signature');

  const rawSig = buildCallbackSignature({
    accessKey: ACCESS_KEY,
    amount,
    extraData: get('extraData'),
    message,
    orderId,
    orderInfo: get('orderInfo'),
    orderType: get('orderType'),
    partnerCode: get('partnerCode'),
    payType: get('payType'),
    requestId: get('requestId'),
    responseTime: get('responseTime'),
    resultCode,
    transId,
  });

  const expectedSignature = hmacSha256(rawSig, SECRET_KEY);

  // Timing-safe compare để tránh timing attack.
  // Wrap trong try/catch vì Buffer.from(invalidHex, 'hex') có thể tạo buffer
  // ngắn hơn expected (bỏ qua char không hợp lệ) → timingSafeEqual throw.
  let sigValid = false;
  try {
    const receivedBuf = Buffer.from(receivedSignature, 'hex');
    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    sigValid =
      receivedBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(receivedBuf, expectedBuf);
  } catch {
    sigValid = false;
  }

  if (!sigValid) {
    return {
      providerOrderId: orderId,
      success: false,
      amount: Number(amount) || 0,
      message: 'Chữ ký không hợp lệ',
      raw: payload,
    };
  }

  // resultCode=0 nghĩa là thành công, mọi giá trị khác đều là fail
  // Một số mã thường gặp: 9000=auth success (chưa capture), 1006=user cancel, 49=insufficient
  return {
    providerOrderId: orderId,
    providerTransactionId: transId || undefined,
    success: resultCode === '0',
    amount: Number(amount) || 0,
    message: message || (resultCode === '0' ? 'Thành công' : `Mã lỗi ${resultCode}`),
    raw: payload,
  };
}
