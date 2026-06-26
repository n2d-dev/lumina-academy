import { NextResponse } from 'next/server';
import { MOCK_COURSES } from '@/data/courses';

/**
 * GET /api/courses
 * Query params:
 *   - category: filter theo slug danh mục
 *   - q: tìm kiếm theo tiêu đề/giảng viên
 *   - limit, offset: pagination
 *
 * Trong production sẽ dùng Prisma:
 *   await prisma.course.findMany({ where: ..., take: limit, skip: offset })
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const q = searchParams.get('q');
  const limit = Number(searchParams.get('limit') ?? 20);
  const offset = Number(searchParams.get('offset') ?? 0);

  let courses = MOCK_COURSES;

  if (category && category !== 'all') {
    courses = courses.filter((c) => c.category.slug === category);
  }

  if (q) {
    const query = q.toLowerCase();
    courses = courses.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.instructor.name.toLowerCase().includes(query)
    );
  }

  const total = courses.length;
  const items = courses.slice(offset, offset + limit);

  return NextResponse.json({ items, total, limit, offset });
}
