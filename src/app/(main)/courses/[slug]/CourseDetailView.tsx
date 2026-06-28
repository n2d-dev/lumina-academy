'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ChevronLeft, Star, Users, Play, Heart, Flame,
  PlayCircle, FileText, Download, Award, Globe,
  CheckCircle2, Trophy
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { GRADIENTS } from '@/lib/constants';
import { formatPrice, formatNumber, calculateDiscount, formatDuration } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { CourseTabs } from '@/components/course/CourseTabs';
import type { Course } from '@/types';

interface Props {
  course: Course;
}

export function CourseDetailView({ course }: Props) {
  const router = useRouter();
  const { addItem, isInCart } = useCartStore();
  const { isInWishlist, toggle: toggleWishlist } = useWishlistStore();

  const inCart = isInCart(course.id);
  const inWishlist = isInWishlist(course.id);
  const discount = course.originalPrice
    ? calculateDiscount(course.originalPrice, course.price)
    : 0;

  const handleAddToCart = () => {
    addItem(course);
    toast.success('Đã thêm vào giỏ hàng');
    router.push('/cart');
  };

  const handleBuyNow = () => {
    addItem(course);
    router.push('/checkout');
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Hero — banner tối cố định (KHÔNG dùng bg-primary vì token này đảo
          màu theo theme → ở dark mode sẽ thành nền trắng). Thêm quầng amber. */}
      <div className="relative overflow-hidden bg-neutral-950 text-white">
        <div
          className="pointer-events-none absolute -top-32 right-[-5%] h-[420px] w-[420px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.18), transparent 70%)' }}
        />
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-12">
          <Link
            href="/courses"
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại danh sách
          </Link>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left: course info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                {course.isBestseller && <Badge variant="bestseller">BESTSELLER</Badge>}
                <Badge variant="category">{course.category.name}</Badge>
              </div>

              <h1 className="text-3xl lg:text-5xl font-black mb-4 leading-tight font-display">
                {course.title}
              </h1>

              <p className="text-lg text-white/70 mb-6 leading-relaxed">
                {course.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-400 tabular-nums">{course.averageRating.toFixed(1)}</span>
                  <StarRating rating={course.averageRating} />
                  <span className="text-white/60 tabular-nums">
                    ({formatNumber(course.totalReviews)} đánh giá)
                  </span>
                </div>
                <span className="text-white/40">•</span>
                <span className="flex items-center gap-1.5 text-white/70">
                  <Users className="w-4 h-4" />
                  <span className="tabular-nums">{formatNumber(course.totalStudents)}</span> học viên
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                  {course.instructor.name[0]}
                </div>
                <div>
                  <p className="text-sm text-white/80">
                    Giảng dạy bởi{' '}
                    <strong className="text-amber-400">{course.instructor.name}</strong>
                  </p>
                  <p className="text-xs text-white/50">{course.instructor.title}</p>
                </div>
              </div>
            </div>

            {/* Right: purchase card — desktop only */}
            <div className="hidden lg:block">
              <div className="bg-card rounded-3xl overflow-hidden text-foreground sticky top-24">
                <div
                  className="aspect-video relative"
                  style={{ background: GRADIENTS[course.thumbnail ?? 'gradient-blue'] }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="w-20 h-20 bg-card rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-2xl">
                      <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-3xl font-black tabular-nums">{formatPrice(course.price)}</span>
                    {course.originalPrice && (
                      <span className="text-muted-foreground line-through tabular-nums">
                        {formatPrice(course.originalPrice)}
                      </span>
                    )}
                  </div>
                  {discount > 0 && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-950/40 text-red-700 text-xs font-bold rounded mb-4">
                      <Flame className="w-3 h-3" />
                      Giảm {discount}% • Còn 2 ngày
                    </div>
                  )}

                  <button
                    onClick={handleAddToCart}
                    className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 active:scale-95 transition-all mb-3 touch-manipulation"
                  >
                    {inCart ? 'Xem trong giỏ hàng' : 'Thêm vào giỏ hàng'}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    className="w-full py-4 bg-accent text-accent-foreground font-bold rounded-full hover:brightness-95 active:scale-95 transition-all mb-3 touch-manipulation"
                  >
                    Mua ngay
                  </button>

                  <button
                    onClick={() => toggleWishlist(course.id)}
                    className="w-full py-3 border-2 border-border font-bold rounded-full hover:border-foreground active:scale-95 transition-all flex items-center justify-center gap-2 mb-6 touch-manipulation"
                  >
                    <Heart className={`w-4 h-4 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                    {inWishlist ? 'Đã yêu thích' : 'Thêm vào yêu thích'}
                  </button>

                  <CourseIncludes course={course} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CourseTabs course={course} />

      {/* Mobile sticky bottom CTA — only shows on mobile (<lg) */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border px-4 py-3 flex items-center gap-3"
        style={{ paddingBottom: 'max(12px, calc(env(safe-area-inset-bottom) + 52px + 12px))' }}
      >
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black tabular-nums">{formatPrice(course.price)}</span>
            {course.originalPrice && (
              <span className="text-xs text-muted-foreground line-through tabular-nums">
                {formatPrice(course.originalPrice)}
              </span>
            )}
          </div>
          {discount > 0 && (
            <span className="text-xs text-red-600 font-bold">Giảm {discount}%</span>
          )}
        </div>
        <button
          onClick={() => toggleWishlist(course.id)}
          className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-border active:scale-90 transition-all touch-manipulation flex-shrink-0"
          aria-label="Yêu thích"
        >
          <Heart className={`w-5 h-5 ${inWishlist ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
        </button>
        <button
          onClick={handleAddToCart}
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-full active:scale-95 transition-all touch-manipulation text-sm flex-shrink-0"
        >
          {inCart ? 'Xem giỏ hàng' : 'Thêm vào giỏ'}
        </button>
      </div>
    </div>
  );
}

function CourseIncludes({ course }: { course: Course }) {
  const items = [
    { icon: PlayCircle, text: `${formatDuration(course.totalDuration)} video on-demand` },
    { icon: FileText, text: `${course.totalLectures} bài giảng` },
    { icon: Download, text: 'Tài liệu tải về' },
    { icon: Award, text: 'Chứng chỉ hoàn thành' },
    { icon: Globe, text: 'Truy cập trọn đời' },
  ];

  return (
    <div className="space-y-3 text-sm">
      <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">
        Khóa học bao gồm
      </p>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <item.icon className="w-4 h-4 text-muted-foreground" />
          <span>{item.text}</span>
        </div>
      ))}
    </div>
  );
}
