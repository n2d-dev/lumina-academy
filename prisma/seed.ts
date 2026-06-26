/**
 * Database seed script
 * Chạy bằng: npm run db:seed
 *
 * Tạo:
 * - Admin user
 * - Test instructor
 * - Test student
 * - Categories
 * - Sample courses
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed database...');

  // 1. Tạo categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'programming' },
      create: { name: 'Lập trình', slug: 'programming', color: '#0066ff' },
      update: {},
    }),
    prisma.category.upsert({
      where: { slug: 'design' },
      create: { name: 'Thiết kế', slug: 'design', color: '#ff3366' },
      update: {},
    }),
    prisma.category.upsert({
      where: { slug: 'marketing' },
      create: { name: 'Marketing', slug: 'marketing', color: '#f59e0b' },
      update: {},
    }),
  ]);
  console.log(`✅ Tạo ${categories.length} categories`);

  // 2. Tạo users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@lumina.vn' },
    create: {
      email: 'admin@lumina.vn',
      name: 'Admin Lumina',
      password: hashedPassword,
      role: 'ADMIN',
    },
    update: {},
  });

  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@lumina.vn' },
    create: {
      email: 'instructor@lumina.vn',
      name: 'Nguyễn Minh Anh',
      password: hashedPassword,
      role: 'INSTRUCTOR',
      title: 'Senior Engineer @ Google',
      bio: 'Hơn 10 năm kinh nghiệm phát triển web với React, Next.js.',
    },
    update: {},
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@lumina.vn' },
    create: {
      email: 'student@lumina.vn',
      name: 'Trần An',
      password: hashedPassword,
      role: 'STUDENT',
    },
    update: {},
  });
  console.log('✅ Tạo users (admin, instructor, student)');

  // 3. Tạo course mẫu
  const course = await prisma.course.upsert({
    where: { slug: 'react-toan-tap-2026' },
    create: {
      title: 'React.js Toàn Tập 2026: Từ Zero Đến Hero',
      slug: 'react-toan-tap-2026',
      subtitle: 'Học React 18, Next.js 14 và TypeScript với dự án thực tế',
      description:
        'Khóa học React.js toàn diện nhất, từ cơ bản đến nâng cao. Học cách xây dựng ứng dụng web hiện đại với React 18, Next.js 14, TypeScript và những best practices mới nhất.',
      thumbnail: 'gradient-blue',
      price: 1290000,
      originalPrice: 2590000,
      level: 'ALL_LEVELS',
      status: 'PUBLISHED',
      whatYouLearn: [
        'Thành thạo React 18 với Hooks',
        'Next.js 14 App Router',
        'TypeScript trong React',
        'State Management với Zustand',
      ],
      requirements: ['Kiến thức HTML/CSS/JS cơ bản'],
      targetAudience: ['Lập trình viên Frontend', 'Sinh viên CNTT'],
      totalLectures: 285,
      totalDuration: 187200,
      averageRating: 4.9,
      totalReviews: 12847,
      totalStudents: 45230,
      isBestseller: true,
      isFeatured: true,
      publishedAt: new Date(),
      instructorId: instructor.id,
      categoryId: categories[0].id,
      sections: {
        create: [
          {
            title: 'Khởi đầu với React',
            order: 1,
            lessons: {
              create: [
                { title: 'Giới thiệu khóa học', duration: 504, order: 1, isPreview: true },
                { title: 'Cài đặt môi trường', duration: 750, order: 2, isPreview: true },
                { title: 'JSX và Components', duration: 1125, order: 3, isPreview: false },
              ],
            },
          },
          {
            title: 'React Hooks',
            order: 2,
            lessons: {
              create: [
                { title: 'useState và useEffect', duration: 1935, order: 1, isPreview: false },
                { title: 'useContext', duration: 1720, order: 2, isPreview: false },
              ],
            },
          },
        ],
      },
    },
    update: {},
  });
  console.log(`✅ Tạo course: ${course.title}`);

  console.log('🎉 Seed hoàn tất!');
  console.log('\n📝 Tài khoản test:');
  console.log('   Admin:      admin@lumina.vn / password123');
  console.log('   Instructor: instructor@lumina.vn / password123');
  console.log('   Student:    student@lumina.vn / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
