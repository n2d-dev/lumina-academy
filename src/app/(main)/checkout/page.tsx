'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { GRADIENTS } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

type Provider = 'stripe' | 'momo' | 'vnpay';

const PAYMENT_METHODS: { id: Provider; name: string; icon: string; description: string }[] = [
  {
    id: 'momo',
    name: 'Ví MoMo',
    icon: '📱',
    description: 'Quét QR hoặc thanh toán qua app MoMo',
  },
  {
    id: 'vnpay',
    name: 'VNPay',
    icon: '🏦',
    description: 'ATM nội địa, Internet Banking, QR VNPay',
  },
  {
    id: 'stripe',
    name: 'Thẻ tín dụng quốc tế',
    icon: '💳',
    description: 'Visa, Mastercard, JCB, AMEX',
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider>('momo');

  useEffect(() => setMounted(true), []);

  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.getTotal());
  const originalTotal = useCartStore((s) => s.getOriginalTotal());

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/checkout');
    }
  }, [status, router]);

  useEffect(() => {
    if (mounted && items.length === 0 && status === 'authenticated') {
      router.push('/cart');
    }
  }, [mounted, items.length, status, router]);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/checkout/${selectedProvider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseIds: items.map((c) => c.id) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Tất cả 3 provider đều redirect bằng URL, UI flow giống nhau
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message ?? 'Lỗi thanh toán');
      setLoading(false);
    }
  };

  if (!mounted || status === 'loading') return null;

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <Link
          href="/cart"
          className="flex items-center gap-2 text-sm text-neutral-600 hover:text-black mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại giỏ hàng
        </Link>

        <h1 className="text-4xl font-black mb-8 font-display">Thanh toán</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6">
              <h3 className="font-bold mb-4">Thông tin liên hệ</h3>
              <div className="space-y-2">
                <p className="text-sm text-neutral-600">
                  Họ tên: <strong className="text-black">{session?.user?.name}</strong>
                </p>
                <p className="text-sm text-neutral-600">
                  Email: <strong className="text-black">{session?.user?.email}</strong>
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6">
              <h3 className="font-bold mb-4">Phương thức thanh toán</h3>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <PaymentMethod
                    key={method.id}
                    method={method}
                    selected={selectedProvider === method.id}
                    onSelect={() => setSelectedProvider(method.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl p-6 sticky top-24">
              <h3 className="font-bold mb-4">Đơn hàng</h3>

              <div className="space-y-3 mb-4 pb-4 border-b border-neutral-100 max-h-64 overflow-auto">
                {items.map((course) => (
                  <div key={course.id} className="flex gap-3">
                    <div
                      className="w-16 h-12 rounded-lg flex-shrink-0"
                      style={{ background: GRADIENTS[course.thumbnail ?? 'gradient-blue'] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold line-clamp-2">{course.title}</p>
                      <p className="text-xs text-neutral-500 mt-1">{formatPrice(course.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-4 pb-4 border-b border-neutral-100">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Tạm tính</span>
                  <span>{formatPrice(originalTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Giảm giá</span>
                  <span className="text-green-600 font-bold">
                    -{formatPrice(originalTotal - total)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between mb-6">
                <span className="font-bold">Tổng</span>
                <span className="text-2xl font-black">{formatPrice(total)}</span>
              </div>

              <Button onClick={handleCheckout} disabled={loading} size="lg" className="w-full">
                {loading ? 'Đang xử lý...' : `Thanh toán • ${formatPrice(total)}`}
              </Button>

              <p className="text-xs text-center text-neutral-500 mt-3">
                🔒 Thanh toán an toàn được mã hóa SSL
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentMethod({
  method,
  selected,
  onSelect,
}: {
  method: { id: Provider; name: string; icon: string; description: string };
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
        selected
          ? 'border-black bg-neutral-50'
          : 'border-neutral-200 hover:border-neutral-400'
      }`}
    >
      <input
        type="radio"
        name="payment"
        checked={selected}
        onChange={onSelect}
        className="w-4 h-4"
      />
      <span className="text-2xl">{method.icon}</span>
      <span className="flex-1">
        <span className="font-medium block">{method.name}</span>
        <span className="text-xs text-neutral-500">{method.description}</span>
      </span>
    </label>
  );
}
