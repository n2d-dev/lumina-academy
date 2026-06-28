'use client';

import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Trash2, Edit2, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useApi } from '@/hooks/useApi';
import { LessonEditor } from './LessonEditor';
import { formatDuration } from '@/lib/utils';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  order: number;
  isPreview: boolean;
  // Mux fields
  muxStatus: 'PENDING' | 'UPLOADING' | 'PROCESSING' | 'READY' | 'ERRORED' | 'CANCELLED';
  muxPlaybackId: string | null;
}

interface Section {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: Lesson[];
}

interface CourseData {
  id: string;
  title: string;
  sections: Section[];
}

/**
 * Curriculum Builder
 *
 * Đây là component cốt lõi nhất của Course Builder.
 * Chức năng:
 *   - Hiển thị tree structure: Course > Sections > Lessons
 *   - Thêm/sửa/xóa section
 *   - Thêm/sửa/xóa lesson
 *   - Move up/down section/lesson
 *   - Inline edit title
 *   - Mở LessonEditor modal để edit chi tiết lesson
 *
 * Note: Drag-drop reorder cần thư viện như @dnd-kit/sortable.
 * Để giữ code production-ready mà không thêm dependency lớn,
 * mình dùng button up/down. Có thể nâng cấp sau bằng @dnd-kit.
 */
