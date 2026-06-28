'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { BookOpen, Edit3, Settings, LogOut, LogIn } from 'lucide-react';

/**
 * User menu dropdown
 * Hiển thị nếu đã login, nếu không hiển thị nút đăng nhập
 */
export function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="ml-2 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-bold hover:bg-primary/90"
      >
        <LogIn className="w-4 h-4" />
        Đăng nhập
      </Link>
    );
  }

  const initials =
    session.user.name
      ?.split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('') ?? 'U';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="ml-2"
        aria-label="Mở menu tài khoản"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
          {initials}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-72 bg-card text-card-foreground rounded-2xl shadow-2xl border border-border overflow-hidden">
          <div className="p-5 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/40 dark:to-orange-950/40">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold">
                {initials}
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">{session.user.name}</p>
                <p className="text-xs text-muted-foreground">{session.user.email}</p>
              </div>
            </div>
          </div>
          <div className="p-2">
            <Link
              href="/my-learning"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted rounded-lg text-sm"
            >
              <BookOpen className="w-4 h-4" /> Học tập của tôi
            </Link>
            <Link
              href="/teach"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted rounded-lg text-sm"
            >
              <Edit3 className="w-4 h-4" /> Khóa học của tôi
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted rounded-lg text-sm"
            >
              <Settings className="w-4 h-4" /> Cài đặt
            </Link>
            <div className="my-2 border-t border-border" />
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted rounded-lg text-sm text-red-600"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
