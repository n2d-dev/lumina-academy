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
          <p className="text-neutral-600">{courses.length} khóa học</p>
        </div>
        <Link
          href="/admin/courses/new"
          className="px-5 py-3 bg-black text-white font-bold rounded-full hover:bg-neutral-800 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tạo khóa học
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 mb-6 border border-neutral-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm kiếm khóa học..."
            className="w-full pl-12 pr-4 py-3 bg-neutral-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-600">
                Khóa học
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-600">
                Giảng viên
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-600">
                Giá
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-600">
                Học viên
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-600">
                Trạng thái
              </th>
              <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-600">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold line-clamp-1">{course.title}</p>
                  <p className="text-xs text-neutral-500 mt-1">{course.category.name}</p>
                </td>
                <td className="px-6 py-4 text-sm">{course.instructor.name}</td>
                <td className="px-6 py-4 text-sm font-bold">{formatPrice(course.price)}</td>
                <td className="px-6 py-4 text-sm">{formatNumber(course.totalStudents)}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                    {course.status === 'PUBLISHED' ? 'Đang phát hành' : 'Nháp'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/courses/${course.slug}`}
                      className="p-2 hover:bg-neutral-100 rounded-lg"
                      title="Xem"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/admin/courses/${course.id}/edit`}
                      className="p-2 hover:bg-neutral-100 rounded-lg"
                      title="Sửa"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      className="p-2 hover:bg-red-100 rounded-lg text-red-600"
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
