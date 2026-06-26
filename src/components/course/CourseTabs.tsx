'use client';

import { useState } from 'react';
import { CheckCircle2, Trophy, Award, PlayCircle } from 'lucide-react';
import { cn, formatNumber, formatDuration } from '@/lib/utils';
import type { Course } from '@/types';

interface Props {
  course: Course;
}

const TABS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'curriculum', label: 'Nội dung' },
  { id: 'instructor', label: 'Giảng viên' },
  { id: 'reviews', label: 'Đánh giá' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function CourseTabs({ course }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <>
      <div className="border-b border-neutral-200 sticky top-[57px] sm:top-[73px] bg-white z-40">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex gap-4 sm:gap-8 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'py-3 sm:py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-black text-black'
                    : 'border-transparent text-neutral-500 hover:text-black'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {activeTab === 'overview' && <OverviewTab course={course} />}
        {activeTab === 'curriculum' && <CurriculumTab course={course} />}
        {activeTab === 'instructor' && <InstructorTab course={course} />}
        {activeTab === 'reviews' && <ReviewsTab course={course} />}
      </div>
    </>
  );
}

function OverviewTab({ course }: Props) {
  return (
    <div className="grid lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2 space-y-12">
        <div>
          <h2 className="text-3xl font-black mb-6 font-display">Bạn sẽ học được gì?</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {course.whatYouLearn.map((item, idx) => (
              <div key={idx} className="flex gap-3 items-start p-4 bg-neutral-50 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {course.requirements.length > 0 && (
          <div>
            <h2 className="text-3xl font-black mb-6 font-display">Yêu cầu</h2>
            <ul className="space-y-2">
              {course.requirements.map((req, idx) => (
                <li key={idx} className="flex items-center gap-2 text-neutral-700">
                  <span className="w-1 h-1 bg-black rounded-full" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h2 className="text-3xl font-black mb-6 font-display">Mô tả khóa học</h2>
          <p className="text-neutral-700 leading-relaxed">{course.description}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-200">
          <Trophy className="w-8 h-8 text-yellow-600 mb-3" />
          <h3 className="font-bold mb-2">Đảm bảo hoàn tiền</h3>
          <p className="text-sm text-neutral-700">30 ngày hoàn tiền 100% nếu không hài lòng</p>
        </div>

        <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
          <Award className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-bold mb-2">Chứng chỉ chuyên nghiệp</h3>
          <p className="text-sm text-neutral-700">Nhận chứng chỉ được công nhận quốc tế</p>
        </div>
      </div>
    </div>
  );
}

function CurriculumTab({ course }: Props) {
  if (!course.sections || course.sections.length === 0) {
    return <p className="text-neutral-600">Nội dung đang được cập nhật...</p>;
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-3xl font-black mb-2 font-display">Nội dung khóa học</h2>
      <p className="text-neutral-600 mb-8">
        {course.sections.length} chương • {course.totalLectures} bài giảng •{' '}
        {formatDuration(course.totalDuration)}
      </p>

      <div className="space-y-3">
        {course.sections.map((section, idx) => (
          <div key={section.id} className="border border-neutral-200 rounded-2xl overflow-hidden">
            <div className="p-5 bg-neutral-50">
              <h3 className="font-bold mb-1">
                Chương {idx + 1}: {section.title}
              </h3>
              <p className="text-sm text-neutral-600">{section.lessons.length} bài</p>
            </div>
            <div className="divide-y divide-neutral-100">
              {section.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="p-4 flex items-center justify-between hover:bg-neutral-50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <PlayCircle className="w-5 h-5 text-neutral-400" />
                    <span className="text-sm">{lesson.title}</span>
                    {lesson.isPreview && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                        Xem trước
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-neutral-500">{formatDuration(lesson.duration)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InstructorTab({ course }: Props) {
  return (
    <div className="max-w-3xl">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-5xl font-black flex-shrink-0">
          {course.instructor.name[0]}
        </div>
        <div>
          <h2 className="text-3xl font-black mb-1 font-display">{course.instructor.name}</h2>
          <p className="text-neutral-600 mb-4">{course.instructor.title}</p>
        </div>
      </div>
      <p className="text-neutral-700 leading-relaxed">
        Với hơn 10 năm kinh nghiệm trong ngành và làm việc tại các công ty hàng đầu thế giới,{' '}
        {course.instructor.name} đã đào tạo hàng nghìn học viên trở thành những chuyên gia thành công.
      </p>
    </div>
  );
}

function ReviewsTab({ course }: Props) {
  return (
    <div className="max-w-4xl">
      <p className="text-neutral-600">
        {formatNumber(course.totalReviews)} đánh giá • Trung bình {course.averageRating.toFixed(1)}{' '}
        sao
      </p>
    </div>
  );
}
