import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** CTA chính — giúp user thoát khỏi trạng thái rỗng */
  action?: EmptyStateAction;
  className?: string;
}

/**
 * Trạng thái rỗng tái sử dụng: icon + tiêu đề + mô tả + CTA.
 * Dùng cho giỏ hàng rỗng, chưa có khóa học, danh sách trống...
 * Theo UX guideline `empty-states`: luôn có thông điệp hữu ích + hành động.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 py-16 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <Icon className="w-8 h-8 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
      </div>
      <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1.5">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      )}
      {action &&
        (action.href ? (
          <Link href={action.href}>
            <Button variant="primary">{action.label}</Button>
          </Link>
        ) : (
          <Button variant="primary" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </div>
  );
}
