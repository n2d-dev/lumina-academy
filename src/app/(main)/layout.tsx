import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';

/**
 * Layout group cho các trang chính (có header + footer)
 * Tách biệt với các route khác như /learn (immersive) và /admin
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* pb-16 sm:pb-0 → nhường chỗ cho bottom nav trên mobile */}
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <Footer />
      <BottomNav />
    </div>
  );
}
