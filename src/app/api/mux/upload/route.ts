import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiInstructor , authErrorResponse } from '@/lib/auth-helpers';
import { createDirectUpload, deleteAsset, isMuxConfigured } from '@/lib/mux';

const createUploadSchema = z.object({
  lessonId: z.string(),
});

/**
 * POST /api/mux/upload
 * Tạo Direct Upload URL cho 1 lesson
 *
 * Workflow:
 * 1. Instructor click "Upload video"
 * 2. Frontend gọi API này → nhận uploadUrl + uploadId
 * 3. Frontend upload file TRỰC TIẾP lên Mux qua MuxUploader component
 * 4. Mux process video → trigger webhook video.upload.asset_created
 * 5. Webhook update Lesson với muxAssetId, muxPlaybackId
 * 6. Mux transcode xong → webhook video.asset.ready → set status READY + duration
 *
 * Lưu uploadId vào Lesson ngay tại bước 2 để map ngược lại trong webhook
 */
export async function POST(request: Request) {
  try {
    if (!isMuxConfigured) {
      return NextResponse.json(
        {
          message:
            'Mux chưa được config. Set MUX_TOKEN_ID và MUX_TOKEN_SECRET trong .env',
        },
        { status: 503 }
      );
    }

    const user = await requireApiInstructor();
    const body = await request.json();
    const { lessonId } = createUploadSchema.parse(body);

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
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

    // Nếu đã có asset cũ → xóa trên Mux trước (giải phóng storage cost)
    if (lesson.muxAssetId) {
      try {
        await deleteAsset(lesson.muxAssetId);
      } catch (err) {
        console.error('Failed to delete old asset:', err);
        // Tiếp tục, không fail request
      }
    }

    const origin = request.headers.get('origin') ?? '*';
    const { uploadId, uploadUrl } = await createDirectUpload({
      corsOrigin: origin,
      passthrough: lessonId, // Để webhook biết upload thuộc lesson nào
    });

    // Reset asset cũ + lưu uploadId mới
    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        muxUploadId: uploadId,
        muxAssetId: null,
        muxPlaybackId: null,
        muxStatus: 'UPLOADING',
        videoUrl: null,
        duration: 0,
      },
    });

    return NextResponse.json({ uploadId, uploadUrl });
  } catch (err: any) {
    const authRes = authErrorResponse(err);
    if (authRes) return authRes;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.errors[0].message }, { status: 400 });
    }
    console.error('Create upload error:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
