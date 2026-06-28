'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PlayCircle, Plus, FileQuestion, Edit2, Eye, Trash2, Users
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApi } from '@/hooks/useApi';

interface Lesson {
  id: string;
  title: string;
  order: number;
  quiz: {
    id: string;
    title: string;
    _count: { questions: number; attempts: number };
  } | null;
}

interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  sections: Section[];
}

export function QuizListClient({ course }: { course: Course }) {
  const router = useRouter();
  const { call, loading } = useApi();
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [newQuizTitle, setNewQuizTitle] = useState('');

  const totalQuizzes = course.sections.reduce(
    (acc, s) => acc + s.lessons.filter((l) => l.quiz).length,
    0
  );

  const handleCreate = async (lessonId: string) => {
    if (newQuizTitle.length < 3) return;

    const result = await call(
      '/api/instructor/quizzes',
      {
        method: 'POST',
        body: { lessonId, title: newQuizTitle },
      },
      { successMessage: 'Đã tạo quiz mới!' }
    );

    setCreatingFor(null);
    setNewQuizTitle('');
    router.push(`/teach/courses/${course.id}/quizzes/${result.quiz.id}`);
  };

  const handleDelete = async (quizId: string) => {
    if (!window.confirm('Xóa quiz này và tất cả câu hỏi bên trong?')) return;

    await call(
      `/api/instructor/quizzes/${quizId}`,
      { method: 'DELETE' },
      { successMessage: 'Đã xóa quiz' }
    );
    router.refresh();
  };

  return (
    <div className="max-w-4xl mx-auto p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black mb-2 font-display">Quiz & Bài tập</h1>
        <p className="text-muted-foreground">
          Tạo quiz cho từng bài học để kiểm tra kiến thức của học viên.
        </p>
      </div>

      {/* Stats */}
      <div className="bg-card rounded-2xl p-6 border border-border mb-6 grid grid-cols-3 gap-6">
        <div>
          <p className="text-2xl font-black font-display">{totalQuizzes}</p>
          <p className="text-sm text-muted-foreground">Quiz đã tạo</p>
        </div>
        <div>
          <p className="text-2xl font-black font-display">
            {course.sections.reduce((acc, s) => acc + s.lessons.length, 0)}
          </p>
          <p className="text-sm text-muted-foreground">Tổng bài học</p>
        </div>
        <div>
          <p className="text-2xl font-black font-display">
            {course.sections.reduce(
              (acc, s) =>
                acc +
                s.lessons.reduce(
                  (a, l) => a + (l.quiz?._count.attempts ?? 0),
                  0
                ),
              0
            )}
          </p>
          <p className="text-sm text-muted-foreground">Lượt làm bài</p>
        </div>
      </div>

      {/* Empty state */}
      {course.sections.length === 0 ? (
        <div className="text-center py-16 bg-muted/40 rounded-2xl">
          <FileQuestion className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="font-bold mb-2">Chưa có bài học nào</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Cần thêm bài học trước khi tạo quiz
          </p>
          <Link href={`/teach/courses/${course.id}/curriculum`}>
            <Button>Thêm bài học</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {course.sections.map((section, sIdx) => (
            <div
              key={section.id}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              <div className="p-4 bg-muted/40 border-b border-border">
                <h3 className="font-bold text-sm">
                  Chương {sIdx + 1}: {section.title}
                </h3>
              </div>
              <div className="divide-y divide-border">
                {section.lessons.map((lesson, lIdx) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    index={lIdx}
                    courseId={course.id}
                    isCreating={creatingFor === lesson.id}
                    onStartCreate={() => {
                      setCreatingFor(lesson.id);
                      setNewQuizTitle(`Quiz: ${lesson.title}`);
                    }}
                    onCancelCreate={() => {
                      setCreatingFor(null);
                      setNewQuizTitle('');
                    }}
                    quizTitle={newQuizTitle}
                    onTitleChange={setNewQuizTitle}
                    onConfirmCreate={() => handleCreate(lesson.id)}
                    onDelete={handleDelete}
                    loading={loading}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LessonRow({
  lesson,
  index,
  courseId,
  isCreating,
  onStartCreate,
  onCancelCreate,
  quizTitle,
  onTitleChange,
  onConfirmCreate,
  onDelete,
  loading,
}: {
  lesson: Lesson;
  index: number;
  courseId: string;
  isCreating: boolean;
  onStartCreate: () => void;
  onCancelCreate: () => void;
  quizTitle: string;
  onTitleChange: (v: string) => void;
  onConfirmCreate: () => void;
  onDelete: (quizId: string) => void;
  loading: boolean;
}) {
  return (
    <div className="p-4 flex items-center gap-3 hover:bg-muted/40">
      <span className="text-xs text-muted-foreground w-6">#{index + 1}</span>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{lesson.title}</p>

        {lesson.quiz && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <FileQuestion className="w-3 h-3" />
              {lesson.quiz._count.questions} câu hỏi
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {lesson.quiz._count.attempts} lượt làm
            </span>
          </div>
        )}

        {isCreating && (
          <div className="flex gap-2 mt-2">
            <Input
              value={quizTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Tên quiz..."
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && onConfirmCreate()}
              className="text-sm"
            />
            <Button size="sm" onClick={onConfirmCreate} disabled={loading || quizTitle.length < 3}>
              Tạo
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelCreate}>
              Hủy
            </Button>
          </div>
        )}
      </div>

      {!isCreating && (
        <div className="flex items-center gap-2">
          {lesson.quiz ? (
            <>
              <Link
                href={`/teach/courses/${courseId}/quizzes/${lesson.quiz.id}`}
                className="px-3 py-1.5 text-xs font-bold border border-border rounded-lg hover:border-foreground flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                Quản lý
              </Link>
              <button
                onClick={() => onDelete(lesson.quiz!.id)}
                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:bg-red-950/30 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={onStartCreate}>
              <Plus className="w-3.5 h-3.5" />
              Tạo quiz
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
