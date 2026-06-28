import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireCourseOwner } from '@/lib/auth-helpers';
import { GRADIENTS } from '@/lib/constants';
import { Button } from '@/components/ui/Button';

export default async function SettingsPage({
  params,
}: {
  params: { courseId: string };
}) {
  try {
    await requireCourseOwner(params.courseId);
  } catch {
    notFound();
  }

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
  });
  if (!course) notFound();

  return (
    <div className="max-w-3xl mx-auto p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black mb-2 font-display">Cài đặt khóa học</h1>
        <p className="text-muted-foreground">
          Tinh chỉnh các thông tin bổ sung cho khóa học.
        </p>
      </div>

      <div className="bg-card rounded-2xl p-6 border border-border mb-6">
        <h3 className="font-bold mb-4">Hình ảnh khóa học</h3>
        <div className="grid grid-cols-4 gap-3">
          {Object.keys(GRADIENTS).map((key) => (
            <button
              key={key}
              className={`aspect-video rounded-xl border-2 transition-all ${
                course.thumbnail === key
                  ? 'border-foreground scale-105'
                  : 'border-transparent hover:border-border'
              }`}
              style={{ background: GRADIENTS[key] }}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          💡 Trong production, có thể thay bằng upload ảnh thật qua S3.
        </p>
      </div>

      <div className="bg-card rounded-2xl p-6 border border-border mb-6">
        <h3 className="font-bold mb-4">Cài đặt nâng cao</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>• Featured (hiển thị trên trang chủ): Chỉ admin có thể bật</p>
          <p>• Bestseller badge: Tự động khi đạt {'>'}1000 enrollments</p>
          <p>• Captions/Subtitles: Coming soon</p>
        </div>
      </div>

      <div className="flex justify-between">
        <Link href={`/teach/courses/${course.id}/pricing`}>
          <Button variant="outline">← Quay lại</Button>
        </Link>
        <Link href={`/teach/courses/${course.id}/publish`}>
          <Button>Tiếp theo: Xuất bản →</Button>
        </Link>
      </div>
    </div>
  );
}
