'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApi } from '@/hooks/useApi';
import { formatPrice, calculateDiscount } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  price: number;
  originalPrice: number | null;
}

const PRICE_TIERS = [
  { value: 0, label: 'Miễn phí', desc: 'Phù hợp cho khóa giới thiệu' },
  { value: 290000, label: '290.000đ', desc: 'Tier cơ bản' },
  { value: 590000, label: '590.000đ', desc: 'Tier phổ biến' },
  { value: 990000, label: '990.000đ', desc: 'Tier chuyên sâu' },
  { value: 1490000, label: '1.490.000đ', desc: 'Tier cao cấp' },
  { value: 1990000, label: '1.990.000đ', desc: 'Tier premium' },
];

export function PricingEditor({ course }: { course: Course }) {
  const { call, loading } = useApi();
  const [price, setPrice] = useState(course.price);
  const [originalPrice, setOriginalPrice] = useState<number | null>(
    course.originalPrice
  );
  const [customMode, setCustomMode] = useState(
    !PRICE_TIERS.some((t) => t.value === course.price)
  );

  const discount = originalPrice ? calculateDiscount(originalPrice, price) : 0;

  const handleSave = async () => {
    await call(
      `/api/instructor/courses/${course.id}`,
      {
        method: 'PATCH',
        body: { section: 'pricing', data: { price, originalPrice } },
      },
      { successMessage: 'Đã cập nhật giá' }
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black mb-2 font-display">Định giá khóa học</h1>
        <p className="text-neutral-600">
          Chọn mức giá phù hợp. Lumina giữ 30% phí nền tảng, bạn nhận 70% mỗi lần bán.
        </p>
      </div>

      {/* Price tiers */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-100 mb-6">
        <h3 className="font-bold mb-4">Chọn mức giá</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRICE_TIERS.map((tier) => (
            <button
              key={tier.value}
              onClick={() => {
                setPrice(tier.value);
                setCustomMode(false);
              }}
              className={`p-4 border-2 rounded-xl text-left transition-all ${
                !customMode && price === tier.value
                  ? 'border-black bg-neutral-50'
                  : 'border-neutral-200 hover:border-neutral-400'
              }`}
            >
              <p className="font-black text-lg font-display">{tier.label}</p>
              <p className="text-xs text-neutral-600 mt-1">{tier.desc}</p>
            </button>
          ))}
          <button
            onClick={() => setCustomMode(true)}
            className={`p-4 border-2 border-dashed rounded-xl text-center ${
              customMode
                ? 'border-black bg-neutral-50'
                : 'border-neutral-300 hover:border-black'
            }`}
          >
            <p className="font-bold">Tùy chỉnh</p>
            <p className="text-xs text-neutral-600 mt-1">Nhập giá khác</p>
          </button>
        </div>

        {customMode && (
          <div className="mt-4">
            <label className="text-sm font-bold mb-2 block">Giá tùy chỉnh (VND)</label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              min={0}
              step={10000}
              placeholder="Ví dụ: 1290000"
            />
          </div>
        )}
      </div>

      {/* Original price (for discount) */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-100 mb-6">
        <h3 className="font-bold mb-1">Giá gốc (tùy chọn)</h3>
        <p className="text-sm text-neutral-600 mb-4">
          Hiển thị giá gốc bị gạch ngang để show ưu đãi. Để trống nếu không dùng.
        </p>
        <Input
          type="number"
          value={originalPrice ?? ''}
          onChange={(e) =>
            setOriginalPrice(e.target.value ? Number(e.target.value) : null)
          }
          min={price}
          step={10000}
          placeholder="Ví dụ: 2590000"
        />
      </div>

      {/* Preview */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 mb-8 border border-yellow-200">
        <p className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-2">
          Xem trước
        </p>
        <h4 className="font-bold mb-3">{course.title}</h4>
        <div className="flex items-baseline gap-3">
          <span className="text-2xl sm:text-3xl font-black">
            {price === 0 ? 'Miễn phí' : formatPrice(price)}
          </span>
          {originalPrice && originalPrice > price && (
            <>
              <span className="text-neutral-400 line-through">
                {formatPrice(originalPrice)}
              </span>
              <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                -{discount}%
              </span>
            </>
          )}
        </div>
        {price > 0 && (
          <p className="text-sm text-neutral-700 mt-3">
            💰 Thu nhập của bạn: <strong>{formatPrice(Math.round(price * 0.7))}</strong> mỗi đơn (sau phí 30%)
          </p>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() =>
            (window.location.href = `/teach/courses/${course.id}/curriculum`)
          }
        >
          ← Quay lại
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSave} disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
          <Button
            onClick={async () => {
              await handleSave();
              window.location.href = `/teach/courses/${course.id}/settings`;
            }}
            disabled={loading}
          >
            Tiếp theo: Cài đặt →
          </Button>
        </div>
      </div>
    </div>
  );
}
