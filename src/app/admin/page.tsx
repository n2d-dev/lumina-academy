import { Users, BookOpen, ShoppingBag, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { formatPrice, formatNumber } from '@/lib/utils';

/**
 * Admin Dashboard - tổng quan doanh thu, users, courses, orders
 *
 * Production: query data từ database
 *   const stats = await Promise.all([
 *     prisma.user.count(),
 *     prisma.course.count({ where: { status: 'PUBLISHED' } }),
 *     prisma.payment.count({ where: { status: 'COMPLETED' } }),
 *     prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } }),
 *   ]);
 */
export default function AdminDashboard() {
  // Mock data
  const stats = [
    {
      label: 'Tổng người dùng',
      value: formatNumber(2483920),
      change: 12.5,
      icon: Users,
      color: '#0066ff',
    },
    {
      label: 'Khóa học',
      value: formatNumber(15234),
      change: 8.2,
      icon: BookOpen,
      color: '#ff3366',
    },
    {
      label: 'Đơn hàng tháng',
      value: formatNumber(8492),
      change: 23.1,
      icon: ShoppingBag,
      color: '#10b981',
    },
    {
      label: 'Doanh thu tháng',
      value: formatPrice(8920000000),
      change: 15.7,
      icon: DollarSign,
      color: '#facc15',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2 font-display">Dashboard</h1>
        <p className="text-neutral-600">Tổng quan hoạt động của Lumina Academy</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.change > 0;

          return (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-6 border border-neutral-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: stat.color + '20' }}
                >
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full',
                    isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(stat.change)}%
                </div>
              </div>
              <p className="text-3xl font-black mb-1 font-display">{stat.value}</p>
              <p className="text-sm text-neutral-600">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-neutral-100">
          <h2 className="font-bold text-lg mb-4">Đơn hàng gần đây</h2>
          <p className="text-sm text-neutral-500">
            Trong production sẽ hiển thị 10 đơn hàng gần nhất với status, amount, customer.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-neutral-100">
          <h2 className="font-bold text-lg mb-4">Khóa học bán chạy</h2>
          <p className="text-sm text-neutral-500">
            Top 5 khóa học có doanh thu cao nhất trong 30 ngày qua.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper inline để tránh import cn (Server Component)
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
