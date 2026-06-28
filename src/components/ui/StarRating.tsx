import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function StarRating({ rating, size = 'sm', className }: StarRatingProps) {
  return (
    <div className={cn('flex', className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            sizeMap[size],
            i <= Math.floor(rating)
              ? 'fill-amber-500 text-amber-500'
              : 'text-border'
          )}
        />
      ))}
    </div>
  );
}
