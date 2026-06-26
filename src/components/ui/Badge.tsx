import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full',
  {
    variants: {
      variant: {
        bestseller: 'bg-yellow-400 text-black',
        new: 'bg-green-500 text-white',
        hot: 'bg-red-500 text-white',
        category: 'bg-white/10 text-white',
        discount: 'bg-red-100 text-red-700',
        preview: 'bg-blue-100 text-blue-700',
      },
    },
    defaultVariants: {
      variant: 'bestseller',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
