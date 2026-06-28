import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { MOCK_COURSES } from '@/data/courses';
import { formatPrice, formatNumber } from '@/lib/utils';

/**
 * Admin: Quản lý khóa học
 * CRUD operations cho courses
 */
export default function AdminCoursesPage() {
  const courses = MOCK_COURSES;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black mb-2 font-display">Quản lý khóa học</h1>
          <p className="text-muted-foreground">{courses.length} khóa học</p>
        </div>
        <Link
          href="/admin/courses/new"
          className="px-5 py-3 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tạo khóa học
        </Link>
      </div>

      {/* Search */}
      <div className="bg-card rounded-2xl p-4 mb-6 border border-border">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm khóa học..."
            className="w-full pl-12 pr-4 py-3 bg-muted/40 rounded-xl outline-none focus:bg-card focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Khóa học
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Giảng viên
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Giá
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Học viên
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Trạng thái
              </th>
              <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-muted/40 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold line-clamp-1">{course.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{course.category.name}</p>
                </td>
                <td className="px-6 py-4 text-sm">{course.instructor.name}</td>
                <td className="px-6 py-4 text-sm font-bold">{formatPrice(course.price)}</td>
                <td className="px-6 py-4 text-sm">{formatNumber(course.totalStudents)}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-950/40 text-green-700 text-xs font-bold rounded-full">
                    {course.status === 'PUBLISHED' ? 'Đang phát hành' : 'Nháp'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/courses/${course.slug}`}
                      className="p-2 hover:bg-muted rounded-lg"
                      title="Xem"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/admin/courses/${course.id}/edit`}
                      className="p-2 hover:bg-muted rounded-lg"
                      title="Sửa"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      className="p-2 hover:bg-red-100 dark:bg-red-950/40 rounded-lg text-red-600"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
