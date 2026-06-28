import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-bold rounded-full transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none touch-manipulation active:scale-[0.97]',
  {
    variants: {
      variant: {
        primary:   'bg-primary text-primary-foreground shadow-soft hover:shadow-elevated hover:-translate-y-0.5',
        secondary: 'bg-card border-2 border-foreground text-foreground hover:bg-muted',
        accent:    'bg-accent text-accent-foreground shadow-soft hover:shadow-glow hover:-translate-y-0.5',
        ghost:     'text-muted-foreground hover:bg-muted hover:text-foreground active:bg-border',
        outline:   'border-2 border-border text-foreground hover:border-foreground hover:bg-muted/50',
        danger:    'bg-red-500 text-white shadow-soft hover:bg-red-600',
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
