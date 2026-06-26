'use client';

import Link from 'next/link';
import { CheckCircle2, XCircle, Trophy, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AttemptResult {
  id: string;
  score: number;
  earnedPoints: number;
  totalPoints: number;
  passed: boolean;
}

interface GradedDetail {
  questionId: string;
  isCorrect: boolean;
  earnedPoints: number;
  maxPoints: number;
  studentAnswer: string | string[] | null;
  correctAnswer: string | string[] | null;
}

interface SafeQuestion {
  id: string;
  type: string;
  text: string;
  points: number;
  options: { id: string; text: string }[];
}

interface Props {
  attempt: AttemptResult;
  questions: SafeQuestion[];
  answers: Record<string, string | string[]>;
  details: GradedDetail[] | null;
  passingScore: number;
  canRetake: boolean;
  onRetake: () => void;
  courseId: string;
}

/**
 * Component hiển thị kết quả sau khi student submit quiz
 *
 * Cấu trúc:
 * 1. Hero result (score, pass/fail, congrats hoặc encouragement)
 * 2. Stats summary
 * 3. Question-by-question review (nếu showCorrectAnswers)
 * 4. Actions (retake, back to lesson)
 */
export function QuizResult({
  attempt,
  questions,
  answers,
  details,
  passingScore,
  canRetake,
  onRetake,
  courseId,
}: Props) {
  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        {/* Hero result */}
        <div
          className={`rounded-3xl p-12 text-center mb-8 ${
            attempt.passed
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200'
              : 'bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200'
          }`}
        >
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              attempt.passed ? 'bg-green-500' : 'bg-orange-500'
            }`}
          >
            {attempt.passed ? (
              <Trophy className="w-12 h-12 text-white" />
            ) : (
              <RotateCcw className="w-12 h-12 text-white" />
            )}
          </div>

          <h1 className="text-4xl font-black mb-2 font-display">
            {attempt.passed ? 'Chúc mừng!' : 'Cố gắng lần sau'}
          </h1>
          <p
            className={`text-lg mb-6 ${
              attempt.passed ? 'text-green-700' : 'text-orange-700'
            }`}
          >
            {attempt.passed
              ? 'Bạn đã pass quiz này'
              : `Bạn cần ${passingScore}% để pass, đạt được ${attempt.score}%`}
          </p>

          <div className="inline-block">
            <p className="text-7xl font-black font-display">{attempt.score}%</p>
            <p className="text-sm text-neutral-600 mt-2">
              {attempt.earnedPoints} / {attempt.totalPoints} điểm
            </p>
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 text-center">
            <p className="text-3xl font-black font-display">
              {details?.filter((d) => d.isCorrect).length ?? '?'}
            </p>
            <p className="text-sm text-neutral-600 mt-1">Đúng</p>
          </div>
          <div className="bg-white rounded-2xl p-5 text-center">
            <p className="text-3xl font-black font-display">
              {details
                ? details.filter((d) => !d.isCorrect).length
                : '?'}
            </p>
            <p className="text-sm text-neutral-600 mt-1">Sai</p>
          </div>
          <div className="bg-white rounded-2xl p-5 text-center">
            <p className="text-3xl font-black font-display">{questions.length}</p>
            <p className="text-sm text-neutral-600 mt-1">Tổng câu</p>
          </div>
        </div>

        {/* Question-by-question review */}
        {details && (
          <div className="bg-white rounded-3xl p-8">
            <h2 className="text-xl font-black mb-6 font-display">Xem lại câu trả lời</h2>
            <div className="space-y-6">
              {questions.map((question, idx) => {
                const detail = details.find((d) => d.questionId === question.id);
                const userAnswer = answers[question.id];
                if (!detail) return null;

                return (
                  <QuestionReview
                    key={question.id}
                    index={idx}
                    question={question}
                    detail={detail}
                    userAnswer={userAnswer}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-3 mt-8">
          <Link href={`/learn/${courseId}`}>
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-4 h-4" />
              Quay lại bài học
            </Button>
          </Link>
          {canRetake && (
            <Button onClick={onRetake} size="lg">
              <RotateCcw className="w-4 h-4" />
              Làm lại
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ QUESTION REVIEW ============ */

function QuestionReview({
  index,
  question,
  detail,
  userAnswer,
}: {
  index: number;
  question: SafeQuestion;
  detail: GradedDetail;
  userAnswer: string | string[] | undefined;
}) {
  // Render câu trả lời text-based cho user và correct
  const renderAnswer = (answer: string | string[] | null) => {
    if (!answer) return <em className="text-neutral-400">Không có</em>;

    if (question.type === 'SHORT_ANSWER') {
      return <span>"{answer}"</span>;
    }

    const ids = Array.isArray(answer) ? answer : [answer];
    const texts = ids
      .map((id) => question.options.find((o) => o.id === id)?.text)
      .filter(Boolean);
    return <span>{texts.join(', ') || <em className="text-neutral-400">Không có</em>}</span>;
  };

  return (
    <div
      className={`p-5 rounded-2xl border-2 ${
        detail.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        {detail.isCorrect ? (
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
        ) : (
          <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
        )}
        <div className="flex-1">
          <p className="text-xs font-bold mb-1">
            Câu {index + 1} • {detail.earnedPoints}/{detail.maxPoints} điểm
          </p>
          <p className="font-medium leading-relaxed">{question.text}</p>
        </div>
      </div>

      <div className="ml-9 space-y-2 text-sm">
        <div>
          <span className="text-neutral-600">Câu trả lời của bạn: </span>
          <span className={detail.isCorrect ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>
            {renderAnswer(userAnswer ?? null)}
          </span>
        </div>
        {!detail.isCorrect && (
          <div>
            <span className="text-neutral-600">Đáp án đúng: </span>
            <span className="text-green-700 font-bold">
              {renderAnswer(detail.correctAnswer)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
