import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { SITE_CONFIG } from '@/lib/constants';

/**
 * /sitemap.xml — sinh tự động.
 *
 * Gồm các trang tĩnh công khai + mọi khóa học đã PUBLISH (đường dẫn theo slug).
 * Mỗi khóa học dùng `updatedAt` làm lastModified để bot biết khi nào nội dung đổi.
 *
 * Revalidate mỗi giờ để không truy vấn DB mỗi lần bot ghé.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL ?? SITE_CONFIG.url;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/courses`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/teach`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  let courseRoutes: MetadataRoute.Sitemap = [];
  try {
    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    courseRoutes = courses.map((course) => ({
      url: `${baseUrl}/courses/${course.slug}`,
      lastModified: course.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (err) {
    // Nếu DB lỗi lúc build/runtime, vẫn trả sitemap tĩnh thay vì crash.
    console.error('[sitemap] Không tải được khóa học:', err);
  }

  return [...staticRoutes, ...courseRoutes];
}
