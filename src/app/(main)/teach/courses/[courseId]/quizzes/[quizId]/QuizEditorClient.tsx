'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, Settings, Plus, Edit2, Trash2,
  CircleDot, CheckSquare, ToggleLeft, Type, GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApi } from '@/hooks/useApi';
import { QuestionEditor } from '@/components/quiz/QuestionEditor';
import type { QuestionType, ChoiceOption, ShortAnswerConfig } from '@/types/quiz';

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  explanation: string | null;
  points: number;
  order: number;
  options: ChoiceOption[] | [ShortAnswerConfig];
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passingScore: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  showCorrectAnswers: boolean;
  questions: Question[];
}

interface Props {
  quiz: Quiz;
  courseId: string;
  lessonTitle: string;
}

const TYPE_ICONS: Record<QuestionType, typeof CircleDot> = {
  MULTIPLE_CHOICE: CircleDot,
  MULTIPLE_SELECT: CheckSquare,
  TRUE_FALSE: ToggleLeft,
  SHORT_ANSWER: Type,
};

const TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  MULTIPLE_SELECT: 'Nhiều đáp án',
  TRUE_FALSE: 'Đúng/Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
};

export function QuizEditorClient({ quiz: initialQuiz, courseId, lessonTitle }: Props) {
  const { call, loading } = useApi();
  const [quiz, setQuiz] = useState(initialQuiz);
  const [showSettings, setShowSettings] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [creating, setCreating] = useState(false);

  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

  /* ============ Quiz settings ============ */

  const handleSaveSettings = async (settings: Partial<Quiz>) => {
    const result = await call(
      `/api/instructor/quizzes/${quiz.id}`,
      { method: 'PATCH', body: settings },
      { successMessage: 'Đã cập nhật cài đặt' }
    );
    setQuiz({ ...quiz, ...result.quiz });
    setShowSettings(false);
  };

  /* ============ Questions ============ */

  const handleSaveQuestion = async (data: any) => {
    if (data.id) {
      // Update
      const result = await call(
        `/api/instructor/questions/${data.id}`,
        { method: 'PATCH', body: data },
        { successMessage: 'Đã cập nhật câu hỏi' }
      );
      setQuiz({
        ...quiz,
        questions: quiz.questions.map((q) =>
          q.id === data.id ? { ...result.question } : q
        ),
      });
      setEditingQuestion(null);
    } else {
      // Create
      const result = await call(
        `/api/instructor/quizzes/${quiz.id}/questions`,
        { method: 'POST', body: data },
        { successMessage: 'Đã tạo câu hỏi mới' }
      );
      setQuiz({
        ...quiz,
        questions: [...quiz.questions, result.question],
      });
      setCreating(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Xóa câu hỏi này?')) return;

    await call(
      `/api/instructor/questions/${questionId}`,
      { method: 'DELETE' },
      { successMessage: 'Đã xóa câu hỏi' }
    );
    setQuiz({
      ...quiz,
      questions: quiz.questions.filter((q) => q.id !== questionId),
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-8 lg:p-12">
      {/* Header */}
      <Link
        href={`/teach/courses/${courseId}/quizzes`}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Quay lại danh sách quiz
      </Link>

      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Quiz cho bài: {lessonTitle}</p>
          <h1 className="text-2xl sm:text-3xl font-black font-display">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-muted-foreground mt-2 max-w-2xl">{quiz.description}</p>
          )}
        </div>
        <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
          <Settings className="w-4 h-4" />
          Cài đặt
        </Button>
      </div>

      {/* Quick stats */}
      <div className="flex items-center gap-6 mt-4 mb-8 text-sm">
        <div>
          <span className="text-muted-foreground">Số câu:</span>{' '}
          <strong>{quiz.questions.length}</strong>
        </div>
        <div>
          <span className="text-muted-foreground">Tổng điểm:</span>{' '}
          <strong>{totalPoints}</strong>
        </div>
        <div>
          <span className="text-muted-foreground">Điểm pass:</span>{' '}
          <strong>{quiz.passingScore}%</strong>
        </div>
        <div>
          <span className="text-muted-foreground">Thời gian:</span>{' '}
          <strong>{quiz.timeLimit ? `${quiz.timeLimit} phút` : 'Không giới hạn'}</strong>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <SettingsPanel
          quiz={quiz}
          onSave={handleSaveSettings}
          onCancel={() => setShowSettings(false)}
          loading={loading}
        />
      )}

      {/* Questions list */}
      <div className="space-y-3">
        {quiz.questions.map((question, idx) => (
          <div key={question.id}>
            {editingQuestion?.id === question.id ? (
              <QuestionEditor
                initialData={{ ...editingQuestion, explanation: editingQuestion.explanation ?? undefined }}
                onSave={handleSaveQuestion}
                onCancel={() => setEditingQuestion(null)}
                saving={loading}
              />
            ) : (
              <QuestionRow
                question={question}
                index={idx}
                onEdit={() => setEditingQuestion(question)}
                onDelete={() => handleDeleteQuestion(question.id)}
              />
            )}
          </div>
        ))}

        {creating ? (
          <QuestionEditor
            onSave={handleSaveQuestion}
            onCancel={() => setCreating(false)}
            saving={loading}
          />
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full py-6 border-2 border-dashed border-border rounded-2xl text-sm font-bold text-muted-foreground hover:border-foreground hover:text-foreground flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Thêm câu hỏi mới
          </button>
        )}
      </div>
    </div>
  );
}

