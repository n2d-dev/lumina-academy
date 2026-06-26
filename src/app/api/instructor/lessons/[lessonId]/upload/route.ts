import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireInstructor } from '@/lib/auth-helpers';
import { createDirectUpload } from '@/lib/mux';

interface Params {
  params: { lessonId: string };
}

/**
 * POST /api/instructor/lessons/[lessonId]/upload
 *
 * Tạo Mux direct upload URL để client upload trực tiếp tới Mux
 *
 * Workflow:
 * 1. Verify user là owner của lesson
 * 2. Nếu lesson đã có muxAssetId cũ → cancel/replace
 * 3. Gọi Mux create direct upload với passthrough = lessonId
 * 4. Lưu uploadId vào DB, set status = UPLOADING
 * 5. Return uploadUrl cho client → client dùng MuxUploader để upload
 *
 * Sau đó:
 * - Client upload lên uploadUrl (không qua server của ta)
 * - Mux xử lý xong → gửi webhook video.asset.ready
 * - Webhook handler update muxAssetId, muxPlaybackId, set status = READY
 */
export async function POST(_: Request, { params }: Params) {
  try {
    const user = await requireInstructor();

    // Verify ownership
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.lessonId },
      include: {
        section: { include: { course: { select: { instructorId: true } } } },
      },
    });

    if (!lesson) {
      return NextResponse.json({ message: 'Bài học không tồn tại' }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && lesson.section.course.instructorId !== user.id) {
      return NextResponse.json({ message: 'Không có quyền' }, { status: 403 });
    }

    // Tạo upload URL trên Mux
    // Passthrough = lessonId để webhook handler biết update record nào
    const { uploadId, uploadUrl } = await createDirectUpload({
      passthrough: params.lessonId,
      corsOrigin: process.env.NEXTAUTH_URL ?? '*',
    });

    // Lưu uploadId, set status = UPLOADING
    // Reset asset/playback IDs cũ nếu user upload lại video mới
    await prisma.lesson.update({
      where: { id: params.lessonId },
      data: {
        muxUploadId: uploadId,
        muxStatus: 'UPLOADING',
        muxAssetId: null,
        muxPlaybackId: null,
      },
    });

    return NextResponse.json({ uploadUrl, uploadId });
  } catch (err: any) {
    console.error('Mux upload create error:', err);
    return NextResponse.json(
      { message: err.message ?? 'Không thể tạo upload URL' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/instructor/lessons/[lessonId]/upload
 *
 * Xóa video khỏi lesson (xóa asset trên Mux + clear DB fields)
 */
export async function DELETE(_: Request, { params }: Params) {
  try {
    const user = await requireInstructor();

    const lesson = await prisma.lesson.findUnique({
      where: { id: params.lessonId },
      include: {
        section: { include: { course: { select: { instructorId: true } } } },
      },
    });

    if (!lesson) {
      return NextResponse.json({ message: 'Bài học không tồn tại' }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && lesson.section.course.instructorId !== user.id) {
      return NextResponse.json({ message: 'Không có quyền' }, { status: 403 });
    }

    // Xóa asset trên Mux nếu có
    if (lesson.muxAssetId) {
      const { deleteAsset } = await import('@/lib/mux');
      await deleteAsset(lesson.muxAssetId);
    }

    // Clear DB
    await prisma.lesson.update({
      where: { id: params.lessonId },
      data: {
        muxUploadId: null,
        muxAssetId: null,
        muxPlaybackId: null,
        muxStatus: 'PENDING',
        muxAspectRatio: null,
        muxMaxResolution: null,
        duration: 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
