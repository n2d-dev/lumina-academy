import { z } from 'zod';

/**
 * Validation schemas cho Course
 * Dùng chung cho client (form validation) và server (API validation)
 *
 * Pattern: 1 schema = 1 use case
 *   - createCourseSchema: tạo course mới (chỉ cần title, category)
 *   - updateCourseBasicSchema: cập nhật info cơ bản
 *   - updateCoursePricingSchema: cập nhật giá
 *   - publishCourseSchema: validate đầy đủ trước khi publish
 */

export const COURSE_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS'] as const;

// Bước 1: Tạo course mới (minimal)
export const createCourseSchema = z.object({
  title: z
    .string()
    .min(10, 'Tiêu đề ít nhất 10 ký tự')
    .max(100, 'Tiêu đề tối đa 100 ký tự'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

// Bước 2: Update basic info
export const updateCourseBasicSchema = z.object({
  title: z.string().min(10).max(100),
  subtitle: z.string().max(200).optional().or(z.literal('')),
  description: z.string().min(50, 'Mô tả ít nhất 50 ký tự').max(5000),
  level: z.enum(COURSE_LEVELS),
  language: z.string().default('vi'),
  thumbnail: z.string().optional(),
  whatYouLearn: z
    .array(z.string().min(5))
    .min(3, 'Cần ít nhất 3 mục bạn sẽ học được')
    .max(20),
  requirements: z.array(z.string()).max(10),
  targetAudience: z.array(z.string()).max(10),
});

export type UpdateCourseBasicInput = z.infer<typeof updateCourseBasicSchema>;

// Bước 3: Pricing
export const updateCoursePricingSchema = z
  .object({
    price: z.number().int().min(0, 'Giá phải >= 0').max(100_000_000),
    originalPrice: z.number().int().min(0).optional().nullable(),
  })
  .refine(
    (data) =>
      data.originalPrice === null ||
      data.originalPrice === undefined ||
      data.originalPrice >= data.price,
    {
      message: 'Giá gốc phải lớn hơn hoặc bằng giá bán',
      path: ['originalPrice'],
    }
  );

export type UpdateCoursePricingInput = z.infer<typeof updateCoursePricingSchema>;

// Section
export const createSectionSchema = z.object({
  courseId: z.string(),
  title: z.string().min(3).max(100),
});

export const updateSectionSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional().or(z.literal('')),
});

export const reorderSectionsSchema = z.object({
  courseId: z.string(),
  sectionIds: z.array(z.string()),
});

// Lesson
export const createLessonSchema = z.object({
  sectionId: z.string(),
  title: z.string().min(3).max(150),
});

export const updateLessonSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
  isPreview: z.boolean().optional(),
  // Note: videoUrl, duration, mux* fields KHÔNG cho client edit trực tiếp.
  // Chúng được quản lý bởi Mux webhook (xem /api/webhooks/mux).
});

export const reorderLessonsSchema = z.object({
  sectionId: z.string(),
  lessonIds: z.array(z.string()),
});

// Publish - validate đầy đủ
export const publishCourseSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED']),
});
