import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-bold rounded-full transition-all disabled:opacity-50 disabled:pointer-events-none touch-manipulation',
  {
    variants: {
      variant: {
        primary:   'bg-black text-white hover:bg-neutral-800 hover:scale-[1.02] active:scale-95',
        secondary: 'bg-white border-2 border-black text-black hover:bg-neutral-50 active:scale-95',
        accent:    'bg-yellow-400 text-black hover:bg-yellow-500 active:scale-95',
        ghost:     'hover:bg-neutral-100 active:bg-neutral-200 text-neutral-700',
        outline:   'border-2 border-neutral-200 hover:border-black active:scale-95',
        danger:    'bg-red-500 text-white hover:bg-red-600 active:scale-95',
      },
      size: {
        sm:   'px-4 py-2 text-sm',
        md:   'px-6 py-3 text-sm',
        lg:   'px-8 py-4 text-base',
        icon: 'w-11 h-11',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
