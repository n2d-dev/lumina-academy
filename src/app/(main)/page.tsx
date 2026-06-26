import { HeroSection } from '@/components/home/HeroSection';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { FeaturedCourses } from '@/components/home/FeaturedCourses';
import { MOCK_COURSES } from '@/data/courses';

/**
 * Trang chủ - Server Component
 * Fetch data trực tiếp tại server (không cần loading state ở client)
 */
export default async function HomePage() {
  // Trong production sẽ thay bằng:
  // const featuredCourses = await prisma.course.findMany({ where: { isFeatured: true }, take: 4 });
  const featuredCourses = MOCK_COURSES.filter((c) => c.isFeatured).slice(0, 8);

  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <FeaturedCourses courses={featuredCourses} />
    </>
  );
}
