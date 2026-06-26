/**
 * Quiz domain types
 *
 * Notes về options structure:
 * - Vì Prisma JSON field không có type, ta định nghĩa rõ shape ở đây
 * - Validation runtime bằng Zod schemas
 */

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'MULTIPLE_SELECT'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER';

export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';

// Options shape cho từng question type
export interface ChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface ShortAnswerConfig {
  acceptedAnswers: string[];
  caseSensitive: boolean;
}

// Options union type
export type QuestionOptions =
  | ChoiceOption[]           // For MULTIPLE_CHOICE, MULTIPLE_SELECT, TRUE_FALSE
  | [ShortAnswerConfig];     // For SHORT_ANSWER (wrapped trong array để consistent với JSON)

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  explanation: string | null;
  points: number;
  order: number;
  options: QuestionOptions;
}

// Question với options đã được unwrap để dễ dùng ở UI
export interface QuestionView extends Omit<Question, 'options'> {
  choices: ChoiceOption[];      // Cho MULTIPLE_CHOICE/SELECT/TRUE_FALSE
  shortAnswer?: ShortAnswerConfig; // Cho SHORT_ANSWER
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passingScore: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  showCorrectAnswers: boolean;
  lessonId: string;
  questions: Question[];
}

// Answer types khi student submit
export type StudentAnswer =
  | string       // MULTIPLE_CHOICE / TRUE_FALSE: optionId hoặc 'true'/'false'
  | string[]     // MULTIPLE_SELECT: array of optionIds
  | string;      // SHORT_ANSWER: text

export type AnswerMap = Record<string, StudentAnswer>;

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  status: AttemptStatus;
  answers: AnswerMap;
  score: number | null;
  earnedPoints: number;
  totalPoints: number;
  passed: boolean;
  startedAt: Date;
  submittedAt: Date | null;
}
