import { z } from 'zod';

/**
 * Validation schemas cho Quiz domain
 */

const choiceOptionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Đáp án không được để trống'),
  isCorrect: z.boolean(),
});

const shortAnswerConfigSchema = z.object({
  acceptedAnswers: z
    .array(z.string().min(1))
    .min(1, 'Cần ít nhất 1 đáp án chấp nhận'),
  caseSensitive: z.boolean().default(false),
});

// Quiz CRUD
export const createQuizSchema = z.object({
  lessonId: z.string(),
  title: z.string().min(3).max(150),
  description: z.string().max(2000).optional().or(z.literal('')),
});

export const updateQuizSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
  timeLimit: z.number().int().min(0).max(600).nullable().optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  maxAttempts: z.number().int().min(0).max(100).optional(),
  shuffleQuestions: z.boolean().optional(),
  showCorrectAnswers: z.boolean().optional(),
});

// Question CRUD
export const createQuestionSchema = z
  .object({
    quizId: z.string(),
    type: z.enum(['MULTIPLE_CHOICE', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'SHORT_ANSWER']),
    text: z.string().min(5, 'Câu hỏi ít nhất 5 ký tự').max(2000),
    explanation: z.string().max(2000).optional().or(z.literal('')),
    points: z.number().int().min(1).max(100).default(1),
    options: z.union([
      z.array(choiceOptionSchema),
      z.array(shortAnswerConfigSchema),
    ]),
  })
  .refine(
    (data) => {
      if (data.type === 'SHORT_ANSWER') {
        return (
          Array.isArray(data.options) &&
          data.options.length === 1 &&
          'acceptedAnswers' in data.options[0]
        );
      }
      const choices = data.options as Array<{ isCorrect: boolean }>;
      if (data.type === 'TRUE_FALSE') {
        return choices.length === 2 && choices.filter((c) => c.isCorrect).length === 1;
      }
      if (data.type === 'MULTIPLE_CHOICE') {
        return choices.length >= 2 && choices.filter((c) => c.isCorrect).length === 1;
      }
      if (data.type === 'MULTIPLE_SELECT') {
        return choices.length >= 2 && choices.filter((c) => c.isCorrect).length >= 1;
      }
      return true;
    },
    {
      message: 'Cấu hình đáp án không hợp lệ cho loại câu hỏi này',
      path: ['options'],
    }
  );

export const updateQuestionSchema = z.object({
  type: z.enum(['MULTIPLE_CHOICE', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'SHORT_ANSWER']).optional(),
  text: z.string().min(5).max(2000).optional(),
  explanation: z.string().max(2000).optional().or(z.literal('')),
  points: z.number().int().min(1).max(100).optional(),
  options: z
    .union([z.array(choiceOptionSchema), z.array(shortAnswerConfigSchema)])
    .optional(),
});

export const reorderQuestionsSchema = z.object({
  quizId: z.string(),
  questionIds: z.array(z.string()),
});

// Submit
export const submitAttemptSchema = z.object({
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
});
