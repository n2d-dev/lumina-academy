'use client';

import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
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
    <div className="bg-background min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
        <div className="mb-8 sm:mb-12">
          <span className="eyebrow mb-4">Thư viện khóa học</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mt-3 mb-2 sm:mb-3 font-display">
            Khám phá khóa học
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Hơn {initialCourses.length}+ khóa học chất lượng đang chờ bạn
          </p>
        </div>

        <div className="mb-8 sm:mb-10">
          <CategoryFilter selected={category} onSelect={setCategory} />
        </div>

        <div className="flex items-center justify-between gap-4 mb-6">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground tabular-nums">{filteredCourses.length}</strong> khóa học
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="course-sort" className="text-sm text-muted-foreground hidden sm:inline">
              Sắp xếp
            </label>
            <div className="relative">
              <select
                id="course-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="appearance-none pl-4 pr-10 py-2 bg-card border border-border rounded-full text-sm font-medium cursor-pointer outline-none transition-colors hover:border-foreground/20"
              >
                <option value="popular">Phổ biến nhất</option>
                <option value="rating">Đánh giá cao nhất</option>
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá thấp đến cao</option>
                <option value="price-desc">Giá cao đến thấp</option>
              </select>
              <ChevronDown
                className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <CourseGrid courses={filteredCourses} emptyMessage="Không tìm thấy khóa học phù hợp" />
      </div>
    </div>
  );
}
