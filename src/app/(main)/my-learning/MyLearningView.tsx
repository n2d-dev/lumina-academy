'use client';

import Link from 'next/link';
import { BookOpen, PlayCircle, Clock, Trophy, Play } from 'lucide-react';
import { GRADIENTS } from '@/lib/constants';
import type { Course } from '@/types';

interface Props {
  courses: Course[];
  progress: Record<string, number>;
}

export function MyLearningView({ courses, progress }: Props) {
  const totalCompleted = Object.values(progress).filter((p) => p === 100).length;

  const stats = [
    { icon: BookOpen, label: 'Khóa học', value: courses.length, color: '#0066ff' },
    { icon: PlayCircle, label: 'Đang học', value: courses.length - totalCompleted, color: '#10b981' },
    { icon: Clock, label: 'Giờ học', value: '24h', color: '#f59e0b' },
    { icon: Trophy, label: 'Hoàn thành', value: totalCompleted, color: '#ec4899' },
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-2 font-display">
            Học tập của tôi
          </h1>
          <p className="text-neutral-600">Tiếp tục hành trình học tập của bạn</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="p-4 sm:p-6 bg-neutral-50 rounded-2xl">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: stat.color + '20' }}
                >
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div className="text-2xl sm:text-3xl font-black mb-1 font-display">{stat.value}</div>
                <div className="text-sm text-neutral-600">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {courses.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            <h2 className="text-2xl font-black mb-6 font-display">Tiếp tục học</h2>
            <div className="space-y-4">
              {courses.map((course) => (
                <CourseRow
                  key={course.id}
                  course={course}
                  progress={progress[course.id] ?? 0}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CourseRow({ course, progress }: { course: Course; progress: number }) {
  return (
    <Link
      href={`/learn/${course.id}`}
      className="bg-white border-2 border-neutral-100 hover:border-black rounded-2xl p-4 flex flex-col sm:flex-row gap-4 transition-all hover:-translate-y-0.5 active:translate-y-0 touch-manipulation"
    >
      {/* Thumbnail */}
      <div
        className="w-full h-36 sm:w-40 sm:h-24 rounded-xl flex-shrink-0 relative overflow-hidden"
        style={{ background: GRADIENTS[course.thumbnail ?? 'gradient-blue'] }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <Play className="w-8 h-8 text-white/80" fill="currentColor" />
        </div>
        {progress === 100 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-2xl">✅</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold mb-1 line-clamp-2">{course.title}</h3>
        <p className="text-sm text-neutral-500 mb-3">{course.instructor.name}</p>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-bold text-neutral-600 flex-shrink-0">{progress}%</span>
        </div>
        <p className="text-xs text-neutral-400">
          {progress === 100 ? '🎉 Đã hoàn thành' : progress === 0 ? 'Chưa bắt đầu' : `Đang học`}
        </p>
      </div>

      {/* CTA */}
      <div className="flex sm:items-center justify-end sm:justify-center">
        <span className="px-5 py-2.5 bg-black text-white text-sm font-bold rounded-full active:scale-95 transition-all touch-manipulation">
          {progress === 0 ? 'Bắt đầu' : progress === 100 ? 'Xem lại' : 'Tiếp tục'}
        </span>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <BookOpen className="w-10 h-10 text-neutral-400" />
      </div>
      <h2 className="text-2xl font-bold mb-3">Bắt đầu hành trình học tập</h2>
      <p className="text-neutral-600 mb-6">Bạn chưa đăng ký khóa học nào</p>
      <Link
        href="/courses"
        className="inline-block px-8 py-3 bg-black text-white font-bold rounded-full hover:bg-neutral-800"
      >
        Khám phá khóa học
      </Link>
    </div>
  );
}
