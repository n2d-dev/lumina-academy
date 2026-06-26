'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Info, Layers, DollarSign, Settings as SettingsIcon, Rocket,
  Check, FileQuestion, Menu, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  icon: typeof Info;
  path: string;
}

const STEPS: Step[] = [
  { id: 'edit',       label: 'Thông tin cơ bản',  icon: Info,          path: 'edit' },
  { id: 'curriculum', label: 'Nội dung',           icon: Layers,        path: 'curriculum' },
  { id: 'quizzes',    label: 'Quiz & Bài tập',     icon: FileQuestion,  path: 'quizzes' },
  { id: 'pricing',    label: 'Định giá',            icon: DollarSign,    path: 'pricing' },
  { id: 'settings',   label: 'Cài đặt',            icon: SettingsIcon,  path: 'settings' },
  { id: 'publish',    label: 'Xuất bản',            icon: Rocket,        path: 'publish' },
];

interface Props {
  courseId: string;
  completedSteps?: string[];
}

export function CourseBuilderNav({ courseId, completedSteps = [] }: Props) {
  const pathname = usePathname();
  const currentStep = pathname.split('/').pop() ?? 'edit';
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentStepData = STEPS.find((s) => s.id === currentStep);

  const NavItems = () => (
    <nav className="space-y-1">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isCompleted = completedSteps.includes(step.id);

        return (
          <Link
            key={step.id}
            href={`/teach/courses/${courseId}/${step.path}`}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors touch-manipulation',
              isActive
                ? 'bg-black text-white'
                : 'hover:bg-neutral-50 active:bg-neutral-100 text-neutral-700'
            )}
          >
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
              isActive ? 'bg-yellow-400 text-black'
                : isCompleted ? 'bg-green-100 text-green-600'
                : 'bg-neutral-100 text-neutral-500'
            )}>
              {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
            </div>
            <span className="flex-1">{step.label}</span>
            <Icon className="w-4 h-4 opacity-40" />
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-neutral-200 min-h-screen sticky top-0 p-6 flex-col">
        <div className="mb-6">
          <Link href="/teach/dashboard" className="text-sm text-neutral-500 hover:text-black">
            ← Khóa học của tôi
          </Link>
        </div>
        <h2 className="text-base font-bold mb-4">Tạo khóa học</h2>
        <NavItems />
        <div className="mt-auto pt-6">
          <div className="p-3 bg-yellow-50 rounded-xl">
            <p className="text-xs font-bold mb-1">💡 Mẹo</p>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Hoàn thành đầy đủ các bước trước khi xuất bản để khóa học hiển thị tốt nhất.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile: sticky top bar with step name + hamburger */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/teach/dashboard" className="text-sm text-neutral-500">
            ←
          </Link>
          <span className="text-sm font-bold">
            {currentStepData?.label ?? 'Tạo khóa học'}
          </span>
          <span className="text-xs text-neutral-400">
            ({STEPS.findIndex(s => s.id === currentStep) + 1}/{STEPS.length})
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 touch-manipulation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="lg:hidden fixed inset-y-0 left-0 z-60 w-72 bg-white shadow-2xl p-6 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <Link href="/teach/dashboard" className="text-sm text-neutral-500">
                ← Khóa học của tôi
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-base font-bold mb-4">Tạo khóa học</h2>
            <NavItems />
          </div>
        </>
      )}
    </>
  );
}
