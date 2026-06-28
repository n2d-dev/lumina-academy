import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiUser , authErrorResponse } from '@/lib/auth-helpers';
import { generatePlaybackToken as createPlaybackToken } from '@/lib/mux';

interface Params {
  params: { lessonId: string };
}

/**
 * GET /api/lessons/[lessonId]/playback
 *
 * Trả về playback ID + signed JWT token để student xem video
 *
 * Authorization logic:
 * 1. Lesson có isPreview = true → ai cũng xem được (kể cả chưa login)
 * 2. Student đã enroll vào course → cấp signed token
 * 3. Instructor là owner của course → cấp signed token (để preview)
 * 4. Khác → 403
 *
 * Token expire 6h - đủ để xem 1 lesson nhưng không thể share lâu dài
 *
 * Tại sao tách endpoint riêng (thay vì gửi token trong page server-side)?
 * - Token có thời hạn → cần fresh khi user mở lại tab
 * - Token rotation: nếu user pause 8h rồi resume, gọi lại endpoint là có token mới
 * - Tránh leak token vào HTML page → nếu user share URL không bao gồm token
 */
export async function GET(_: Request, { params }: Params) {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.lessonId },
      include: {
        section: {
          include: {
            course: { select: { id: true, instructorId: true } },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ message: 'Bài học không tồn tại' }, { status: 404 });
    }

    if (!lesson.muxPlaybackId || lesson.muxStatus !== 'READY') {
      return NextResponse.json(
        { message: 'Video chưa sẵn sàng', status: lesson.muxStatus },
        { status: 400 }
      );
    }

    // 1. Preview lesson - public access
    if (lesson.isPreview) {
      // Cho preview vẫn dùng signed token để có thể tracking, nhưng không yêu cầu login
      try {
        const token = createPlaybackToken(lesson.muxPlaybackId, 60 * 60);
        return NextResponse.json({
          playbackId: lesson.muxPlaybackId,
          token,
          isPreview: true,
        });
      } catch {
        // Fallback nếu chưa setup signing key
        return NextResponse.json({
          playbackId: lesson.muxPlaybackId,
          token: null,
          isPreview: true,
        });
      }
    }

    // 2/3. Cần login - check enrollment hoặc ownership
    const user = await requireApiUser();
    const courseId = lesson.section.course.id;

    const isOwner =
      user.role === 'ADMIN' || lesson.section.course.instructorId === user.id;

    if (!isOwner) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId } },
      });

      if (!enrollment) {
        return NextResponse.json(
          { message: 'Bạn cần đăng ký khóa học để xem video này' },
          { status: 403 }
        );
      }
    }

    // Cấp signed token (6h)
    try {
      const token = createPlaybackToken(lesson.muxPlaybackId, 6 * 60 * 60);

      return NextResponse.json({
        playbackId: lesson.muxPlaybackId,
        token,
        isPreview: false,
      });
    } catch (err: any) {
      // Nếu chưa setup signing key, fallback dùng public playback
      // (chỉ work nếu Mux asset có public playback policy)
      console.warn('Signing key error, falling back to public:', err.message);
      return NextResponse.json({
        playbackId: lesson.muxPlaybackId,
        token: null,
        isPreview: false,
      });
    }
  } catch (err: any) {
    const authRes = authErrorResponse(err);
    if (authRes) return authRes;
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
