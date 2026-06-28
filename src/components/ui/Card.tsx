import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Bật hiệu ứng nâng + đổ bóng khi hover (cho card có thể click) */
  interactive?: boolean;
}

/**
 * Card — surface chuẩn: nền card + viền + bo góc + bóng mềm.
 * Thay cho việc lặp `bg-card border border-border rounded-2xl` khắp nơi.
 */
export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card shadow-soft',
        interactive &&
          'transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated hover:border-foreground/15',
        className
      )}
      {...props}
    />
  );
}
