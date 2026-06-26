import { z } from 'zod';

export const createAssignmentSchema = z.object({
  courseId: z.string(),
  title: z.string().min(3).max(200),
  sectionId: z.string().optional().nullable(),
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(20, 'Mô tả ít nhất 20 ký tự').max(5000).optional(),
  instructions: z.string().max(10000).optional().or(z.literal('')),
  allowFiles: z.boolean().optional(),
  allowText: z.boolean().optional(),
  totalPoints: z.number().int().min(1).max(1000).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  rubric: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        maxPoints: z.number().int().min(1),
        description: z.string().optional(),
      })
    )
    .optional(),
  isPublished: z.boolean().optional(),
  sectionId: z.string().optional().nullable(),
});

// Student submit assignment
export const submitAssignmentSchema = z
  .object({
    textContent: z.string().optional(),
    fileUrls: z.array(z.string().url()).optional().default([]),
    asDraft: z.boolean().default(false),
  })
  .refine(
    (data) =>
      (data.textContent && data.textContent.trim().length > 0) ||
      (data.fileUrls && data.fileUrls.length > 0),
    {
      message: 'Cần có ít nhất nội dung text hoặc file đính kèm',
    }
  );

// Instructor grade assignment
export const gradeAssignmentSchema = z.object({
  grade: z.number().int().min(0),
  feedback: z.string().max(5000).optional(),
  rubricScores: z.record(z.number()).optional(),
});

export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
export type GradeAssignmentInput = z.infer<typeof gradeAssignmentSchema>;
