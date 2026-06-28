/**
 * Unit tests cho MoMo provider.
 *
 * Test isolation: KHÔNG gọi DB hay MoMo API thật. Chỉ test logic ký + verify.
 * createPayment() có gọi fetch() — tests dưới mock fetch.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { momoProvider } from '@/lib/payments/momo';

describe('MoMo Provider', () => {
  describe('verifyIpn / verifyReturn', () => {
    /**
     * Helper: tạo IPN payload hợp lệ với signature đúng.
     * Mô phỏng đúng cách MoMo gửi callback về.
     */
    function makeValidIpn(overrides: Partial<Record<string, string>> = {}): Record<string, string> {
      const accessKey = 'F8BBA842ECF85';
      const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';

      const data: Record<string, string> = {
        partnerCode: 'MOMO',
        orderId: 'TEST-123',
        requestId: 'TEST-123',
        amount: '1290000',
        orderInfo: 'Lumina Academy',
        orderType: 'momo_wallet',
        transId: '2400123456',
        resultCode: '0',
        message: 'Successful.',
        payType: 'qr',
        responseTime: String(Date.now()),
        extraData: '',
        ...overrides,
      };

      const sigString =
        `accessKey=${accessKey}` +
        `&amount=${data.amount}` +
        `&extraData=${data.extraData}` +
        `&message=${data.message}` +
        `&orderId=${data.orderId}` +
        `&orderInfo=${data.orderInfo}` +
        `&orderType=${data.orderType}` +
        `&partnerCode=${data.partnerCode}` +
        `&payType=${data.payType}` +
        `&requestId=${data.requestId}` +
        `&responseTime=${data.responseTime}` +
        `&resultCode=${data.resultCode}` +
        `&transId=${data.transId}`;

      const signature = crypto.createHmac('sha256', secretKey).update(sigString).digest('hex');
      return { ...data, signature };
    }

    it('accepts valid signature with resultCode=0', () => {
      const payload = makeValidIpn();
      const result = momoProvider.verifyIpn(payload);

      expect(result.success).toBe(true);
      expect(result.providerOrderId).toBe('TEST-123');
      expect(result.providerTransactionId).toBe('2400123456');
      expect(result.amount).toBe(1290000);
    });

    it('rejects tampered signature', () => {
      const payload = makeValidIpn();
      payload.signature = 'a'.repeat(64); // sai chữ ký nhưng đúng length

      const result = momoProvider.verifyIpn(payload);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Chữ ký không hợp lệ');
    });

    it('rejects when amount tampered (signature still old)', () => {
      const payload = makeValidIpn();
      // Attacker đổi amount nhưng giữ sig cũ → verify phải fail
      payload.amount = '1';

      const result = momoProvider.verifyIpn(payload);
      expect(result.success).toBe(false);
    });

    it('marks failed when resultCode != 0 (even if signature valid)', () => {
      const payload = makeValidIpn({ resultCode: '1006', message: 'User canceled' });
      const result = momoProvider.verifyIpn(payload);

      expect(result.success).toBe(false);
      expect(result.providerOrderId).toBe('TEST-123'); // vẫn có để fulfillPayment đánh dấu FAILED
      expect(result.message).toContain('User canceled');
    });

    it('handles signature length mismatch without crash', () => {
      const payload = makeValidIpn();
      payload.signature = 'abc'; // quá ngắn

      const result = momoProvider.verifyIpn(payload);
      expect(result.success).toBe(false);
    });

    it('uses timing-safe compare (not vulnerable to early exit)', () => {
      // Test conceptually: 2 sigs cùng length nhưng khác char đầu vs char cuối
      // Cả 2 đều phải fail mà không leak timing.
      const payload1 = makeValidIpn();
      const expectedSig = payload1.signature;

      payload1.signature = 'X' + expectedSig.slice(1);
      const r1 = momoProvider.verifyIpn(payload1);
      expect(r1.success).toBe(false);

      payload1.signature = expectedSig.slice(0, -1) + 'X';
      const r2 = momoProvider.verifyIpn(payload1);
      expect(r2.success).toBe(false);
    });

    it('verifyReturn behaves identically to verifyIpn', () => {
      // MoMo return URL dùng cùng schema, chỉ là method khác
      const payload = makeValidIpn();
      const ipn = momoProvider.verifyIpn(payload);
      const ret = momoProvider.verifyReturn(payload);

      expect(ipn.success).toBe(ret.success);
      expect(ipn.providerOrderId).toBe(ret.providerOrderId);
      expect(ipn.providerTransactionId).toBe(ret.providerTransactionId);
    });

    it('preserves raw payload for audit', () => {
      const payload = makeValidIpn();
      const result = momoProvider.verifyIpn(payload);
      expect(result.raw).toMatchObject(payload);
    });
  });

  describe('createPayment', () => {
    beforeEach(() => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () =>
          new Response(
            JSON.stringify({
              resultCode: 0,
              message: 'Successful.',
              payUrl: 'https://test-payment.momo.vn/pay/abc123',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        )
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('returns payUrl + providerOrderId on success', async () => {
      const result = await momoProvider.createPayment({
        paymentId: 'pay_abc',
        userId: 'user_1',
        userEmail: 'test@test.com',
        amount: 1290000,
        courseIds: ['1'],
        courseTitles: ['React Course'],
        ipAddress: '127.0.0.1',
      });

      expect(result.paymentUrl).toBe('https://test-payment.momo.vn/pay/abc123');
      expect(result.providerOrderId).toContain('pay_abc-');
    });

    it('throws when MoMo returns non-zero resultCode', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () =>
          new Response(
            JSON.stringify({ resultCode: 11, message: 'Invalid signature' }),
            { status: 200 }
          )
        )
      );

      await expect(
        momoProvider.createPayment({
          paymentId: 'pay_abc',
          userId: 'user_1',
          userEmail: 'test@test.com',
          amount: 1290000,
          courseIds: ['1'],
          courseTitles: ['Test'],
          ipAddress: '127.0.0.1',
        })
      ).rejects.toThrow('MoMo: Invalid signature');
    });

    it('uses unique orderId per call (timestamp-based)', async () => {
      const r1 = await momoProvider.createPayment({
        paymentId: 'pay_x',
        userId: 'u',
        userEmail: 't@t.com',
        amount: 100,
        courseIds: ['1'],
        courseTitles: ['t'],
        ipAddress: '127.0.0.1',
      });
      // Đảm bảo timestamps khác
      await new Promise((r) => setTimeout(r, 5));
      const r2 = await momoProvider.createPayment({
        paymentId: 'pay_x',
        userId: 'u',
        userEmail: 't@t.com',
        amount: 100,
        courseIds: ['1'],
        courseTitles: ['t'],
        ipAddress: '127.0.0.1',
      });

      expect(r1.providerOrderId).not.toBe(r2.providerOrderId);
    });
  });
});
