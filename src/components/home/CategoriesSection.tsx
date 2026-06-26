import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';
import { MOCK_COURSES } from '@/data/courses';

export function CategoriesSection() {
  // Count courses per category for display
  const countByCategory = MOCK_COURSES.reduce<Record<string, number>>((acc, c) => {
    acc[c.category.slug] = (acc[c.category.slug] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="py-12 sm:py-20 max-w-[1400px] mx-auto px-4 sm:px-6">
      <div className="flex items-end justify-between mb-6 sm:mb-12">
        <div>
          <p className="text-xs sm:text-sm font-bold text-yellow-600 mb-1 sm:mb-2 tracking-wider uppercase">
            Danh mục
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-display">
            Bạn muốn học gì?
          </h2>
        </div>
        <Link
          href="/courses"
          className="hidden md:flex items-center gap-2 text-sm font-bold hover:gap-3 transition-all touch-manipulation"
        >
          Xem tất cả
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Mobile: 2 columns, Tablet: 4, Desktop: 7 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        {CATEGORIES.slice(1).map((cat) => {
          const Icon = cat.icon;
          const count = countByCategory[cat.slug] ?? 0;
          return (
            <Link
              key={cat.slug}
              href={`/courses?category=${cat.slug}`}
              className="group relative p-4 sm:p-6 bg-neutral-50 hover:bg-black active:bg-black rounded-2xl transition-all duration-300 hover:-translate-y-1 touch-manipulation"
            >
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2 sm:mb-3"
                style={{ backgroundColor: cat.color + '20' }}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: cat.color }} />
              </div>
              <p className="text-xs sm:text-sm font-bold text-left group-hover:text-white transition-colors leading-snug">
                {cat.name}
              </p>
              {count > 0 && (
                <p className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors mt-0.5">
                  {count} khóa học
                </p>
              )}
            </Link>
          );
        })}
      </div>

      {/* Mobile: Xem tất cả link */}
      <div className="md:hidden mt-4 text-center">
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-sm font-bold hover:gap-3 transition-all touch-manipulation"
        >
          Xem tất cả khóa học
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
