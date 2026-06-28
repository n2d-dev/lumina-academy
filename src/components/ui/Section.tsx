import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Container } from './Container';

/**
 * Section — nhịp dọc nhất quán giữa các khối nội dung.
 * `bleed` = true cho phép nền tràn viền (tự bọc Container bên trong).
 */
interface SectionProps extends HTMLAttributes<HTMLElement> {
  bleed?: boolean;
  containerClassName?: string;
}

export function Section({ className, bleed, containerClassName, children, ...props }: SectionProps) {
  const inner = bleed ? <Container className={containerClassName}>{children}</Container> : children;
  return (
    <section className={cn('py-16 sm:py-24', className)} {...props}>
      {inner}
    </section>
  );
}

/**
 * SectionHeading — eyebrow + tiêu đề + mô tả + action, căn trái hoặc giữa.
 * Chuẩn hoá phân cấp typography cho mọi tiêu đề khối.
 */
interface SectionHeadingProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'mb-10 sm:mb-14 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center text-center',
        className
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-black tracking-tight leading-[1.05]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