/* ============ COMPONENTS ============ */

function QuestionRow({
  question,
  index,
  onEdit,
  onDelete,
}: {
  question: Question;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = TYPE_ICONS[question.type];

  // Chuẩn bị preview các đáp án
  const correctAnswerText = (() => {
    if (question.type === 'SHORT_ANSWER') {
      const config = question.options[0] as ShortAnswerConfig;
      return `Chấp nhận: ${config.acceptedAnswers.slice(0, 2).join(', ')}${
        config.acceptedAnswers.length > 2 ? '...' : ''
      }`;
    }
    const choices = question.options as ChoiceOption[];
    const correct = choices.filter((c) => c.isCorrect);
    return `Đúng: ${correct.map((c) => c.text).join(', ')}`;
  })();

  return (
    <div className="bg-card rounded-2xl p-5 border border-border hover:border-foreground transition-colors group">
      <div className="flex items-start gap-3">
        <span className="font-black text-2xl text-neutral-300 font-display">
          {index + 1}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-bold text-yellow-700 uppercase tracking-wider">
              {TYPE_LABELS[question.type]}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{question.points} điểm</span>
          </div>

          <p className="font-medium mb-2 line-clamp-2">{question.text}</p>

          <p className="text-xs text-green-700 line-clamp-1">{correctAnswerText}</p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-muted rounded-lg"
            aria-label="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-50 dark:bg-red-950/30 text-muted-foreground hover:text-red-500 rounded-lg"
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({
  quiz,
  onSave,
  onCancel,
  loading,
}: {
  quiz: Quiz;
  onSave: (data: Partial<Quiz>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [data, setData] = useState({
    title: quiz.title,
    description: quiz.description ?? '',
    timeLimit: quiz.timeLimit,
    passingScore: quiz.passingScore,
    maxAttempts: quiz.maxAttempts,
    shuffleQuestions: quiz.shuffleQuestions,
    showCorrectAnswers: quiz.showCorrectAnswers,
  });

  return (
    <div className="bg-card rounded-2xl p-6 border-2 border-yellow-400 mb-6">
      <h3 className="font-bold mb-4">Cài đặt quiz</h3>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-bold mb-2 block">Tiêu đề</label>
          <Input
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-bold mb-2 block">Mô tả</label>
          <textarea
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 border-2 border-border rounded-xl outline-none focus:border-foreground resize-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-bold mb-2 block">
              Thời gian (phút)
            </label>
            <Input
              type="number"
              value={data.timeLimit ?? ''}
              onChange={(e) =>
                setData({
                  ...data,
                  timeLimit: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder="Không giới hạn"
              min={0}
            />
          </div>

          <div>
            <label className="text-sm font-bold mb-2 block">Điểm pass (%)</label>
            <Input
              type="number"
              value={data.passingScore}
              onChange={(e) => setData({ ...data, passingScore: Number(e.target.value) })}
              min={0}
              max={100}
            />
          </div>

          <div>
            <label className="text-sm font-bold mb-2 block">Số lần thử</label>
            <Input
              type="number"
              value={data.maxAttempts}
              onChange={(e) => setData({ ...data, maxAttempts: Number(e.target.value) })}
              min={0}
              placeholder="0 = không giới hạn"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.shuffleQuestions}
              onChange={(e) =>
                setData({ ...data, shuffleQuestions: e.target.checked })
              }
            />
            <span className="text-sm">Trộn thứ tự câu hỏi</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showCorrectAnswers}
              onChange={(e) =>
                setData({ ...data, showCorrectAnswers: e.target.checked })
              }
            />
            <span className="text-sm">Hiển thị đáp án đúng sau khi submit</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={() => onSave(data)} disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu cài đặt'}
          </Button>
        </div>
      </div>
    </div>
  );
}
