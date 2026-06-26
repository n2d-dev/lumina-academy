import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/mux';

/**
 * POST /api/webhooks/mux
 *
 * Mux gửi webhook khi video lifecycle thay đổi:
 * - video.upload.asset_created: Upload xong, asset đã được tạo (chưa ready)
 * - video.asset.ready: Transcoding hoàn tất → playable
 * - video.asset.errored: Lỗi xử lý
 * - video.upload.cancelled: Upload bị hủy
 *
 * Setup local dev:
 *   ngrok http 3000
 *   Mux Dashboard → Webhooks → URL: https://abc.ngrok.io/api/webhooks/mux
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = headers().get('mux-signature');

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    console.error('Mux webhook: invalid signature');
    return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  console.log(`📹 Mux webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'video.upload.asset_created':
        await handleAssetCreated(event.data);
        break;
      case 'video.asset.ready':
        await handleAssetReady(event.data);
        break;
      case 'video.asset.errored':
        await handleAssetErrored(event.data);
        break;
      case 'video.upload.cancelled':
        await handleUploadCancelled(event.data);
        break;
      default:
        console.log(`Unhandled Mux event: ${event.type}`);
    }
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Mux webhook handler error:', err);
    // Return 200 để Mux không retry (tránh infinite loop nếu có bug)
    return NextResponse.json({ received: true, error: err.message });
  }
}

/**
 * Asset created: upload xong, đang transcode
 */
async function handleAssetCreated(data: any) {
  const lessonId = data.passthrough;
  if (!lessonId) {
    console.error('asset_created: missing passthrough');
    return;
  }

  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      muxAssetId: data.asset_id ?? data.id,
      muxStatus: 'PROCESSING',
    },
  });

  console.log(`✅ Asset created for lesson ${lessonId}`);
}

/**
 * Asset ready: transcoding xong, sẵn sàng phát
 */
async function handleAssetReady(data: any) {
  const lessonId = data.passthrough;
  if (!lessonId) {
    console.error('asset.ready: missing passthrough');
    return;
  }

  // Lấy signed playback ID
  const playbackId = data.playback_ids?.find((p: any) => p.policy === 'signed')?.id;

  if (!playbackId) {
    console.error('asset.ready: no signed playback ID found');
    return;
  }

  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      muxAssetId: data.id,
      muxPlaybackId: playbackId,
      muxStatus: 'READY',
      muxAspectRatio: data.aspect_ratio ?? null,
      muxMaxResolution: data.max_stored_resolution ?? null,
      duration: Math.round(data.duration ?? 0),
    },
  });

  // Aggregate update: tổng duration của course
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { section: { select: { courseId: true } } },
  });

  if (lesson) {
    const totalDuration = await prisma.lesson.aggregate({
      where: { section: { courseId: lesson.section.courseId } },
      _sum: { duration: true },
    });
    await prisma.course.update({
      where: { id: lesson.section.courseId },
      data: { totalDuration: totalDuration._sum.duration ?? 0 },
    });
  }

  console.log(`✅ Video ready for lesson ${lessonId}, playback: ${playbackId}`);
}

async function handleAssetErrored(data: any) {
  const lessonId = data.passthrough;
  if (!lessonId) return;

  await prisma.lesson.update({
    where: { id: lessonId },
    data: { muxStatus: 'ERRORED' },
  });

  console.error(`❌ Asset errored for lesson ${lessonId}:`, data.errors);
}

async function handleUploadCancelled(data: any) {
  const lesson = await prisma.lesson.findUnique({
    where: { muxUploadId: data.id },
  });

  if (!lesson) return;

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      muxStatus: 'CANCELLED',
      muxUploadId: null,
    },
  });

  console.log(`⚠️  Upload cancelled for lesson ${lesson.id}`);
}
