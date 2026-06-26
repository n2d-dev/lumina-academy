'use client';

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/Button';

/**
 * Trang kết quả sau khi thanh toán cho mọi provider (stripe | momo | vnpay).
 *
 * Query params:
 *   provider: stripe | momo | vnpay
 *   status:   success | failed (chỉ MoMo/VNPay set, Stripe assume success vì cancel có URL khác)
 *   order:    providerOrderId (để tham chiếu nếu user cần support)
 *
 * Lưu ý: status ở đây CHƯA CHẮC chính xác 100%, vì source of truth là IPN.
 * UI tốt hơn sẽ poll /api/payments/status?orderId=... để confirm. Phiên bản này
 * giả định IPN đã xử lý xong khi user redirect về (race condition < 1% trong thực tế).
 */
function SuccessContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') ?? 'success';
  const provider = searchParams.get('provider') ?? 'stripe';
  const orderId = searchParams.get('order');

  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    if (status === 'success') clearCart();
  }, [status, clearCart]);

  const providerLabel: Record<string, string> = {
    stripe: 'Stripe',
    momo: 'MoMo',
    vnpay: 'VNPay',
  };

  if (status === 'failed') {
    return (
      <div className="max-w-md w-full px-5 sm:px-6 text-center">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-3 font-display">Thanh toán thất bại</h1>
        <p className="text-neutral-600 mb-2">
          Giao dịch qua {providerLabel[provider] ?? provider} chưa hoàn tất.
        </p>
        {orderId && (
          <p className="text-sm text-neutral-500 mb-8">
            Mã đơn: <code className="bg-neutral-100 px-2 py-1 rounded">{orderId}</code>
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <Link href="/cart">
            <Button size="lg" variant="outline">
              Quay lại giỏ hàng
            </Button>
          </Link>
          <Link href="/checkout">
            <Button size="lg">Thử lại</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full px-5 sm:px-6 text-center">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
        <CheckCircle2 className="w-12 h-12 text-green-500" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-black mb-3 font-display">Thanh toán thành công!</h1>
      <p className="text-neutral-600 mb-2">
        Cảm ơn bạn đã đăng ký qua {providerLabel[provider] ?? provider}.
      </p>
      <p className="text-neutral-600 mb-8">
        Khóa học đã được thêm vào danh sách học tập của bạn.
      </p>
      <Link href="/my-learning">
        <Button size="lg">Đến học tập của tôi</Button>
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="bg-white min-h-screen flex items-center justify-center">
      <Suspense fallback={null}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
