'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  /** Lựa chọn của user (light/dark/system) */
  theme: Theme;
  /** Theme thực tế đang áp dụng (light hoặc dark) */
  resolvedTheme: 'light' | 'dark';
  setTheme: (t: Theme) => void;
  /** Xoay vòng nhanh light ↔ dark (dùng cho nút toggle 1 chạm) */
  toggleTheme: () => void;
}

const STORAGE_KEY = 'lumina-theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && systemDark);
  root.classList.toggle('dark', isDark);
  // Set inline ngay để nền đúng kể cả trước khi CSS bundle áp (tránh nháy)
  root.style.colorScheme = isDark ? 'dark' : 'light';
  root.style.backgroundColor = isDark ? '#121212' : '#ffffff';
  return isDark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Đọc lựa chọn đã lưu khi mount (script inline đã set class trước paint)
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system';
    setThemeState(stored);
    setResolvedTheme(applyTheme(stored));
  }, []);

  // Theo dõi thay đổi của hệ thống khi đang ở chế độ "system"
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setResolvedTheme(applyTheme('system'));
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t);
    setThemeState(t);
    setResolvedTheme(applyTheme(t));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme phải được dùng bên trong <ThemeProvider>');
  return ctx;
}

/**
 * Script chạy trước khi React hydrate để set class `dark` ngay lập tức,
 * tránh nhấp nháy (FOUC). Inject vào <head>.
 */
export const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem('${STORAGE_KEY}') || 'system';
    var d = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = t === 'dark' || (t === 'system' && d);
    var el = document.documentElement;
    if (dark) el.classList.add('dark');
    // Set màu nền + color-scheme inline ngay lập tức → không nháy sáng trước khi CSS load
    el.style.colorScheme = dark ? 'dark' : 'light';
    el.style.backgroundColor = dark ? '#121212' : '#ffffff';
  } catch (e) {}
})();
`;
