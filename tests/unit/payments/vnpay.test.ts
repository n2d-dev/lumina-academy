/**
 * Unit tests cho VNPay provider.
 *
 * Tập trung verify edge cases về:
 *   - HMAC SHA512 signature
 *   - Sort alphabetically (KHÔNG được nhầm)
 *   - URL encoding "+" cho space (KHÔNG dùng %20)
 *   - Amount nhân 100
 *   - vnp_ResponseCode '00' AND vnp_TransactionStatus '00' đều phải pass
 */

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { vnpayProvider } from '@/lib/payments/vnpay';

const HASH_SECRET = 'TESTSECRETKEY1234567890'; // match .env.test

describe('VNPay Provider', () => {
  describe('verifyIpn / verifyReturn', () => {
    /**
     * Build VNPay callback hợp lệ với signature đúng.
     * Đúng spec: sort alphabetically + URLSearchParams encoding.
     */
    function makeValidCallback(overrides: Partial<Record<string, string>> = {}): Record<string, string> {
      const data: Record<string, string> = {
        vnp_Amount: '129000000', // 1,290,000 VND × 100
        vnp_BankCode: 'NCB',
        vnp_BankTranNo: 'VNP14234567',
        vnp_CardType: 'ATM',
        vnp_OrderInfo: 'Lumina Academy thanh toan',
        vnp_PayDate: '20260101120000',
        vnp_ResponseCode: '00',
        vnp_TmnCode: 'TESTCODE',
        vnp_TransactionNo: '14234567',
        vnp_TransactionStatus: '00',
        vnp_TxnRef: 'TXN-TEST-123',
        ...overrides,
      };

      // Sort + encode (đúng cách VNPay expect)
      const sortedKeys = Object.keys(data).sort();
      const sp = new URLSearchParams();
      for (const k of sortedKeys) sp.append(k, data[k]);
      const queryString = sp.toString();

      const signature = crypto
        .createHmac('sha512', HASH_SECRET)
        .update(queryString, 'utf-8')
        .digest('hex');

      return { ...data, vnp_SecureHash: signature };
    }

    it('accepts valid signature with success codes', () => {
      const payload = makeValidCallback();
      const result = vnpayProvider.verifyIpn(payload);

      expect(result.success).toBe(true);
      expect(result.providerOrderId).toBe('TXN-TEST-123');
      expect(result.providerTransactionId).toBe('14234567');
      expect(result.amount).toBe(1290000); // /100 ngược lại
    });

    it('rejects tampered signature', () => {
      const payload = makeValidCallback();
      payload.vnp_SecureHash = 'a'.repeat(128);

      const result = vnpayProvider.verifyIpn(payload);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Chữ ký không hợp lệ');
    });

    it('rejects when amount tampered', () => {
      const payload = makeValidCallback();
      payload.vnp_Amount = '100'; // attacker giảm tiền, sig giữ cũ

      const result = vnpayProvider.verifyIpn(payload);
      expect(result.success).toBe(false);
    });

    it('marks fail when ResponseCode != 00', () => {
      const payload = makeValidCallback({ vnp_ResponseCode: '24' }); // user cancel
      const result = vnpayProvider.verifyIpn(payload);

      expect(result.success).toBe(false); // sig OK nhưng response code fail
      expect(result.providerOrderId).toBe('TXN-TEST-123');
    });

    it('marks fail when TransactionStatus != 00 (even if ResponseCode = 00)', () => {
      const payload = makeValidCallback({ vnp_TransactionStatus: '02' });
      const result = vnpayProvider.verifyIpn(payload);

      expect(result.success).toBe(false);
    });

    it('encodes space as "+" not "%20" (VNPay spec)', () => {
      // Order info có space → nếu dùng encodeURIComponent (%20) → fail
      const payload = makeValidCallback({
        vnp_OrderInfo: 'Multiple words with spaces here',
      });
      const result = vnpayProvider.verifyIpn(payload);

      // Nếu code dùng sai encoding (URLSearchParams thay vì encodeURIComponent),
      // sig khớp → success. Nếu sai → fail.
      expect(result.success).toBe(true);
    });

    it('handles special chars in OrderInfo (Vietnamese)', () => {
      const payload = makeValidCallback({
        vnp_OrderInfo: 'Thanh toán đơn hàng',
      });
      const result = vnpayProvider.verifyIpn(payload);
      expect(result.success).toBe(true);
    });

    it('strips vnp_SecureHash and vnp_SecureHashType before re-signing', () => {
      // Verify code không bao gồm chính signature trong việc tính lại signature
      const payload = makeValidCallback();
      // Add SecureHashType (legacy field VNPay đôi khi gửi)
      const payloadWithType = { ...payload, vnp_SecureHashType: 'HMACSHA512' };

      const result = vnpayProvider.verifyIpn(payloadWithType);
      expect(result.success).toBe(true);
    });

    it('handles missing signature gracefully', () => {
      const payload = makeValidCallback();
      delete (payload as any).vnp_SecureHash;

      const result = vnpayProvider.verifyIpn(payload);
      expect(result.success).toBe(false);
    });

    it('preserves raw for audit', () => {
      const payload = makeValidCallback();
      const result = vnpayProvider.verifyIpn(payload);
      expect(result.raw).toMatchObject(payload);
    });
  });

  describe('createPayment', () => {
    it('builds URL with sorted query params', async () => {
      const result = await vnpayProvider.createPayment({
        paymentId: 'pay_x',
        userId: 'u1',
        userEmail: 'a@b.com',
        amount: 1290000,
        courseIds: ['1'],
        courseTitles: ['React'],
        ipAddress: '127.0.0.1',
      });

      expect(result.paymentUrl).toContain('https://sandbox.vnpayment.vn');
      expect(result.paymentUrl).toContain('vnp_SecureHash=');
      expect(result.paymentUrl).toContain('vnp_Amount=129000000'); // × 100
      expect(result.providerOrderId).toContain('pay_x-');
    });

    it('signature in URL verifies correctly when reversed', async () => {
      const result = await vnpayProvider.createPayment({
        paymentId: 'pay_y',
        userId: 'u',
        userEmail: 'a@b.com',
        amount: 500000,
        courseIds: ['1'],
        courseTitles: ['Test'],
        ipAddress: '192.168.1.1',
      });

      // Parse URL ngược lại, verify sig
      const url = new URL(result.paymentUrl);
      const params: Record<string, string> = {};
      url.searchParams.forEach((v, k) => {
        params[k] = v;
      });

      // Verify như VNPay sẽ làm
      const verify = vnpayProvider.verifyReturn(params);
      // Note: createPayment build URL chưa có response codes
      // → sig đúng nhưng business logic fail (vì không có vnp_ResponseCode)
      // Test ở đây chỉ verify sig math chính xác
      expect(verify.message).not.toBe('Chữ ký không hợp lệ');
    });

    it('respects vnp_Locale=vn', async () => {
      const result = await vnpayProvider.createPayment({
        paymentId: 'pay_z',
        userId: 'u',
        userEmail: 'a@b.com',
        amount: 100000,
        courseIds: ['1'],
        courseTitles: ['Test'],
        ipAddress: '127.0.0.1',
      });
      expect(result.paymentUrl).toContain('vnp_Locale=vn');
    });
  });
});
