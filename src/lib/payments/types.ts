/**
 * Shared types & contract cho tất cả payment provider.
 *
 * Mỗi provider (stripe, momo, vnpay) implement interface PaymentProvider.
 * UI / API route chỉ work với interface này, không care về implementation chi tiết.
 */

export type PaymentProviderId = 'stripe' | 'momo' | 'vnpay';

export interface CreatePaymentInput {
  paymentId: string;          // Lumina internal Payment.id
  userId: string;
  userEmail: string;
  amount: number;             // VND
  courseIds: string[];
  courseTitles: string[];     // dùng để hiển thị trên cổng thanh toán
  ipAddress: string;          // VNPay BẮT BUỘC, MoMo optional
}

export interface CreatePaymentResult {
  /** URL để redirect user sang cổng thanh toán */
  paymentUrl: string;
  /** ID đơn hàng theo provider (sẽ lưu vào Payment.providerOrderId) */
  providerOrderId: string;
}

export interface VerifiedCallback {
  /** Provider order id (để tra ngược về Payment record) */
  providerOrderId: string;
  /** Transaction id của provider, có sau khi thanh toán xong */
  providerTransactionId?: string;
  /** Đã thành công chưa */
  success: boolean;
  /** Số tiền thực tế đã trừ (VND), để cross-check chống tampering */
  amount: number;
  /** Lý do thất bại (nếu có) */
  message: string;
  /** Raw payload để lưu vào DB cho audit */
  raw: Record<string, unknown>;
}

export interface PaymentProvider {
  id: PaymentProviderId;
  /** Tạo payment URL để redirect user */
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  /** Verify chữ ký + parse payload từ IPN (server-to-server webhook) */
  verifyIpn(payload: Record<string, unknown>): VerifiedCallback;
  /** Verify chữ ký + parse payload từ return URL (user redirect về) */
  verifyReturn(query: Record<string, string>): VerifiedCallback;
}
