import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiUser , authErrorResponse } from '@/lib/auth-helpers';
import { generatePlaybackToken, generateThumbnailToken } from '@/lib/mux';

const playbackSchema = z.object({
  lessonId: z.string(),
});

/**
 * POST /api/mux/playback
 * Trả về signed playback tokens cho 1 lesson
 *
 * Authorization rules:
 * 1. Lesson preview → ai cũng xem được (không cần login)
 * 2. Lesson thường → cần enroll vào course
 * 3. Instructor của course → luôn xem được
 * 4. Admin → xem được tất cả
 *
 * Token expires sau 6 giờ. Client refresh bằng cách gọi lại API.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lessonId } = playbackSchema.parse(body);

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          include: { course: { select: { id: true, instructorId: true } } },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ message: 'Bài học không tồn tại' }, { status: 404 });
    }

    if (!lesson.muxPlaybackId || lesson.muxStatus !== 'READY') {
      return NextResponse.json(
        { message: 'Video chưa sẵn sàng để phát' },
        { status: 400 }
      );
    }

    const courseId = lesson.section.course.id;
    let allowed = lesson.isPreview;

    if (!allowed) {
      const user = await requireApiUser().catch(() => null);

      if (!user) {
        return NextResponse.json(
          { message: 'Vui lòng đăng nhập' },
          { status: 401 }
        );
      }

      if (user.role === 'ADMIN') {
        allowed = true;
      } else if (lesson.section.course.instructorId === user.id) {
        allowed = true;
      } else {
        const enrollment = await prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: user.id, courseId } },
        });
        allowed = !!enrollment;
      }
    }

    if (!allowed) {
      return NextResponse.json(
        { message: 'Bạn cần đăng ký khóa học để xem' },
        { status: 403 }
      );
    }

    const videoToken = generatePlaybackToken(lesson.muxPlaybackId, 6 * 60 * 60);
    const thumbnailToken = generateThumbnailToken(
      lesson.muxPlaybackId,
      24 * 60 * 60
    );

    return NextResponse.json({
      playbackId: lesson.muxPlaybackId,
      videoToken,
      thumbnailToken,
    });
  } catch (err: any) {
    const authRes = authErrorResponse(err);
    if (authRes) return authRes;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.errors[0].message }, { status: 400 });
    }
    console.error('Playback error:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
