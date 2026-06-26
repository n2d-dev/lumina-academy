import type {
  Question,
  StudentAnswer,
  AnswerMap,
  ChoiceOption,
  ShortAnswerConfig,
} from '@/types/quiz';

/**
 * Auto-grading engine
 *
 * Trách nhiệm:
 * - Chấm 1 câu trả lời với question tương ứng
 * - Tính tổng điểm cho cả attempt
 *
 * Tách logic ra file riêng (pure functions) để:
 * 1. Dễ test
 * 2. Reuse giữa server (submit attempt) và client (preview)
 * 3. Logic chấm điểm tập trung 1 chỗ, không scatter
 */

interface GradedQuestion {
  questionId: string;
  isCorrect: boolean;
  earnedPoints: number;
  maxPoints: number;
  studentAnswer: StudentAnswer | null;
  correctAnswer: StudentAnswer | null;
}

export interface GradingResult {
  earnedPoints: number;
  totalPoints: number;
  score: number; // %
  passed: boolean;
  details: GradedQuestion[];
}

/**
 * Chấm 1 câu hỏi
 * Return tuple [isCorrect, earnedPoints]
 */
export function gradeQuestion(
  question: Question,
  studentAnswer: StudentAnswer | undefined
): [boolean, number] {
  if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') {
    return [false, 0];
  }

  switch (question.type) {
    case 'MULTIPLE_CHOICE':
    case 'TRUE_FALSE': {
      const choices = question.options as ChoiceOption[];
      const correct = choices.find((c) => c.isCorrect);
      if (!correct) return [false, 0];
      const isCorrect = studentAnswer === correct.id;
      return [isCorrect, isCorrect ? question.points : 0];
    }

    case 'MULTIPLE_SELECT': {
      const choices = question.options as ChoiceOption[];
      const correctIds = new Set(choices.filter((c) => c.isCorrect).map((c) => c.id));
      const studentIds = new Set(
        Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer]
      );

      // Phải chọn ĐÚNG tất cả correct và KHÔNG chọn incorrect
      const allCorrectSelected = [...correctIds].every((id) => studentIds.has(id));
      const noIncorrectSelected = [...studentIds].every((id) => correctIds.has(id));

      const isCorrect = allCorrectSelected && noIncorrectSelected;
      return [isCorrect, isCorrect ? question.points : 0];
    }

    case 'SHORT_ANSWER': {
      const [config] = question.options as [ShortAnswerConfig];
      if (!config?.acceptedAnswers) return [false, 0];

      const answer =
        typeof studentAnswer === 'string' ? studentAnswer.trim() : '';

      const isCorrect = config.acceptedAnswers.some((accepted) => {
        if (config.caseSensitive) {
          return accepted.trim() === answer;
        }
        return accepted.trim().toLowerCase() === answer.toLowerCase();
      });

      return [isCorrect, isCorrect ? question.points : 0];
    }

    default:
      return [false, 0];
  }
}

/**
 * Lấy "correct answer" để hiển thị cho student sau khi submit
 */
function getCorrectAnswer(question: Question): StudentAnswer | null {
  switch (question.type) {
    case 'MULTIPLE_CHOICE':
    case 'TRUE_FALSE': {
      const choices = question.options as ChoiceOption[];
      return choices.find((c) => c.isCorrect)?.id ?? null;
    }
    case 'MULTIPLE_SELECT': {
      const choices = question.options as ChoiceOption[];
      return choices.filter((c) => c.isCorrect).map((c) => c.id);
    }
    case 'SHORT_ANSWER': {
      const [config] = question.options as [ShortAnswerConfig];
      return config?.acceptedAnswers[0] ?? null;
    }
    default:
      return null;
  }
}

/**
 * Chấm cả attempt
 * Trả về điểm tổng, % và breakdown từng câu
 */
export function gradeAttempt(
  questions: Question[],
  answers: AnswerMap,
  passingScore: number
): GradingResult {
  let earnedPoints = 0;
  let totalPoints = 0;
  const details: GradedQuestion[] = [];

  for (const question of questions) {
    totalPoints += question.points;
    const studentAnswer = answers[question.id];
    const [isCorrect, points] = gradeQuestion(question, studentAnswer);

    earnedPoints += points;
    details.push({
      questionId: question.id,
      isCorrect,
      earnedPoints: points,
      maxPoints: question.points,
      studentAnswer: studentAnswer ?? null,
      correctAnswer: getCorrectAnswer(question),
    });
  }

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  return {
    earnedPoints,
    totalPoints,
    score,
    passed: score >= passingScore,
    details,
  };
}
