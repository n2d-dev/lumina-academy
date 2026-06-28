'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, BookOpen, ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useEffect, useState } from 'react';

/**
 * Bottom navigation bar — chỉ hiển thị trên mobile (< sm).
 *
 * Tap targets: 48px height mỗi item (Apple HIG minimum 44px).
 * Safe area bottom: padding-bottom env(safe-area-inset-bottom) cho iPhone notch.
 * Active indicator: dot + label đậm.
 */

const NAV_ITEMS = [
  { href: '/',            label: 'Trang chủ',  Icon: Home },
  { href: '/courses',     label: 'Khám phá',   Icon: Compass },
  { href: '/my-learning', label: 'Học tập',    Icon: BookOpen },
  { href: '/cart',        label: 'Giỏ hàng',   Icon: ShoppingCart },
  { href: '/profile',     label: 'Hồ sơ',      Icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const cartCount = useCartStore((s) => s.items.length);

  useEffect(() => setMounted(true), []);

  // Ẩn bottom nav trên các trang không cần (learn, admin, auth)
  const hide =
    pathname.startsWith('/learn/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  if (hide) return null;

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[52px] transition-colors relative ${
                isActive ? 'text-foreground' : 'text-muted-foreground active:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-all ${isActive ? 'scale-110' : ''}`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {/* Cart badge */}
                {href === '/cart' && mounted && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] leading-none transition-all ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}
              >
                {label}
              </span>
              {/* Active dot */}
              {isActive && (
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-foreground rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
