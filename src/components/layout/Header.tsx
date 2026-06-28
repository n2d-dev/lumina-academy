'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Heart, Sparkles, X, Menu } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

/**
 * Mobile-first Header.
 *
 * Breakpoints:
 *   mobile (<md):  logo + search icon + cart + hamburger
 *   tablet (md):   logo + search bar + cart + wishlist + user menu
 *   desktop (lg):  + full nav links
 *
 * Mobile drawer: slide-in từ phải, overlay backdrop.
 * Search overlay: full-screen trên mobile, inline trên tablet+.
 */
export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  // Đóng drawer khi navigate
  useEffect(() => setDrawerOpen(false), [pathname]);

  // Focus search input khi mở
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const cartCount = useCartStore((s) => s.items.length);
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/courses?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { href: '/courses', label: 'Khám phá' },
    { href: '/teach', label: 'Giảng dạy' },
    { href: '/my-learning', label: 'Học tập của tôi' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-black" strokeWidth={2.5} />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight font-display">
                Lumina<span className="text-yellow-500">.</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={pathname.startsWith(l.href) ? 'page' : undefined}
                  className={`text-sm font-medium transition-colors ${
                    pathname.startsWith(l.href)
                      ? 'text-foreground font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Desktop search bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:block">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm khóa học, giảng viên..."
                  aria-label="Tìm khóa học, giảng viên"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-muted text-foreground border-2 border-transparent focus:border-foreground focus:bg-card rounded-full text-sm font-medium outline-none transition-all"
                />
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile search button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted active:bg-border transition-colors"
                aria-label="Tìm kiếm"
              >
                <Search className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* Wishlist — hidden on small mobile */}
              <Link
                href="/wishlist"
                className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted relative"
                aria-label="Wishlist"
              >
                <Heart
                  className={`w-5 h-5 ${
                    mounted && wishlistCount > 0 ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                  }`}
                />
                {mounted && wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted active:bg-border relative"
                aria-label="Giỏ hàng"
              >
                <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                {mounted && cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Theme toggle */}
              <ThemeToggle />

              {/* User menu — desktop */}
              <div className="hidden sm:block">
                <UserMenu />
              </div>

              {/* Hamburger — mobile */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="sm:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted active:bg-border transition-colors"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-background flex flex-col md:hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Tìm khóa học, giảng viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-muted text-foreground rounded-full text-sm font-medium outline-none"
                />
              </div>
            </form>
            <button
              onClick={() => setSearchOpen(false)}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Quick links */}
          <div className="px-4 py-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Gợi ý
            </p>
            {['React.js', 'Python cơ bản', 'Thiết kế UI/UX', 'Marketing Online', 'Tiếng Anh'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  router.push(`/courses?q=${encodeURIComponent(term)}`);
                  setSearchOpen(false);
                }}
                className="flex items-center gap-3 w-full py-3 text-sm text-left hover:text-foreground text-muted-foreground border-b border-border"
              >
                <Search className="w-4 h-4 text-muted-foreground" />
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile nav drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/50 sm:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 z-[70] w-72 bg-background shadow-2xl sm:hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="font-black text-lg">Menu</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-4 py-4 overflow-y-auto">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={pathname.startsWith(l.href) ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3 py-4 rounded-xl mb-1 text-base font-medium transition-colors ${
                    pathname.startsWith(l.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {l.label}
                </Link>
              ))}

              <div className="border-t border-border mt-4 pt-4">
                <Link
                  href="/wishlist"
                  className="flex items-center gap-3 px-3 py-4 rounded-xl mb-1 text-base font-medium text-muted-foreground hover:bg-muted"
                >
                  <Heart className="w-5 h-5" />
                  Yêu thích
                  {mounted && wishlistCount > 0 && (
                    <span className="ml-auto bg-red-100 dark:bg-red-950/40 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </div>
            </nav>

            {/* User section at bottom */}
            <div className="border-t border-border p-4">
              <UserMenu />
            </div>
          </div>
        </>
      )}
    </>
  );
}
