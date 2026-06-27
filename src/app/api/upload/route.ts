import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiInstructor , authErrorResponse } from '@/lib/auth-helpers';

const uploadRequestSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string(),
  type: z.enum(['video', 'image', 'document']),
});

/**
 * POST /api/upload
 * Tạo presigned URL để client upload trực tiếp lên S3/R2
 *
 * Pattern này tốt hơn upload qua server vì:
 * - Không tốn bandwidth của Vercel/Next.js
 * - Không bị limit 4.5MB của serverless functions
 * - Scale tốt hơn
 *
 * Production setup:
 *   1. Tạo S3 bucket (hoặc Cloudflare R2 - rẻ hơn)
 *   2. Cấu hình CORS cho bucket
 *   3. Set env: S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET, S3_REGION
 *   4. Install: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 *
 * Cho video lớn → dùng Mux Direct Upload thay vì S3 (xem module Video Streaming)
 */
export async function POST(request: Request) {
  try {
    const user = await requireApiInstructor();
    const body = await request.json();
    const data = uploadRequestSchema.parse(body);

    // Validate file type
    const validTypes: Record<string, string[]> = {
      video: ['video/mp4', 'video/webm', 'video/quicktime'],
      image: ['image/jpeg', 'image/png', 'image/webp'],
      document: ['application/pdf'],
    };

    if (!validTypes[data.type].includes(data.contentType)) {
      return NextResponse.json(
        { message: `Loại file không được hỗ trợ cho ${data.type}` },
        { status: 400 }
      );
    }

    // Tạo unique key
    const timestamp = Date.now();
    const safeName = data.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${data.type}s/${user.id}/${timestamp}-${safeName}`;

    // Production: tạo presigned URL với S3
    // const command = new PutObjectCommand({ Bucket: ..., Key: key, ContentType: data.contentType });
    // const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Mock cho dev - return fake URL để demo flow
    const uploadUrl = `https://your-s3-bucket.s3.amazonaws.com/${key}?signed=mock`;
    const fileUrl = `https://your-cdn.com/${key}`;

    return NextResponse.json({
      uploadUrl,    // URL để PUT file trực tiếp từ client
      fileUrl,      // URL final để lưu vào DB sau khi upload xong
      key,
    });
  } catch (err: any) {
    const authRes = authErrorResponse(err);
    if (authRes) return authRes;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
