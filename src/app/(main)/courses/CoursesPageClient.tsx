'use client';

import { useState, useMemo } from 'react';
import { CategoryFilter } from '@/components/course/CategoryFilter';
import { CourseGrid } from '@/components/course/CourseGrid';
import type { Course } from '@/types';

interface Props {
  initialCourses: Course[];
  initialCategory: string;
  initialQuery: string;
}

/**
 * Client logic cho trang danh sách khóa học
 * Tách riêng để page.tsx có thể là server component
 */
export function CoursesPageClient({ initialCourses, initialCategory, initialQuery }: Props) {
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest' | 'price-asc' | 'price-desc'>('popular');

  const filteredCourses = useMemo(() => {
    let result = initialCourses;

    if (category !== 'all') {
      result = result.filter((c) => c.category.slug === category);
    }

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.instructor.name.toLowerCase().includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.averageRating - a.averageRating;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        default:
          return b.totalStudents - a.totalStudents;
      }
    });

    return result;
  }, [initialCourses, category, query, sortBy]);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-2 sm:mb-3 font-display">
            Khám phá khóa học
          </h1>
          <p className="text-neutral-600">
            Hơn {initialCourses.length}+ khóa học chất lượng đang chờ bạn
          </p>
        </div>

        <div className="mb-8">
          <CategoryFilter selected={category} onSelect={setCategory} />
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-neutral-600">
            <strong className="text-black">{filteredCourses.length}</strong> khóa học
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 bg-neutral-100 rounded-full text-sm font-medium outline-none"
          >
            <option value="popular">Phổ biến nhất</option>
            <option value="rating">Đánh giá cao nhất</option>
            <option value="newest">Mới nhất</option>
            <option value="price-asc">Giá thấp đến cao</option>
            <option value="price-desc">Giá cao đến thấp</option>
          </select>
        </div>

        <CourseGrid courses={filteredCourses} emptyMessage="Không tìm thấy khóa học phù hợp" />
      </div>
    </div>
  );
}
