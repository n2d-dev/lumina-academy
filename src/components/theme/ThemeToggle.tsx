'use client';

import { Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';

/**
 * Nút bật/tắt dark mode (1 chạm: light ↔ dark).
 * Tránh hydration mismatch bằng cách chỉ render icon sau khi mounted.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted active:bg-border transition-colors ${className}`}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={isDark ? 'Giao diện sáng' : 'Giao diện tối'}
    >
      {mounted && isDark ? (
        <Sun className="w-5 h-5 text-muted-foreground" />
      ) : (
        <Moon className="w-5 h-5 text-muted-foreground" />
      )}
    </button>
  );
}
