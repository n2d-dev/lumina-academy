'use client';

import Link from 'next/link';
import { Heart, Clock, PlayCircle, Play } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { GRADIENTS } from '@/lib/constants';
import { formatPrice, formatDuration } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import type { Course } from '@/types';

const formatNumber = (num: number) =>
  Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(course.id));
  const toggle = useWishlistStore((s) => s.toggle);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(course.id);
  };

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block transition-transform duration-300 hover:-translate-y-1"
    >
      {/* Thumbnail */}
      <div
        className="relative overflow-hidden rounded-xl sm:rounded-2xl mb-3 sm:mb-4 aspect-[16/10] shadow-sm group-hover:shadow-xl group-hover:shadow-foreground/[0.08] transition-shadow duration-300"
        style={{ background: GRADIENTS[course.thumbnail ?? 'gradient-blue'] }}
      >
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all" />

        <div className="absolute inset-0 opacity-30">
          <svg width="100%" height="100%">
            <defs>
              <pattern id={`p-${course.id}`} width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#p-${course.id})`} />
          </svg>
        </div>

        {course.isBestseller && (
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
            <Badge variant="bestseller">BESTSELLER</Badge>
          </div>
        )}

        <button
          onClick={handleWishlistClick}
          aria-label="Toggle wishlist"
          className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-11 sm:h-11 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform touch-manipulation"
        >
          <Heart
            className={`w-3 h-3 sm:w-4 sm:h-4 ${
              isInWishlist ? 'fill-red-500 text-red-500' : 'text-neutral-700'
            }`}
            strokeWidth={2.5}
          />
        </button>

        <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-8 h-8 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
          <Play className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-black ml-0.5" fill="currentColor" />
        </div>
      </div>

      {/* Content */}
      <div>
        <h3 className="font-bold text-xs sm:text-base leading-tight mb-1 sm:mb-2 line-clamp-2 group-hover:text-yellow-600 transition-colors">
          {course.title}
        </h3>

        <p className="text-xs text-muted-foreground mb-1 sm:mb-2 truncate">{course.instructor.name}</p>

        <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-3">
          <span className="font-bold text-amber-600 text-xs">
            {course.averageRating.toFixed(1)}
          </span>
          <StarRating rating={course.averageRating} size="sm" />
          <span className="text-xs text-muted-foreground hidden sm:inline">
            ({formatNumber(course.totalReviews)})
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(course.totalDuration)}
          </span>
          <span className="flex items-center gap-1">
            <PlayCircle className="w-3 h-3" />
            {course.totalLectures} bài
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="text-sm sm:text-lg font-black">{formatPrice(course.price)}</span>
          {course.originalPrice && course.originalPrice > course.price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(course.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
