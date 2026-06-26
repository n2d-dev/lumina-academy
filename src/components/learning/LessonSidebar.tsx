'use client';

import { CircleCheck, PlayCircle } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import type { Course, Lesson } from '@/types';

interface Props {
  course: Course;
  activeLessonId: string;
  completedLessonIds: string[];
  onSelectLesson: (lesson: Lesson) => void;
}

export function LessonSidebar({
  course,
  activeLessonId,
  completedLessonIds,
  onSelectLesson,
}: Props) {
  const totalLessons =
    course.sections?.reduce((acc, s) => acc + s.lessons.length, 0) ?? 0;

  return (
    <div className="lg:w-96 bg-neutral-950 border-l border-neutral-800 overflow-auto">
      <div className="p-4 border-b border-neutral-800">
        <h3 className="font-bold text-white">Nội dung khóa học</h3>
        <p className="text-xs text-neutral-400 mt-1">
          {course.sections?.length ?? 0} chương • {totalLessons} bài
        </p>
      </div>

      <div>
        {course.sections?.map((section, sIdx) => {
          const completedInSection = section.lessons.filter((l) =>
            completedLessonIds.includes(l.id)
          ).length;

          return (
            <div key={section.id} className="border-b border-neutral-800">
              <div className="p-4 bg-neutral-900">
                <h4 className="font-bold text-sm text-white mb-1">
                  Chương {sIdx + 1}: {section.title}
                </h4>
                <p className="text-xs text-neutral-400">
                  {completedInSection}/{section.lessons.length} đã hoàn thành
                </p>
              </div>
              {section.lessons.map((lesson) => {
                const isCompleted = completedLessonIds.includes(lesson.id);
                const isActive = activeLessonId === lesson.id;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => onSelectLesson(lesson)}
                    className={cn(
                      'w-full p-4 flex items-start gap-3 hover:bg-neutral-900 text-left transition-colors',
                      isActive && 'bg-neutral-800'
                    )}
                  >
                    <div className="mt-0.5">
                      {isCompleted ? (
                        <CircleCheck className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-neutral-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm mb-1',
                          isActive ? 'text-yellow-400 font-bold' : 'text-white'
                        )}
                      >
                        {lesson.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <PlayCircle className="w-3 h-3" />
                        <span>{formatDuration(lesson.duration)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
