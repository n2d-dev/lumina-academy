import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Container — bề rộng tối đa + gutter responsive nhất quán cho toàn site.
 * Dùng thay cho việc lặp `max-w-[...] mx-auto px-...` ở mỗi trang.
 */
export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mx-auto w-full max-w-[1280px] px-5 sm:px-6 lg:px-8', className)}
      {...props}
    />
  );
}
