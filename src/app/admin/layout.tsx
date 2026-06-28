import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

/**
 * Admin layout
 * Chỉ user có role ADMIN mới truy cập được
 * Có sidebar navigation riêng, không có header/footer của site
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin');
  }

  if ((session.user as any).role !== 'ADMIN') {
    redirect('/'); // Không phải admin -> về home
  }

  return (
    <div className="min-h-screen bg-muted/40 flex">
      {/* Sidebar: full on lg+, hidden on mobile (admin = power user tool, tablet/desktop only) */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>
      {/* Mobile: top bar with back link instead of sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3">
        <a href="/" className="text-yellow-400 font-black text-lg">Lumina</a>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm text-neutral-300 font-medium">Admin</span>
      </div>
      <main className="flex-1 p-4 pt-16 sm:p-6 lg:pt-6 lg:p-8 xl:p-12 overflow-auto">
        {children}
      </main>
    </div>
  );
}
