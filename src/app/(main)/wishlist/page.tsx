'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { MOCK_COURSES } from '@/data/courses';
import { CourseGrid } from '@/components/course/CourseGrid';

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
    <div className="bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-black mb-6 sm:mb-8 font-display">Danh sách yêu thích</h1>

        {wishlistCourses.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Chưa có khóa học yêu thích</h2>
            <p className="text-neutral-600 mb-6">Thêm khóa học vào danh sách để xem sau</p>
            <Link
              href="/courses"
              className="inline-block px-6 py-3 bg-black text-white font-bold rounded-full"
            >
              Khám phá ngay
            </Link>
          </div>
        ) : (
          <CourseGrid courses={wishlistCourses} />
        )}
      </div>
    </div>
  );
}
