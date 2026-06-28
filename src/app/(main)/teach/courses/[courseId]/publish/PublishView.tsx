'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Rocket, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useApi } from '@/hooks/useApi';

interface Check {
  label: string;
  passed: boolean;
}

interface Props {
  course: {
    id: string;
    title: string;
    slug: string;
    status: string;
  };
  checks: Check[];
}

export function PublishView({ course, checks }: Props) {
  const router = useRouter();
  const { call, loading } = useApi();

  const allPassed = checks.every((c) => c.passed);
  const passedCount = checks.filter((c) => c.passed).length;

  const handlePublish = async () => {
    if (!allPassed) return;
    await call(
      `/api/instructor/courses/${course.id}`,
      {
        method: 'PATCH',
        body: { section: 'publish', data: { status: 'PUBLISHED' } },
      },
      { successMessage: 'Đã xuất bản khóa học!' }
    );
    router.push(`/courses/${course.slug}`);
  };

  const handleUnpublish = async () => {
    await call(
      `/api/instructor/courses/${course.id}`,
      {
        method: 'PATCH',
        body: { section: 'publish', data: { status: 'DRAFT' } },
      },
      { successMessage: 'Đã chuyển về nháp' }
    );
    router.refresh();
  };

  return (
    <div className="max-w-3xl mx-auto p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2 font-display">Xuất bản khóa học</h1>
        <p className="text-muted-foreground">
          Đảm bảo khóa học đã sẵn sàng trước khi public cho hàng triệu học viên.
        </p>
      </div>

      {/* Status banner */}
      {course.status === 'PUBLISHED' && (
        <div className="bg-green-50 dark:bg-green-950/30 border-2 border-green-200 rounded-2xl p-5 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <div className="flex-1">
            <p className="font-bold text-green-900">Khóa học đang được xuất bản</p>
            <p className="text-sm text-green-700">
              Học viên có thể xem và mua khóa học của bạn.
            </p>
          </div>
          <Link href={`/courses/${course.slug}`}>
            <Button variant="outline" size="sm">
              <Eye className="w-3.5 h-3.5" />
              Xem trang
            </Button>
          </Link>
        </div>
      )}

      {/* Checklist */}
      <div className="bg-card rounded-2xl p-6 border border-border mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Checklist trước khi xuất bản</h3>
          <span
            className={`text-sm font-bold ${
              allPassed ? 'text-green-600' : 'text-orange-600'
            }`}
          >
            {passedCount}/{checks.length} hoàn thành
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-6">
          <div
            className={`h-full transition-all ${
              allPassed ? 'bg-green-500' : 'bg-yellow-400'
            }`}
            style={{ width: `${(passedCount / checks.length) * 100}%` }}
          />
        </div>

        <ul className="space-y-3">
          {checks.map((check, idx) => (
            <li
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                check.passed ? 'bg-green-50 dark:bg-green-950/30' : 'bg-orange-50 dark:bg-orange-950/30'
              }`}
            >
              {check.passed ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
              )}
              <span
                className={`text-sm ${
                  check.passed ? 'text-green-900' : 'text-orange-900 font-medium'
                }`}
              >
                {check.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action */}
      <div className="bg-card rounded-2xl p-6 border border-border mb-6">
        {course.status === 'DRAFT' ? (
          <>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-950/40 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Rocket className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1">Sẵn sàng xuất bản?</h3>
                <p className="text-sm text-muted-foreground">
                  Khi xuất bản, khóa học sẽ hiển thị công khai cho tất cả học viên trên Lumina.
                  Bạn vẫn có thể chỉnh sửa nội dung sau khi xuất bản.
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={handlePublish}
              disabled={!allPassed || loading}
            >
              <Rocket className="w-4 h-4" />
              {loading
                ? 'Đang xuất bản...'
                : allPassed
                ? 'Xuất bản khóa học'
                : `Hoàn thành ${checks.length - passedCount} mục còn lại`}
            </Button>
          </>
        ) : (
          <>
            <h3 className="font-bold mb-2">Chuyển về nháp</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Khóa học sẽ bị ẩn khỏi trang chủ và không thể mua mới. Học viên đã đăng ký vẫn có thể truy cập.
            </p>
            <Button variant="outline" onClick={handleUnpublish} disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Chuyển về nháp'}
            </Button>
          </>
        )}
      </div>

      <div className="flex justify-start">
        <Link href={`/teach/courses/${course.id}/settings`}>
          <Button variant="outline">← Quay lại</Button>
        </Link>
      </div>
    </div>
  );
}
