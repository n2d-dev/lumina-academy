'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Clock, AlertCircle, ChevronRight,
  Trophy, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useApi } from '@/hooks/useApi';
import { QuizResult } from '@/components/quiz/QuizResult';
import type { QuestionType } from '@/types/quiz';

interface SafeQuestion {
  id: string;
  type: QuestionType;
  text: string;
  points: number;
  order: number;
  options: { id: string; text: string }[];
}

interface QuizMeta {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passingScore: number;
  maxAttempts: number;
}

interface Props {
  quiz: QuizMeta;
  questions: SafeQuestion[];
  previousAttempts: number;
  bestScore: number;
  courseId: string;
}

type Phase = 'intro' | 'taking' | 'result';

/**
 * Quiz Taker - student interface
 *
 * 3 phase:
 * 1. Intro: Hiển thị thông tin, bestScore, attempts
 * 2. Taking: Một câu mỗi lần, nav prev/next, timer nếu có
 * 3. Result: Hiển thị kết quả + correct answers (nếu enabled)
 */
export function QuizTakerClient({
  quiz,
  questions,
  previousAttempts,
  bestScore,
  courseId,
}: Props) {
  const router = useRouter();
  const { call, loading } = useApi();
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [result, setResult] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  // Số lần đã làm (tính cả các lần retake trong session), khởi tạo từ server.
  const [attemptsUsed, setAttemptsUsed] = useState(previousAttempts);

  // Guard chống nộp trùng (timer + click). Ref là synchronous nên đáng tin hơn `loading`.
  const submittingRef = useRef(false);
  // Snapshot answers mới nhất để timer auto-submit không bị stale closure.
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Timer logic
  useEffect(() => {
    if (phase !== 'taking' || !quiz.timeLimit) return;
    if (timeLeft === null) return;

    if (timeLeft <= 0) {
      setTimeLeft(null); // dừng timer, tránh effect tái nhập gọi submit lần 2
      handleSubmit();
      return;
    }

    const t = setTimeout(() => setTimeLeft((v) => (v ?? 0) - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft]);

  const handleStart = () => {
    submittingRef.current = false;
    setPhase('taking');
    if (quiz.timeLimit) setTimeLeft(quiz.timeLimit * 60);
  };

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    // Chặn nộp trùng: timer auto-submit và nút bấm không thể tạo 2 attempt.
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const res = await call(`/api/quiz/${quiz.id}/submit`, {
        method: 'POST',
        body: { answers: answersRef.current },
      });
      setResult(res.attempt);
      setDetails(res.details);
      setAttemptsUsed((n) => n + 1);
      setPhase('result');
    } catch {
      // Nộp lỗi → cho phép thử lại
      submittingRef.current = false;
      // Error toast đã handled trong useApi
    }
  };

  const handleRetake = () => {
    submittingRef.current = false;
    setPhase('intro');
    setCurrentIdx(0);
    setAnswers({});
    setResult(null);
    setDetails(null);
    setTimeLeft(null);
  };

  /* ============ RENDER PHASES ============ */

  if (phase === 'intro') {
    return (
      <IntroPhase
        quiz={quiz}
        questions={questions}
        previousAttempts={attemptsUsed}
        bestScore={bestScore}
        courseId={courseId}
        onStart={handleStart}
      />
    );
  }

  if (phase === 'result' && result) {
    return (
      <QuizResult
        attempt={result}
        questions={questions}
        answers={answers}
        details={details}
        passingScore={quiz.passingScore}
        canRetake={quiz.maxAttempts === 0 || attemptsUsed < quiz.maxAttempts}
        onRetake={handleRetake}
        courseId={courseId}
      />
    );
  }

  // Taking phase
  const currentQuestion = questions[currentIdx];
  const answeredCount = Object.keys(answers).filter((k) => {
    const a = answers[k];
    return Array.isArray(a) ? a.length > 0 : !!a;
  }).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top bar */}
      <div className="sticky top-0 bg-white border-b border-neutral-200 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500">
              Câu {currentIdx + 1}/{questions.length} • {answeredCount} đã trả lời
            </p>
            <h2 className="font-bold">{quiz.title}</h2>
          </div>
          {timeLeft !== null && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                timeLeft < 60
                  ? 'bg-red-100 text-red-700'
                  : 'bg-neutral-100 text-neutral-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="font-mono font-bold">
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="h-1 bg-neutral-100">
          <div
            className="h-full bg-yellow-400 transition-all"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Question */}
        <QuestionView
          question={currentQuestion}
          answer={answers[currentQuestion.id]}
          onChange={(a) => handleAnswer(currentQuestion.id, a)}
        />

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
          >
            <ChevronLeft className="w-4 h-4" />
            Câu trước
          </Button>

          {currentIdx < questions.length - 1 ? (
            <Button onClick={() => setCurrentIdx(currentIdx + 1)}>
              Câu tiếp
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              variant="accent"
              size="lg"
            >
              {loading
                ? 'Đang nộp bài...'
                : allAnswered
                ? 'Nộp bài'
                : `Nộp bài (${questions.length - answeredCount} câu chưa trả lời)`}
            </Button>
          )}
        </div>

        {/* Question navigator */}
        <div className="mt-8 p-4 bg-white rounded-2xl">
          <p className="text-xs font-bold text-neutral-500 uppercase mb-3">
            Tổng quan
          </p>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => {
              const a = answers[q.id];
              const isAnswered = Array.isArray(a) ? a.length > 0 : !!a;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-10 h-10 rounded-lg text-sm font-bold border-2 transition-all ${
                    currentIdx === idx
                      ? 'border-black bg-black text-white'
                      : isAnswered
                      ? 'border-green-300 bg-green-50 text-green-700'
                      : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ INTRO PHASE ============ */

function IntroPhase({
  quiz,
  questions,
  previousAttempts,
  bestScore,
  courseId,
  onStart,
}: {
  quiz: QuizMeta;
  questions: SafeQuestion[];
  previousAttempts: number;
  bestScore: number;
  courseId: string;
  onStart: () => void;
}) {
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const noMoreAttempts =
    quiz.maxAttempts > 0 && previousAttempts >= quiz.maxAttempts;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link
          href={`/learn/${courseId}`}
          className="flex items-center gap-2 text-sm text-neutral-600 hover:text-black mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại bài học
        </Link>

        <div className="bg-white rounded-3xl p-8 shadow-sm">
          <h1 className="text-3xl font-black mb-2 font-display">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-neutral-600 mb-6">{quiz.description}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Stat label="Số câu hỏi" value={`${questions.length} câu`} />
            <Stat label="Tổng điểm" value={`${totalPoints} điểm`} />
            <Stat label="Điểm pass" value={`${quiz.passingScore}%`} />
            <Stat
              label="Thời gian"
              value={quiz.timeLimit ? `${quiz.timeLimit} phút` : 'Không giới hạn'}
            />
          </div>

          {/* Best score nếu có */}
          {previousAttempts > 0 && (
            <div className="bg-yellow-50 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-600" />
              <div className="flex-1">
                <p className="font-bold text-sm">Điểm cao nhất: {bestScore}%</p>
                <p className="text-xs text-neutral-600">
                  Đã làm {previousAttempts}/{quiz.maxAttempts || '∞'} lần
                </p>
              </div>
            </div>
          )}

          {/* Warning */}
          {quiz.timeLimit && (
            <div className="bg-orange-50 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <p className="text-sm text-orange-900">
                Quiz có giới hạn thời gian. Bài sẽ tự động nộp khi hết giờ.
              </p>
            </div>
          )}

          <Button
            size="lg"
            className="w-full"
            onClick={onStart}
            disabled={noMoreAttempts || questions.length === 0}
          >
            {noMoreAttempts
              ? 'Đã hết lượt làm bài'
              : questions.length === 0
              ? 'Quiz chưa có câu hỏi'
              : previousAttempts > 0
              ? 'Làm lại'
              : 'Bắt đầu làm bài'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-neutral-50 rounded-xl p-4">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

/* ============ QUESTION VIEW ============ */

function QuestionView({
  question,
  answer,
  onChange,
}: {
  question: SafeQuestion;
  answer: string | string[] | undefined;
  onChange: (a: string | string[]) => void;
}) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-xs font-bold text-yellow-700 uppercase tracking-wider">
          {question.points} điểm
        </span>
      </div>

      <h3 className="text-xl font-bold mb-6 leading-relaxed">{question.text}</h3>

      {question.type === 'SHORT_ANSWER' ? (
        <input
          type="text"
          value={(answer as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nhập câu trả lời của bạn..."
          className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl outline-none focus:border-black"
          autoFocus
        />
      ) : question.type === 'MULTIPLE_SELECT' ? (
        <div className="space-y-2">
          {question.options.map((opt) => {
            const selected = Array.isArray(answer) && answer.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => {
                  const current = (Array.isArray(answer) ? answer : []) as string[];
                  const next = selected
                    ? current.filter((id) => id !== opt.id)
                    : [...current, opt.id];
                  onChange(next);
                }}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center gap-3 ${
                  selected
                    ? 'border-black bg-neutral-50'
                    : 'border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    selected ? 'border-black bg-black' : 'border-neutral-300'
                  }`}
                >
                  {selected && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0z" />
                    </svg>
                  )}
                </div>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>
      ) : (
        // MULTIPLE_CHOICE / TRUE_FALSE
        <div className="space-y-2">
          {question.options.map((opt) => {
            const selected = answer === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange(opt.id)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center gap-3 ${
                  selected
                    ? 'border-black bg-neutral-50'
                    : 'border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selected ? 'border-black' : 'border-neutral-300'
                  }`}
                >
                  {selected && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                </div>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
