'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, FileText, Download } from 'lucide-react';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { LessonSidebar } from '@/components/learning/LessonSidebar';
import { formatDuration } from '@/lib/utils';
import type { Course, Lesson } from '@/types';

interface Props {
  course: Course;
  completedLessonIds: string[];
}

export function LearnView({ course, completedLessonIds: initialCompleted }: Props) {
  const firstLesson = course.sections?.[0]?.lessons[0];
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(firstLesson ?? null);
  const [completedIds, setCompletedIds] = useState<string[]>(initialCompleted);

  const totalLessons =
    course.sections?.reduce((acc, s) => acc + s.lessons.length, 0) ?? 0;

  const handleLessonComplete = () => {
    if (activeLesson && !completedIds.includes(activeLesson.id)) {
      setCompletedIds([...completedIds, activeLesson.id]);
      // Production: gọi API để lưu progress
      // fetch('/api/lessons/progress', { method: 'POST', body: JSON.stringify({ lessonId: activeLesson.id }) });
    }
  };

  return (
    <div className="bg-neutral-900 min-h-screen text-white flex flex-col">
      {/* Top bar */}
      <div className="bg-black border-b border-neutral-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link href="/my-learning" className="flex items-center gap-2 text-sm hover:text-yellow-400">
          <ChevronLeft className="w-4 h-4" />
          <span className="font-bold text-sm line-clamp-1">{course.title}</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4 text-sm flex-shrink-0">
          <span className="hidden sm:block text-neutral-400">
            {completedIds.length}/{totalLessons} bài đã hoàn thành
          </span>
          <button className="px-3 py-2 sm:px-4 bg-yellow-400 text-black font-bold rounded-full text-xs touch-manipulation active:scale-95 transition-all">
            Đánh giá
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {activeLesson && (
            <VideoPlayer
              key={activeLesson.id}
              lessonId={activeLesson.id}
              onComplete={handleLessonComplete}
              onTimeUpdate={(currentTime, duration) => {
                // TODO: Throttle save progress qua API
                // fetch(`/api/lessons/${activeLesson.id}/progress`, ...)
              }}
            />
          )}
          <div className="flex-1 p-4 sm:p-6 overflow-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 font-display">
              {activeLesson?.title ?? 'Chọn bài học'}
            </h2>
            {activeLesson && (
              <p className="text-neutral-400 mb-6">
                Thời lượng: {formatDuration(activeLesson.duration)}
              </p>
            )}

            <div className="border-b border-neutral-800 mb-6">
              <div className="flex gap-6">
                {['Tổng quan', 'Tài liệu', 'Q&A', 'Ghi chú'].map((tab, idx) => (
                  <button
                    key={tab}
                    className={`pb-3 text-sm font-bold ${
                      idx === 0
                        ? 'border-b-2 border-yellow-400 text-yellow-400'
                        : 'text-neutral-400'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-neutral-300 leading-relaxed">
              {activeLesson?.description ??
                'Trong bài học này, chúng ta sẽ tìm hiểu chi tiết về các khái niệm cơ bản. Hãy chú ý theo dõi các ví dụ và thực hành theo các bài tập đi kèm.'}
            </p>

            <div className="mt-8 p-4 bg-neutral-800 rounded-xl">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-yellow-400" />
                Tài liệu bài học
              </h3>
              <div className="space-y-2 mt-3">
                {['Slide bài giảng.pdf', 'Source code.zip', 'Bài tập thực hành.pdf'].map((file) => (
                  <button
                    key={file}
                    className="w-full flex items-center justify-between p-3 bg-neutral-900 rounded-lg hover:bg-neutral-700 text-sm"
                  >
                    <span>{file}</span>
                    <Download className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <LessonSidebar
          course={course}
          activeLessonId={activeLesson?.id ?? ''}
          completedLessonIds={completedIds}
          onSelectLesson={setActiveLesson}
        />
      </div>
    </div>
  );
}
