'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Heart, Sparkles, X, Menu } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { UserMenu } from './UserMenu';

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
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-black rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" strokeWidth={2.5} />
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
                  className={`text-sm font-medium transition-colors ${
                    pathname.startsWith(l.href)
                      ? 'text-black font-bold'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Desktop search bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:block">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Tìm khóa học, giảng viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-neutral-100 border-2 border-transparent focus:border-black focus:bg-white rounded-full text-sm font-medium outline-none transition-all"
                />
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile search button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
                aria-label="Tìm kiếm"
              >
                <Search className="w-5 h-5 text-neutral-700" />
              </button>

              {/* Wishlist — hidden on small mobile */}
              <Link
                href="/wishlist"
                className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-100 relative"
                aria-label="Wishlist"
              >
                <Heart
                  className={`w-5 h-5 ${
                    mounted && wishlistCount > 0 ? 'fill-red-500 text-red-500' : 'text-neutral-700'
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
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-100 active:bg-neutral-200 relative"
                aria-label="Giỏ hàng"
              >
                <ShoppingCart className="w-5 h-5 text-neutral-700" />
                {mounted && cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User menu — desktop */}
              <div className="hidden sm:block">
                <UserMenu />
              </div>

              {/* Hamburger — mobile */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="sm:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5 text-neutral-700" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col md:hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Tìm khóa học, giảng viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-100 rounded-full text-sm font-medium outline-none"
                />
              </div>
            </form>
            <button
              onClick={() => setSearchOpen(false)}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Quick links */}
          <div className="px-4 py-6">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
              Gợi ý
            </p>
            {['React.js', 'Python cơ bản', 'Thiết kế UI/UX', 'Marketing Online', 'Tiếng Anh'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  router.push(`/courses?q=${encodeURIComponent(term)}`);
                  setSearchOpen(false);
                }}
                className="flex items-center gap-3 w-full py-3 text-sm text-left hover:text-black text-neutral-600 border-b border-neutral-50"
              >
                <Search className="w-4 h-4 text-neutral-300" />
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
          <div className="fixed inset-y-0 right-0 z-[70] w-72 bg-white shadow-2xl sm:hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <span className="font-black text-lg">Menu</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100"
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
                  className={`flex items-center gap-3 px-3 py-4 rounded-xl mb-1 text-base font-medium transition-colors ${
                    pathname.startsWith(l.href)
                      ? 'bg-black text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {l.label}
                </Link>
              ))}

              <div className="border-t border-neutral-100 mt-4 pt-4">
                <Link
                  href="/wishlist"
                  className="flex items-center gap-3 px-3 py-4 rounded-xl mb-1 text-base font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  <Heart className="w-5 h-5" />
                  Yêu thích
                  {mounted && wishlistCount > 0 && (
                    <span className="ml-auto bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </div>
            </nav>

            {/* User section at bottom */}
            <div className="border-t border-neutral-100 p-4">
              <UserMenu />
            </div>
          </div>
        </>
      )}
    </>
  );
}
