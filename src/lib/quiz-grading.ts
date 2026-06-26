/**
 * Quiz Auto-Grading Engine
 *
 * Pure function — không phụ thuộc DB, dễ unit test
 * Chấm điểm dựa trên question type và đáp án của học viên
 */

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionData {
  id: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  points: number;
  options?: QuestionOption[] | null;
  correctAnswers: string[];
}

interface UserAnswer {
  questionId: string;
  selectedOptions?: string[];
  textAnswer?: string;
}

interface GradedAnswer {
  questionId: string;
  isCorrect: boolean;
  pointsEarned: number;
  selectedOptions: string[];
  textAnswer: string | null;
}

interface QuizGradingResult {
  totalPoints: number;
  earnedPoints: number;
  score: number; // 0-100 %
  gradedAnswers: GradedAnswer[];
}

/**
 * Chấm 1 câu hỏi
 */
export function gradeQuestion(
  question: QuestionData,
  answer: UserAnswer | undefined
): GradedAnswer {
  const baseResult: GradedAnswer = {
    questionId: question.id,
    isCorrect: false,
    pointsEarned: 0,
    selectedOptions: answer?.selectedOptions ?? [],
    textAnswer: answer?.textAnswer ?? null,
  };

  if (!answer) return baseResult;

  switch (question.type) {
    case 'SINGLE_CHOICE': {
      // Đúng nếu chọn đúng 1 option đúng
      const correctIds =
        question.options?.filter((o) => o.isCorrect).map((o) => o.id) ?? [];
      const selected = answer.selectedOptions ?? [];

      if (selected.length === 1 && correctIds.includes(selected[0])) {
        return { ...baseResult, isCorrect: true, pointsEarned: question.points };
      }
      return baseResult;
    }

    case 'MULTIPLE_CHOICE': {
      // Đúng nếu chọn ĐÚNG TẤT CẢ correct options và KHÔNG chọn incorrect
      const correctIds =
        question.options?.filter((o) => o.isCorrect).map((o) => o.id) ?? [];
      const selected = new Set(answer.selectedOptions ?? []);

      const isExactMatch =
        correctIds.length === selected.size &&
        correctIds.every((id) => selected.has(id));

      if (isExactMatch) {
        return { ...baseResult, isCorrect: true, pointsEarned: question.points };
      }
      return baseResult;
    }

    case 'TRUE_FALSE': {
      const correct = question.correctAnswers[0]; // 'true' or 'false'
      const submitted = answer.selectedOptions?.[0];

      if (submitted === correct) {
        return { ...baseResult, isCorrect: true, pointsEarned: question.points };
      }
      return baseResult;
    }

    case 'SHORT_ANSWER': {
      // Match case-insensitive với bất kỳ correct answer nào
      const userText = (answer.textAnswer ?? '').trim().toLowerCase();
      if (!userText) return baseResult;

      const isMatch = question.correctAnswers.some(
        (correct) => correct.trim().toLowerCase() === userText
      );

      if (isMatch) {
        return { ...baseResult, isCorrect: true, pointsEarned: question.points };
      }
      return baseResult;
    }

    default:
      return baseResult;
  }
}

/**
 * Chấm cả quiz
 */
export function gradeQuiz(
  questions: QuestionData[],
  userAnswers: UserAnswer[]
): QuizGradingResult {
  const answersByQuestionId = new Map(userAnswers.map((a) => [a.questionId, a]));

  const gradedAnswers = questions.map((q) =>
    gradeQuestion(q, answersByQuestionId.get(q.id))
  );

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const earnedPoints = gradedAnswers.reduce((sum, a) => sum + a.pointsEarned, 0);
  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  return {
    totalPoints,
    earnedPoints,
    score,
    gradedAnswers,
  };
}
