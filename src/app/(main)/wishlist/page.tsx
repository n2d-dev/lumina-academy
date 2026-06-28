'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { MOCK_COURSES } from '@/data/courses';
import { CourseGrid } from '@/components/course/CourseGrid';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * Wishlist page
 * Hiển thị các khóa học user đã thêm vào danh sách yêu thích
 */
export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const wishlistIds = useWishlistStore((s) => s.items);
  const wishlistCourses = MOCK_COURSES.filter((c) => wishlistIds.includes(c.id));

  if (!mounted) return null;

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-black mb-6 sm:mb-8 font-display">Danh sách yêu thích</h1>

        {wishlistCourses.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Chưa có khóa học yêu thích"
            description="Thêm khóa học vào danh sách để xem lại sau này."
            action={{ label: 'Khám phá ngay', href: '/courses' }}
          />
        ) : (
          <CourseGrid courses={wishlistCourses} />
        )}
      </div>
    </div>
  );
}
