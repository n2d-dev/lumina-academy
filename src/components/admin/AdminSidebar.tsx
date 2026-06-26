'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, Users, ShoppingBag,
  BarChart3, Settings, Sparkles, ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/courses', icon: BookOpen, label: 'Khóa học' },
  { href: '/admin/users', icon: Users, label: 'Người dùng' },
  { href: '/admin/orders', icon: ShoppingBag, label: 'Đơn hàng' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Phân tích' },
  { href: '/admin/settings', icon: Settings, label: 'Cài đặt' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-black text-white min-h-screen flex flex-col sticky top-0">
      <div className="p-6 border-b border-neutral-800">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-black" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-black text-lg font-display leading-none">Lumina</p>
            <p className="text-xs text-yellow-400 mt-1">Admin Panel</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium',
                isActive
                  ? 'bg-yellow-400 text-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-neutral-800">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-400 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
          Về trang chủ
        </Link>
      </div>
    </aside>
  );
}