export function CurriculumBuilder({ course: initialCourse }: { course: CourseData }) {
  const { call } = useApi();
  const [course, setCourse] = useState(initialCourse);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingLessonSectionId, setEditingLessonSectionId] = useState<string | null>(null);

  const totalLessons = course.sections.reduce((acc, s) => acc + s.lessons.length, 0);
  const totalDuration = course.sections.reduce(
    (acc, s) => acc + s.lessons.reduce((a, l) => a + l.duration, 0),
    0
  );

  /* ============ Section operations ============ */

  const handleAddSection = async () => {
    const title = window.prompt('Tên chương:', 'Chương mới');
    if (!title || title.length < 3) return;

    const result = await call(
      '/api/instructor/sections',
      {
        method: 'POST',
        body: { courseId: course.id, title },
      },
      { successMessage: 'Đã tạo chương mới' }
    );

    setCourse({
      ...course,
      sections: [...course.sections, { ...result.section, lessons: [] }],
    });
  };

  const handleUpdateSection = async (sectionId: string, title: string) => {
    if (title.length < 3) return;
    await call(`/api/instructor/sections/${sectionId}`, {
      method: 'PATCH',
      body: { title },
    });

    setCourse({
      ...course,
      sections: course.sections.map((s) =>
        s.id === sectionId ? { ...s, title } : s
      ),
    });
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!window.confirm('Xóa chương này và tất cả bài học bên trong?')) return;

    await call(
      `/api/instructor/sections/${sectionId}`,
      { method: 'DELETE' },
      { successMessage: 'Đã xóa chương' }
    );

    setCourse({
      ...course,
      sections: course.sections.filter((s) => s.id !== sectionId),
    });
  };

  const handleMoveSection = async (sectionId: string, direction: 'up' | 'down') => {
    const currentIndex = course.sections.findIndex((s) => s.id === sectionId);
    if (currentIndex === -1) return;
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= course.sections.length) return;

    const newSections = [...course.sections];
    [newSections[currentIndex], newSections[newIndex]] = [
      newSections[newIndex],
      newSections[currentIndex],
    ];

    setCourse({ ...course, sections: newSections });

    await call('/api/instructor/sections', {
      method: 'PATCH',
      body: { courseId: course.id, sectionIds: newSections.map((s) => s.id) },
    });
  };

  /* ============ Lesson operations ============ */

  const handleAddLesson = async (sectionId: string) => {
    const title = window.prompt('Tên bài học:', 'Bài học mới');
    if (!title || title.length < 3) return;

    const result = await call(
      '/api/instructor/lessons',
      { method: 'POST', body: { sectionId, title } },
      { successMessage: 'Đã tạo bài học mới' }
    );

    setCourse({
      ...course,
      sections: course.sections.map((s) =>
        s.id === sectionId ? { ...s, lessons: [...s.lessons, result.lesson] } : s
      ),
    });
  };

  const handleUpdateLesson = async (lesson: Lesson) => {
    const result = await call(
      `/api/instructor/lessons/${lesson.id}`,
      {
        method: 'PATCH',
        body: {
          // Chỉ update các field user editable (Mux fields do webhook quản lý)
          title: lesson.title,
          description: lesson.description ?? '',
          isPreview: lesson.isPreview,
        },
      },
      { successMessage: 'Đã cập nhật bài học' }
    );

    setCourse({
      ...course,
      sections: course.sections.map((s) => ({
        ...s,
        lessons: s.lessons.map((l) => (l.id === lesson.id ? result.lesson : l)),
      })),
    });
    setEditingLesson(null);
    setEditingLessonSectionId(null);
  };

  const handleDeleteLesson = async (sectionId: string, lessonId: string) => {
    if (!window.confirm('Xóa bài học này?')) return;
    await call(
      `/api/instructor/lessons/${lessonId}`,
      { method: 'DELETE' },
      { successMessage: 'Đã xóa bài học' }
    );

    setCourse({
      ...course,
      sections: course.sections.map((s) =>
        s.id === sectionId
          ? { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) }
          : s
      ),
    });
  };

  const handleMoveLesson = async (
    sectionId: string,
    lessonId: string,
    direction: 'up' | 'down'
  ) => {
    const section = course.sections.find((s) => s.id === sectionId);
    if (!section) return;

    const currentIndex = section.lessons.findIndex((l) => l.id === lessonId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= section.lessons.length) return;

    const newLessons = [...section.lessons];
    [newLessons[currentIndex], newLessons[newIndex]] = [
      newLessons[newIndex],
      newLessons[currentIndex],
    ];

    setCourse({
      ...course,
      sections: course.sections.map((s) =>
        s.id === sectionId ? { ...s, lessons: newLessons } : s
      ),
    });

    await call('/api/instructor/lessons', {
      method: 'PATCH',
      body: { sectionId, lessonIds: newLessons.map((l) => l.id) },
    });
  };

  /* ============ Render ============ */

  return (
    <div className="max-w-4xl mx-auto p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black mb-2 font-display">Nội dung khóa học</h1>
        <p className="text-muted-foreground">
          Tổ chức nội dung thành chương và bài học. Học viên sẽ học theo thứ tự bạn sắp xếp.
        </p>
      </div>

      {/* Stats */}
      <div className="bg-card rounded-2xl p-6 border border-border mb-6">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-2xl font-black font-display">{course.sections.length}</p>
            <p className="text-sm text-muted-foreground">Chương</p>
          </div>
          <div>
            <p className="text-2xl font-black font-display">{totalLessons}</p>
            <p className="text-sm text-muted-foreground">Bài học</p>
          </div>
          <div>
            <p className="text-2xl font-black font-display">
              {formatDuration(totalDuration)}
            </p>
            <p className="text-sm text-muted-foreground">Tổng thời lượng</p>
          </div>
        </div>
      </div>

      {/* Sections list */}
      <div className="space-y-4">
        {course.sections.map((section, sIdx) => (
          <SectionItem
            key={section.id}
            section={section}
            index={sIdx}
            totalSections={course.sections.length}
            onUpdate={handleUpdateSection}
            onDelete={handleDeleteSection}
            onMove={handleMoveSection}
            onAddLesson={handleAddLesson}
            onEditLesson={(lesson) => {
              setEditingLesson(lesson);
              setEditingLessonSectionId(section.id);
            }}
            onDeleteLesson={handleDeleteLesson}
            onMoveLesson={handleMoveLesson}
          />
        ))}

        <button
          onClick={handleAddSection}
          className="w-full py-6 border-2 border-dashed border-border rounded-2xl text-sm font-bold text-muted-foreground hover:border-foreground hover:text-foreground flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm chương mới
        </button>
      </div>

      {/* Bottom navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => (window.location.href = `/teach/courses/${course.id}/edit`)}
        >
          ← Quay lại
        </Button>
        <Button
          size="lg"
          onClick={() => (window.location.href = `/teach/courses/${course.id}/pricing`)}
        >
          Tiếp theo: Định giá →
        </Button>
      </div>

      {/* Lesson Editor Modal */}
      {editingLesson && (
        <LessonEditor
          lesson={editingLesson}
          onSave={handleUpdateLesson as any}
          onClose={() => {
            setEditingLesson(null);
            setEditingLessonSectionId(null);
          }}
        />
      )}
    </div>
  );
}

/* =================== SECTION ITEM =================== */

