'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShoppingCart, X, Star, Trophy } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { GRADIENTS } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const total = useCartStore((s) => s.getTotal());
  const originalTotal = useCartStore((s) => s.getOriginalTotal());
  const discount = originalTotal - total;

  if (!mounted) return null;

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-black mb-6 sm:mb-8 font-display">Giỏ hàng</h1>

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Items list */}
            <div className="lg:col-span-2 space-y-3 mb-6 lg:mb-0">
              <p className="text-sm text-neutral-600 mb-3">
                <strong className="text-black">{items.length}</strong> khóa học trong giỏ
              </p>
              {items.map((course) => (
                <div key={course.id} className="bg-white rounded-2xl p-3 sm:p-4 flex gap-3 sm:gap-4">
                  <div
                    className="w-24 h-16 sm:w-32 sm:h-20 rounded-xl flex-shrink-0"
                    style={{ background: GRADIENTS[course.thumbnail ?? 'gradient-blue'] }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm sm:text-base mb-1 line-clamp-2 pr-2">
                      {course.title}
                    </h3>
                    <p className="text-xs text-neutral-500 mb-1">{course.instructor.name}</p>
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span className="font-bold text-amber-600">{course.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between flex-shrink-0">
                    {/* Touch-friendly remove — 44×44 tap target */}
                    <button
                      onClick={() => removeItem(course.id)}
                      className="w-11 h-11 -mr-2 -mt-1 flex items-center justify-center rounded-full text-neutral-400 hover:text-red-500 active:scale-90 transition-all touch-manipulation"
                      aria-label="Xóa"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="text-right">
                      <p className="font-black text-sm sm:text-base">{formatPrice(course.price)}</p>
                      {course.originalPrice && (
                        <p className="text-xs text-neutral-400 line-through">
                          {formatPrice(course.originalPrice)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary — sticky on desktop, pinned bottom on mobile */}
            <div>
              {/* Mobile: inline before checkout button */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 lg:sticky lg:top-24">
                <h3 className="font-bold mb-4 text-sm sm:text-base">Tóm tắt đơn hàng</h3>

                <div className="space-y-2.5 mb-4 pb-4 border-b border-neutral-100 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Tạm tính</span>
                    <span className="line-through text-neutral-400">{formatPrice(originalTotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Giảm giá</span>
                      <span className="text-green-600 font-bold">-{formatPrice(discount)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mb-5">
                  <span className="font-bold">Tổng cộng</span>
                  <span className="text-2xl font-black">{formatPrice(total)}</span>
                </div>

                <Link
                  href="/checkout"
                  className="flex items-center justify-center w-full py-4 bg-black text-white font-bold rounded-full hover:bg-neutral-800 active:scale-95 transition-all text-sm sm:text-base touch-manipulation mb-3"
                >
                  Thanh toán ngay
                </Link>

                <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-xl">
                  <Trophy className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <p className="text-xs text-neutral-600">
                    <strong>Đảm bảo 30 ngày</strong> — Hoàn tiền 100% nếu không hài lòng
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="bg-white rounded-3xl p-10 sm:p-16 text-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-400" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold mb-3">Giỏ hàng trống</h2>
      <p className="text-sm sm:text-base text-neutral-600 mb-6">
        Khám phá các khóa học chất lượng của chúng tôi
      </p>
      <Link
        href="/courses"
        className="inline-block px-8 py-4 bg-black text-white font-bold rounded-full hover:bg-neutral-800 active:scale-95 transition-all touch-manipulation"
      >
        Khám phá ngay
      </Link>
    </div>
  );
}
