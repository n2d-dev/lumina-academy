'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Plus, BookOpen, Users, DollarSign, TrendingUp,
  Edit, Eye, MoreVertical, Trash2
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BarChart, DonutChart } from '@/components/ui/Charts';
import { formatPrice, formatNumber } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  totalStudents: number;
  averageRating: number;
  price: number;
  category: { name: string };
  _count: { enrollments: number; sections: number };
}

interface Props {
  courses: Course[];
  totalEnrollments: number;
  totalRevenue: number;
}

export function DashboardClient({ courses, totalEnrollments, totalRevenue }: Props) {
  const router = useRouter();
  const { call, loading } = useApi();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const stats = [
    {
      label: 'Khóa học',
      value: formatNumber(courses.length),
      icon: BookOpen,
      color: '#0066ff',
    },
    {
      label: 'Học viên',
      value: formatNumber(totalEnrollments),
      icon: Users,
      color: '#10b981',
    },
    {
      label: 'Doanh thu',
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      color: '#facc15',
    },
    {
      label: 'Đánh giá TB',
      value: courses.length
        ? (courses.reduce((s, c) => s + c.averageRating, 0) / courses.length).toFixed(1)
        : '0.0',
      icon: TrendingUp,
      color: '#ec4899',
    },
  ];

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black mb-2 font-display">Khóa học của tôi</h1>
            <p className="text-muted-foreground">Quản lý và phát triển nội dung giảng dạy</p>
          </div>
          <Button size="lg" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Tạo khóa học mới
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-12">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="p-6 bg-muted/40 rounded-2xl"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: stat.color + '20' }}
                >
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div className="text-3xl font-black mb-1 font-display">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Analytics — chỉ hiện khi đã có khóa học */}
        {courses.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-12">
            <div className="rounded-2xl border border-border p-5 sm:p-6">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">
                Học viên theo khóa học
              </h2>
              <BarChart
                data={[...courses]
                  .sort((a, b) => b._count.enrollments - a._count.enrollments)
                  .slice(0, 6)
                  .map((c) => ({ label: c.title, value: c._count.enrollments }))}
                emptyMessage="Chưa có học viên đăng ký"
              />
            </div>
            <div className="rounded-2xl border border-border p-5 sm:p-6">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">
                Trạng thái khóa học
              </h2>
              <DonutChart
                centerLabel={String(courses.length)}
                data={[
                  { label: 'Đã xuất bản', value: courses.filter((c) => c.status === 'PUBLISHED').length, color: '#10b981' },
                  { label: 'Nháp', value: courses.filter((c) => c.status === 'DRAFT').length, color: '#a3a3a3' },
                  { label: 'Đã lưu trữ', value: courses.filter((c) => c.status === 'ARCHIVED').length, color: '#f59e0b' },
                ].filter((d) => d.value > 0)}
              />
            </div>
          </div>
        )}

        {/* Courses list */}
        {courses.length === 0 ? (
          <EmptyState onCreate={() => setShowCreateModal(true)} />
        ) : (
          <div className="space-y-3">
            <h2 className="text-xl font-bold mb-4 font-display">Tất cả khóa học</h2>
            {courses.map((course) => (
              <CourseRow key={course.id} course={course} />
            ))}
          </div>
        )}

        {showCreateModal && (
          <CreateCourseModal
            onClose={() => setShowCreateModal(false)}
            onCreate={async (data) => {
              const result = await call(
                '/api/instructor/courses',
                { method: 'POST', body: data },
                { successMessage: 'Đã tạo khóa học mới!' }
              );
              router.push(`/teach/courses/${result.course.id}/edit`);
            }}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

function CourseRow({ course }: { course: Course }) {
  const statusConfig = {
    DRAFT: { label: 'Nháp', color: 'bg-muted text-muted-foreground' },
    PUBLISHED: { label: 'Đã xuất bản', color: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:bg-green-950/50 dark:text-green-400' },
    ARCHIVED: { label: 'Đã lưu trữ', color: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400' },
  }[course.status];

  return (
    <div className="bg-card border-2 border-border hover:border-foreground rounded-2xl p-5 flex items-center gap-4 transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
          <span className="text-xs text-muted-foreground">{course.category.name}</span>
        </div>
        <h3 className="font-bold mb-2 line-clamp-1">{course.title}</h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{course._count.sections} chương</span>
          <span>•</span>
          <span>{formatNumber(course._count.enrollments)} học viên</span>
          <span>•</span>
          <span className="font-bold text-foreground">{formatPrice(course.price)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/courses/${course.slug}`}
          className="p-2 hover:bg-muted rounded-lg"
          title="Xem trước"
          aria-label="Xem trước khóa học"
        >
          <Eye className="w-4 h-4" />
        </Link>
        <Link
          href={`/teach/courses/${course.id}/edit`}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-full hover:bg-primary/90 flex items-center gap-2"
        >
          <Edit className="w-3.5 h-3.5" />
          Chỉnh sửa
        </Link>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="text-center py-20 bg-muted/40 rounded-3xl">
      <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-950/40 dark:bg-yellow-950/40 rounded-full flex items-center justify-center mx-auto mb-6">
        <BookOpen className="w-10 h-10 text-yellow-600 dark:text-yellow-500" />
      </div>
      <h2 className="text-2xl font-bold mb-3">Bắt đầu hành trình giảng dạy</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Bạn chưa tạo khóa học nào. Hãy chia sẻ kiến thức của bạn với hàng triệu học viên!
      </p>
      <Button size="lg" onClick={onCreate}>
        <Plus className="w-4 h-4" />
        Tạo khóa học đầu tiên
      </Button>
    </div>
  );
}

function CreateCourseModal({
  onClose,
  onCreate,
  loading,
}: {
  onClose: () => void;
  onCreate: (data: { title: string; categoryId: string }) => Promise<void>;
  loading: boolean;
}) {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.length < 10 || !categoryId) return;
    await onCreate({ title, categoryId });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-3xl p-8 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-black mb-2 font-display">Tạo khóa học mới</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Đừng lo về việc đặt tên hoàn hảo, bạn có thể đổi sau.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold mb-2 block">Tiêu đề khóa học</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: React.js Toàn Tập 2026"
              required
              minLength={10}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {title.length}/100 ký tự (tối thiểu 10)
            </p>
          </div>

          <div>
            <label className="text-sm font-bold mb-2 block">Danh mục</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-4 py-3 bg-card text-foreground border-2 border-input rounded-xl outline-none focus:border-foreground"
            >
              <option value="">-- Chọn danh mục --</option>
              {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading || title.length < 10 || !categoryId}
              className="flex-1"
            >
              {loading ? 'Đang tạo...' : 'Tạo khóa học'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
