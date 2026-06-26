/**
 * Integration tests cho IPN webhook handlers:
 *   - POST /api/webhooks/momo
 *   - GET /api/webhooks/vnpay
 *
 * Test:
 *   - Response format đúng theo spec của từng cổng
 *   - Idempotency (resend IPN không cấp lại quyền)
 *   - DB state đúng sau khi xử lý
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import crypto from 'crypto';
import {
  getTestPrisma,
  cleanDatabase,
  disconnectTestDb,
  createTestUser,
  createTestPayment,
} from '../../helpers/db';

vi.mock('@/lib/email', () => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue({ ok: true }),
  sendNewEnrollmentEmail: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock('@/data/courses', () => ({
  MOCK_COURSES: [
    {
      id: 'course-1',
      title: 'React',
      price: 1290000,
      instructor: { id: 'i1', name: 'Teacher' },
    },
  ],
}));

const prisma = getTestPrisma();

describe('Webhook Handlers', () => {
  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('POST /api/webhooks/momo', () => {
    function makeValidMomoIpn(overrides: Partial<Record<string, string>> = {}) {
      const accessKey = 'F8BBA842ECF85';
      const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
      const data: Record<string, string> = {
        partnerCode: 'MOMO',
        orderId: 'TEST-ORDER',
        requestId: 'TEST-ORDER',
        amount: '1290000',
        orderInfo: 'Lumina',
        orderType: 'momo_wallet',
        transId: 'TRANS-123',
        resultCode: '0',
        message: 'OK',
        payType: 'qr',
        responseTime: String(Date.now()),
        extraData: '',
        ...overrides,
      };
      const sig =
        `accessKey=${accessKey}&amount=${data.amount}&extraData=${data.extraData}` +
        `&message=${data.message}&orderId=${data.orderId}&orderInfo=${data.orderInfo}` +
        `&orderType=${data.orderType}&partnerCode=${data.partnerCode}` +
        `&payType=${data.payType}&requestId=${data.requestId}` +
        `&responseTime=${data.responseTime}&resultCode=${data.resultCode}` +
        `&transId=${data.transId}`;
      data.signature = crypto.createHmac('sha256', secretKey).update(sig).digest('hex');
      return data;
    }

    it('processes valid IPN and returns MoMo-required ack format', async () => {
      const user = await createTestUser();
      await createTestPayment({
        userId: user.id,
        amount: 1290000,
        courseIds: ['course-1'],
        providerOrderId: 'TEST-ORDER',
        provider: 'momo',
      });

      const { POST } = await import('@/app/api/webhooks/momo/route');
      const ipn = makeValidMomoIpn();
      const req = new Request('http://localhost/api/webhooks/momo', {
        method: 'POST',
        body: JSON.stringify(ipn),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      // MoMo expect resultCode=0, message="success"
      expect(data).toEqual({ resultCode: 0, message: 'success' });

      // Payment marked COMPLETED
      const payment = await prisma.payment.findFirst({
        where: { providerOrderId: 'TEST-ORDER' },
      });
      expect(payment?.status).toBe('COMPLETED');

      // Enrollment created
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: user.id },
      });
      expect(enrollments).toHaveLength(1);
    });

    it('returns ack even when signature invalid (logs internally)', async () => {
      // MoMo retry policy: chỉ retry khi nhận resultCode != 0 từ ack.
      // Để tránh retry storm, trả 0 cho mọi case (verify thất bại chỉ log).
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { POST } = await import('@/app/api/webhooks/momo/route');
      const ipn = makeValidMomoIpn();
      ipn.signature = 'a'.repeat(64); // invalid

      const req = new Request('http://localhost/api/webhooks/momo', {
        method: 'POST',
        body: JSON.stringify(ipn),
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.resultCode).toBe(0); // ack to prevent retry storm
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('handles fail callback (resultCode != 0)', async () => {
      const user = await createTestUser();
      await createTestPayment({
        userId: user.id,
        amount: 1290000,
        courseIds: ['course-1'],
        providerOrderId: 'TEST-FAIL-ORDER',
        provider: 'momo',
      });

      const { POST } = await import('@/app/api/webhooks/momo/route');
      const ipn = makeValidMomoIpn({
        orderId: 'TEST-FAIL-ORDER',
        requestId: 'TEST-FAIL-ORDER',
        resultCode: '1006',
        message: 'User canceled',
      });

      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const req = new Request('http://localhost/api/webhooks/momo', {
        method: 'POST',
        body: JSON.stringify(ipn),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);

      const payment = await prisma.payment.findFirst({
        where: { providerOrderId: 'TEST-FAIL-ORDER' },
      });
      expect(payment?.status).toBe('FAILED');
    });
  });

  describe('GET /api/webhooks/vnpay', () => {
    const HASH_SECRET = 'TESTSECRETKEY1234567890';

    function buildVnpayQuery(overrides: Partial<Record<string, string>> = {}) {
      const data: Record<string, string> = {
        vnp_Amount: '129000000',
        vnp_BankCode: 'NCB',
        vnp_OrderInfo: 'Lumina',
        vnp_PayDate: '20260101120000',
        vnp_ResponseCode: '00',
        vnp_TmnCode: 'TESTCODE',
        vnp_TransactionNo: 'TRANS-456',
        vnp_TransactionStatus: '00',
        vnp_TxnRef: 'TEST-VNPAY',
        ...overrides,
      };
      const sortedKeys = Object.keys(data).sort();
      const sp = new URLSearchParams();
      for (const k of sortedKeys) sp.append(k, data[k]);
      const sig = crypto
        .createHmac('sha512', HASH_SECRET)
        .update(sp.toString(), 'utf-8')
        .digest('hex');
      return { ...data, vnp_SecureHash: sig };
    }

    it('processes valid IPN with VNPay ack format', async () => {
      const user = await createTestUser();
      await createTestPayment({
        userId: user.id,
        amount: 1290000,
        courseIds: ['course-1'],
        providerOrderId: 'TEST-VNPAY',
        provider: 'vnpay',
      });

      const query = buildVnpayQuery();
      const url = new URL('http://localhost/api/webhooks/vnpay');
      Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));

      const { GET } = await import('@/app/api/webhooks/vnpay/route');
      const res = await GET(new Request(url));
      const data = await res.json();

      expect(data).toEqual({ RspCode: '00', Message: 'Confirm Success' });

      const payment = await prisma.payment.findFirst({
        where: { providerOrderId: 'TEST-VNPAY' },
      });
      expect(payment?.status).toBe('COMPLETED');
    });

    it('returns RspCode=97 when signature invalid', async () => {
      const query = buildVnpayQuery();
      query.vnp_SecureHash = 'a'.repeat(128); // invalid

      const url = new URL('http://localhost/api/webhooks/vnpay');
      Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));

      const { GET } = await import('@/app/api/webhooks/vnpay/route');
      const res = await GET(new Request(url));
      const data = await res.json();

      expect(data.RspCode).toBe('97');
      expect(data.Message).toBe('Invalid Checksum');
    });

    it('returns RspCode=01 when order not found', async () => {
      // Không tạo payment, query DB sẽ miss
      const query = buildVnpayQuery({ vnp_TxnRef: 'NON-EXISTENT' });
      const url = new URL('http://localhost/api/webhooks/vnpay');
      Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));

      const { GET } = await import('@/app/api/webhooks/vnpay/route');
      const res = await GET(new Request(url));
      const data = await res.json();

      expect(data.RspCode).toBe('01');
    });

    it('returns RspCode=04 when amount tampered', async () => {
      const user = await createTestUser();
      await createTestPayment({
        userId: user.id,
        amount: 1290000, // user thực trả 1.29M
        courseIds: ['course-1'],
        providerOrderId: 'TEST-AMOUNT-TAMPER',
        provider: 'vnpay',
      });

      // Attacker gửi callback với amount thấp (signature recomputed nên hợp lệ về math)
      const query = buildVnpayQuery({
        vnp_TxnRef: 'TEST-AMOUNT-TAMPER',
        vnp_Amount: '100', // attacker fake 1đ
      });
      const url = new URL('http://localhost/api/webhooks/vnpay');
      Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));

      const { GET } = await import('@/app/api/webhooks/vnpay/route');
      const res = await GET(new Request(url));
      const data = await res.json();

      expect(data.RspCode).toBe('04');

      // Payment marked FAILED
      const p = await prisma.payment.findFirst({
        where: { providerOrderId: 'TEST-AMOUNT-TAMPER' },
      });
      expect(p?.status).toBe('FAILED');
    });

    it('returns RspCode=02 on duplicate IPN (idempotent)', async () => {
      const user = await createTestUser();
      await createTestPayment({
        userId: user.id,
        amount: 1290000,
        courseIds: ['course-1'],
        providerOrderId: 'TEST-DUP',
        provider: 'vnpay',
      });

      const query = buildVnpayQuery({ vnp_TxnRef: 'TEST-DUP' });
      const url = new URL('http://localhost/api/webhooks/vnpay');
      Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));

      const { GET } = await import('@/app/api/webhooks/vnpay/route');

      const r1 = await GET(new Request(url));
      const d1 = await r1.json();
      expect(d1.RspCode).toBe('00');

      const r2 = await GET(new Request(url));
      const d2 = await r2.json();
      expect(d2.RspCode).toBe('02'); // already confirmed
    });
  });
});