function SectionItem({
  section,
  index,
  totalSections,
  onUpdate,
  onDelete,
  onMove,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onMoveLesson,
}: {
  section: Section;
  index: number;
  totalSections: number;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onAddLesson: (sectionId: string) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (sectionId: string, lessonId: string) => void;
  onMoveLesson: (sectionId: string, lessonId: string, direction: 'up' | 'down') => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(section.title);

  const handleSaveTitle = () => {
    if (title !== section.title && title.length >= 3) {
      onUpdate(section.id, title);
    }
    setEditing(false);
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Section header */}
      <div className="p-4 bg-muted/40 flex items-center gap-3">
        <div className="flex flex-col">
          <button
            onClick={() => onMove(section.id, 'up')}
            disabled={index === 0}
            className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
            aria-label="Move up"
          >
            <ChevronRight className="w-3 h-3 -rotate-90" />
          </button>
          <button
            onClick={() => onMove(section.id, 'down')}
            disabled={index === totalSections - 1}
            className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
            aria-label="Move down"
          >
            <ChevronRight className="w-3 h-3 rotate-90" />
          </button>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 hover:bg-muted rounded"
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        <span className="text-xs font-bold text-muted-foreground uppercase">
          Chương {index + 1}
        </span>

        {editing ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
            autoFocus
            className="flex-1"
          />
        ) : (
          <h3
            onClick={() => setEditing(true)}
            className="flex-1 font-bold cursor-pointer hover:text-yellow-600"
          >
            {section.title}
          </h3>
        )}

        <span className="text-xs text-muted-foreground">
          {section.lessons.length} bài
        </span>

        <button
          onClick={() => onDelete(section.id)}
          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:bg-red-950/30 rounded-lg"
          aria-label="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Lessons */}
      {expanded && (
        <div className="divide-y divide-border">
          {section.lessons.map((lesson, lIdx) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              index={lIdx}
              totalLessons={section.lessons.length}
              onEdit={() => onEditLesson(lesson)}
              onDelete={() => onDeleteLesson(section.id, lesson.id)}
              onMove={(dir) => onMoveLesson(section.id, lesson.id, dir)}
            />
          ))}
          <button
            onClick={() => onAddLesson(section.id)}
            className="w-full p-4 text-sm font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm bài học
          </button>
        </div>
      )}
    </div>
  );
}

/* =================== LESSON ROW =================== */

function LessonRow({
  lesson,
  index,
  totalLessons,
  onEdit,
  onDelete,
  onMove,
}: {
  lesson: Lesson;
  index: number;
  totalLessons: number;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
}) {
  return (
    <div className="p-4 flex items-center gap-3 hover:bg-muted/40 group">
      <div className="flex flex-col">
        <button
          onClick={() => onMove('up')}
          disabled={index === 0}
          className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
        >
          <ChevronRight className="w-3 h-3 -rotate-90" />
        </button>
        <button
          onClick={() => onMove('down')}
          disabled={index === totalLessons - 1}
          className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
        >
          <ChevronRight className="w-3 h-3 rotate-90" />
        </button>
      </div>

      <span className="text-xs text-muted-foreground w-6">#{index + 1}</span>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{lesson.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <VideoStatusBadge status={lesson.muxStatus} />
          {lesson.duration > 0 && <span>• {formatDuration(lesson.duration)}</span>}
          {lesson.isPreview && (
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/40 text-blue-700 rounded text-[10px] font-bold">
              PREVIEW
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onEdit}
        className="px-3 py-1.5 text-xs font-bold border border-border rounded-lg hover:border-foreground flex items-center gap-1"
      >
        <Edit2 className="w-3 h-3" />
        Sửa
      </button>
      <button
        onClick={onDelete}
        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:bg-red-950/30 rounded-lg"
        aria-label="Delete lesson"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

/* =================== VIDEO STATUS BADGE =================== */

function VideoStatusBadge({ status }: { status: Lesson['muxStatus'] }) {
  switch (status) {
    case 'READY':
      return <span className="text-green-600 font-bold">● Có video</span>;
    case 'PROCESSING':
      return <span className="text-blue-600 font-bold">⟳ Đang xử lý</span>;
    case 'UPLOADING':
      return <span className="text-yellow-600 font-bold">↑ Đang upload</span>;
    case 'ERRORED':
      return <span className="text-red-600 font-bold">⚠ Lỗi video</span>;
    case 'CANCELLED':
    case 'PENDING':
    default:
      return <span className="text-orange-500">○ Chưa có video</span>;
  }
}
