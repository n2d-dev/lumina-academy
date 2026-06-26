'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrayFieldEditor } from '@/components/instructor/ArrayFieldEditor';
import { SaveIndicator } from '@/components/instructor/SaveIndicator';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useApi } from '@/hooks/useApi';
import { COURSE_LEVELS } from '@/lib/validations/course';

interface CourseData {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  level: string;
  language: string;
  whatYouLearn: string[];
  requirements: string[];
  targetAudience: string[];
}

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Người mới bắt đầu',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
  ALL_LEVELS: 'Mọi cấp độ',
};

/**
 * Form chỉnh sửa thông tin cơ bản của khóa học
 * Tính năng:
 * - Auto-save khi user dừng gõ 1.5s
 * - Hiển thị status save
 * - Validation real-time
 */
export function BasicInfoEditor({ course }: { course: CourseData }) {
  const { call } = useApi();
  const [data, setData] = useState({
    title: course.title,
    subtitle: course.subtitle ?? '',
    description: course.description,
    level: course.level,
    language: course.language,
    whatYouLearn:
      course.whatYouLearn.length > 0 ? course.whatYouLearn : ['', '', ''],
    requirements: course.requirements.length > 0 ? course.requirements : [''],
    targetAudience:
      course.targetAudience.length > 0 ? course.targetAudience : [''],
  });

  // Auto-save
  const { status } = useAutoSave({
    data,
    onSave: async (newData) => {
      // Lọc bỏ string rỗng trong arrays
      const cleaned = {
        ...newData,
        whatYouLearn: newData.whatYouLearn.filter((s) => s.trim()),
        requirements: newData.requirements.filter((s) => s.trim()),
        targetAudience: newData.targetAudience.filter((s) => s.trim()),
      };

      // Chỉ save nếu đủ điều kiện minimum
      if (
        cleaned.title.length < 10 ||
        cleaned.description.length < 50 ||
        cleaned.whatYouLearn.length < 3
      ) {
        return; // Không save nếu chưa đủ minimum
      }

      await call(`/api/instructor/courses/${course.id}`, {
        method: 'PATCH',
        body: { section: 'basic', data: cleaned },
      });
    },
  });

  const update = <K extends keyof typeof data>(key: K, value: (typeof data)[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto p-8 lg:p-12">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black mb-2 font-display">Thông tin cơ bản</h1>
          <p className="text-neutral-600">
            Cung cấp thông tin chi tiết để học viên hiểu rõ về khóa học của bạn.
          </p>
        </div>
        <SaveIndicator status={status} />
      </div>

      <div className="space-y-8">
        <Section title="Tiêu đề & Mô tả">
          <FormField label="Tiêu đề khóa học" required hint="Tối thiểu 10, tối đa 100 ký tự">
            <Input
              value={data.title}
              onChange={(e) => update('title', e.target.value)}
              maxLength={100}
              placeholder="Ví dụ: React.js Toàn Tập 2026: Từ Zero Đến Hero"
            />
            <Counter current={data.title.length} max={100} />
          </FormField>

          <FormField
            label="Phụ đề"
            hint="Tóm tắt ngắn gọn nội dung khóa học (không bắt buộc)"
          >
            <Input
              value={data.subtitle}
              onChange={(e) => update('subtitle', e.target.value)}
              maxLength={200}
              placeholder="Ví dụ: Học React qua 15 dự án thực tế"
            />
            <Counter current={data.subtitle.length} max={200} />
          </FormField>

          <FormField
            label="Mô tả chi tiết"
            required
            hint="Mô tả đầy đủ về nội dung, đối tượng và những gì học viên đạt được"
          >
            <textarea
              value={data.description}
              onChange={(e) => update('description', e.target.value)}
              rows={6}
              maxLength={5000}
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl outline-none focus:border-black resize-none"
              placeholder="Mô tả về khóa học của bạn..."
            />
            <Counter current={data.description.length} max={5000} min={50} />
          </FormField>
        </Section>

        <Section title="Cấp độ & Ngôn ngữ">
          <div className="grid md:grid-cols-2 gap-4">
            <FormField label="Cấp độ" required>
              <select
                value={data.level}
                onChange={(e) => update('level', e.target.value)}
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl outline-none focus:border-black"
              >
                {COURSE_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {LEVEL_LABELS[l]}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Ngôn ngữ" required>
              <select
                value={data.language}
                onChange={(e) => update('language', e.target.value)}
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl outline-none focus:border-black"
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </FormField>
          </div>
        </Section>

        <Section title="Mục tiêu học tập">
          <ArrayFieldEditor
            label="Bạn sẽ học được gì?"
            hint="Liệt kê những kỹ năng, kiến thức cụ thể học viên đạt được"
            values={data.whatYouLearn}
            onChange={(v) => update('whatYouLearn', v)}
            placeholder="Ví dụ: Thành thạo React Hooks và Context API"
            minItems={3}
            maxItems={20}
          />
        </Section>

        <Section title="Yêu cầu trước khóa học">
          <ArrayFieldEditor
            label="Yêu cầu / Điều kiện"
            hint="Học viên cần biết gì trước khi tham gia khóa học này?"
            values={data.requirements}
            onChange={(v) => update('requirements', v)}
            placeholder="Ví dụ: Kiến thức HTML/CSS cơ bản"
            maxItems={10}
          />
        </Section>

        <Section title="Đối tượng học viên">
          <ArrayFieldEditor
            label="Khóa học này dành cho ai?"
            values={data.targetAudience}
            onChange={(v) => update('targetAudience', v)}
            placeholder="Ví dụ: Lập trình viên frontend muốn học React"
            maxItems={10}
          />
        </Section>

        <div className="flex justify-end pt-4">
          <Button
            size="lg"
            onClick={() => (window.location.href = `/teach/courses/${course.id}/curriculum`)}
          >
            Tiếp theo: Nội dung khóa học →
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-neutral-100">
      <h3 className="font-bold mb-4 text-lg">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-bold mb-1 block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-neutral-500 mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function Counter({ current, max, min }: { current: number; max: number; min?: number }) {
  const isUnder = min && current < min;
  return (
    <p
      className={`text-xs mt-1 ${
        isUnder ? 'text-red-500' : 'text-neutral-500'
      }`}
    >
      {current}/{max} {min ? `(tối thiểu ${min})` : ''}
    </p>
  );
}
