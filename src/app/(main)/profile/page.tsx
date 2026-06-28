'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BookOpen, Heart, Trophy, CreditCard,
  User, Lock, Bell, ChevronRight, LogOut, Sparkles
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';

function MenuItem({
  icon: Icon, label, href, destructive = false
}: {
  icon: typeof BookOpen;
  label: string;
  href?: string;
  destructive?: boolean;
}) {
  const cls = `flex items-center gap-4 px-4 py-4 bg-card hover:bg-muted/40 active:bg-muted transition-colors touch-manipulation border-b border-neutral-50 last:border-0 ${destructive ? 'text-red-600' : 'text-foreground'}`;

  if (href) {
    return (
      <Link href={href} className={cls}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${destructive ? 'bg-red-50 dark:bg-red-950/30' : 'bg-muted'}`}>
          <Icon className={`w-4 h-4 ${destructive ? 'text-red-500' : 'text-muted-foreground'}`} />
        </div>
        <span className="flex-1 text-sm font-medium">{label}</span>
        {!destructive && <ChevronRight className="w-4 h-4 text-neutral-300" />}
      </Link>
    );
  }
  return null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === 'unauthenticated') {
    redirect('/login?callbackUrl=/profile');
  }

  const user = session?.user as any;

  const stats = [
    { label: 'Khóa học', value: '3', icon: '📚' },
    { label: 'Hoàn thành', value: '1', icon: '🏆' },
    { label: 'Giờ học', value: '24h', icon: '⏱️' },
    { label: 'Chứng chỉ', value: '1', icon: '🎓' },
  ];

  return (
    <div className="bg-muted/40 min-h-screen">
      {/* Hero */}
      <div className="bg-primary text-primary-foreground px-4 sm:px-6 pt-8 pb-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="profile-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="1" fill="#fff" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#profile-grid)" />
          </svg>
        </div>
        <div className="relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-yellow-400 flex items-center justify-center text-black font-black text-3xl sm:text-4xl mx-auto mb-4 shadow-2xl">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <h1 className="text-xl sm:text-2xl font-black mb-1">{user?.name ?? 'Học viên'}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-xs font-bold text-yellow-400">
            <Sparkles className="w-3 h-3" />
            {user?.role === 'INSTRUCTOR' ? 'Giảng viên' : user?.role === 'ADMIN' ? 'Admin' : 'Học viên'}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-8 mb-6">
        <div className="bg-card rounded-2xl shadow-lg grid grid-cols-4 divide-x divide-border">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center py-4 px-2">
              <span className="text-lg mb-0.5">{s.icon}</span>
              <span className="text-base sm:text-xl font-black">{s.value}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Menu groups */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-3">
        {/* Learning */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            Học tập
          </p>
          <div className="rounded-2xl overflow-hidden border border-border">
            <MenuItem icon={BookOpen} label="Khóa học của tôi" href="/my-learning" />
            <MenuItem icon={Heart} label="Yêu thích" href="/wishlist" />
            <MenuItem icon={Trophy} label="Thành tích & chứng chỉ" href="/my-learning" />
          </div>
        </div>

        {/* Account */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            Tài khoản
          </p>
          <div className="rounded-2xl overflow-hidden border border-border">
            <MenuItem icon={User} label="Chỉnh sửa hồ sơ" href="/profile/edit" />
            <MenuItem icon={Lock} label="Đổi mật khẩu" href="/forgot-password" />
            <MenuItem icon={CreditCard} label="Lịch sử thanh toán" href="/profile/payments" />
            <MenuItem icon={Bell} label="Thông báo" href="/profile/notifications" />
          </div>
        </div>

        {/* Instructor */}
        {user?.role === 'INSTRUCTOR' && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-2">
              Giảng dạy
            </p>
            <div className="rounded-2xl overflow-hidden border border-border">
              <MenuItem icon={Sparkles} label="Trang quản lý khóa học" href="/teach/dashboard" />
            </div>
          </div>
        )}

        {/* Sign out */}
        <div className="rounded-2xl overflow-hidden border border-red-100">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-4 w-full px-4 py-4 bg-card hover:bg-red-50 dark:bg-red-950/30 active:bg-red-100 dark:bg-red-950/40 transition-colors touch-manipulation"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-50 dark:bg-red-950/30">
              <LogOut className="w-4 h-4 text-red-500" />
            </div>
            <span className="flex-1 text-sm font-medium text-red-600 text-left">Đăng xuất</span>
          </button>
        </div>

        <p className="text-xs text-center text-muted-foreground py-4">
          Lumina Academy v1.0 • Made with ❤️ in Vietnam
        </p>
      </div>
    </div>
  );
}
