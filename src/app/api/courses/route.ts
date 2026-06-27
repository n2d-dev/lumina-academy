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
  // Parse pagination an toàn: tham số phi số (vd ?limit=abc) → fallback mặc định,
  // tránh slice(offset, NaN) trả về mảng rỗng. Kẹp trong khoảng hợp lệ.
  const parseIntParam = (raw: string | null, fallback: number, min: number, max: number) => {
    const n = Number.parseInt(raw ?? '', 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(Math.max(n, min), max);
  };
  const limit = parseIntParam(searchParams.get('limit'), 20, 1, 100);
  const offset = parseIntParam(searchParams.get('offset'), 0, 0, Number.MAX_SAFE_INTEGER);

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
