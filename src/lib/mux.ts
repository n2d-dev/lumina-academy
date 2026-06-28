import Mux from '@mux/mux-node';
import jwt from 'jsonwebtoken';

/**
 * Mux Video integration
 *
 * SETUP STEPS:
 * 1. Đăng ký https://dashboard.mux.com (free tier: 1000 phút/tháng)
 * 2. Tạo Access Token tại Settings → Access Tokens (write access)
 * 3. Tạo Signing Key tại Settings → Signing Keys (cho signed URLs)
 *    Lưu Private Key (base64-encoded PEM)
 * 4. Setup Webhook tại Settings → Webhooks
 *    URL: https://your-domain.com/api/webhooks/mux
 *    Events: video.asset.ready, video.asset.errored, video.upload.cancelled
 *
 * 5. Set env vars:
 *    MUX_TOKEN_ID=...
 *    MUX_TOKEN_SECRET=...
 *    MUX_SIGNING_KEY_ID=...
 *    MUX_SIGNING_KEY_PRIVATE=... (base64 encoded)
 *    MUX_WEBHOOK_SECRET=...
 *
 * KEY CONCEPTS:
 * - Direct Upload: server tạo URL → client upload trực tiếp lên Mux (không qua server)
 * - Asset: video sau khi Mux xử lý xong (transcode multi-bitrate)
 * - Playback ID:
 *   - public: ai cũng xem được, cho video preview
 *   - signed: cần JWT token để xem, cho enrolled students
 */

/**
 * Mux SDK client
 * Lazy init để cho phép app chạy trong dev mode không cần Mux credentials
 */
let _mux: Mux | null = null;

export function getMuxClient(): Mux {
  if (_mux) return _mux;
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    throw new Error(
      'Mux chưa được config. Set MUX_TOKEN_ID và MUX_TOKEN_SECRET trong .env'
    );
  }
  _mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
  });
  return _mux;
}

export const isMuxConfigured = !!(
  process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET
);

/**
 * Tạo Direct Upload URL
 * Client sẽ POST file trực tiếp lên URL này, không cần qua server của ta.
 * Trả về uploadId để track + URL để upload.
 *
 * Khi upload xong, Mux sẽ trigger webhook video.upload.asset_created
 * và sau đó video.asset.ready khi đã transcode xong.
 */
export async function createDirectUpload({
  corsOrigin,
  passthrough,
}: {
  corsOrigin: string;
  passthrough?: string; // Metadata để identify lesson trong webhook
}) {
  const mux = getMuxClient();

  const upload = await mux.video.uploads.create({
    cors_origin: corsOrigin,
    new_asset_settings: {
      playback_policy: ['signed'], // Signed = cần JWT để xem
      max_resolution_tier: '1080p',
      passthrough, // Lưu lessonId để map ngược lại trong webhook
      // Mux sẽ tự generate static renditions cho download nếu cần
      // mp4_support: 'standard',
    },
  });

  return {
    uploadId: upload.id,
    uploadUrl: upload.url,
  };
}

/**
 * Lấy thông tin asset từ Mux
 * Dùng khi cần check status manually (ngoài webhook)
 */
export async function getAsset(assetId: string) {
  const mux = getMuxClient();
  return mux.video.assets.retrieve(assetId);
}

/**
 * Xóa asset trên Mux (giải phóng storage)
 */
export async function deleteAsset(assetId: string) {
  const mux = getMuxClient();
  await mux.video.assets.delete(assetId);
}

/**
 * Tạo signed JWT cho playback
 *
 * Signed playback URL format:
 *   https://stream.mux.com/{playbackId}.m3u8?token={jwt}
 *
 * JWT này có:
 * - aud: 'v' (video) hoặc 't' (thumbnail)
 * - sub: playbackId
 * - exp: thời gian hết hạn (recommend 6h-24h)
 * - kid: signing key ID
 *
 * @param playbackId Mux playback ID
 * @param expirySeconds Thời gian token có hiệu lực (default 6h)
 */
export function generatePlaybackToken(
  playbackId: string,
  expirySeconds: number = 6 * 60 * 60
): string {
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const keyPrivate = process.env.MUX_SIGNING_KEY_PRIVATE;

  if (!keyId || !keyPrivate) {
    throw new Error('Mux signing key chưa được config');
  }

  // Mux yêu cầu private key dạng PEM
  // Khi save trong env, ta encode base64 để tránh issue với newlines
  const privateKey = Buffer.from(keyPrivate, 'base64').toString('utf-8');

  return jwt.sign(
    {
      sub: playbackId,
      aud: 'v', // 'v' = video, 't' = thumbnail
      exp: Math.floor(Date.now() / 1000) + expirySeconds,
      kid: keyId,
    },
    privateKey,
    { algorithm: 'RS256' }
  );
}

/**
 * Tạo signed thumbnail URL
 * Dùng để hiển thị thumbnail trong course card / lesson list
 */
export function generateThumbnailToken(
  playbackId: string,
  expirySeconds: number = 24 * 60 * 60
): string {
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const keyPrivate = process.env.MUX_SIGNING_KEY_PRIVATE;

  if (!keyId || !keyPrivate) {
    throw new Error('Mux signing key chưa được config');
  }

  const privateKey = Buffer.from(keyPrivate, 'base64').toString('utf-8');

  return jwt.sign(
    {
      sub: playbackId,
      aud: 't', // thumbnail audience
      exp: Math.floor(Date.now() / 1000) + expirySeconds,
      kid: keyId,
    },
    privateKey,
    { algorithm: 'RS256' }
  );
}

/**
 * Build full thumbnail URL với token
 */
export function getThumbnailUrl(
  playbackId: string,
  token: string,
  options?: { time?: number; width?: number; height?: number }
): string {
  const params = new URLSearchParams({ token });
  if (options?.time !== undefined) params.set('time', String(options.time));
  if (options?.width) params.set('width', String(options.width));
  if (options?.height) params.set('height', String(options.height));
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?${params}`;
}

/**
 * Verify webhook signature từ Mux
 * Bảo vệ webhook endpoint khỏi fake requests
 *
 * Mux sử dụng HMAC-SHA256 với secret riêng cho mỗi webhook
 * Header: 'mux-signature' format: 't=timestamp,v1=signature'
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string
): boolean {
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (!secret) {
    // Trong dev không có secret, skip verify (CHỈ DEV!)
    if (process.env.NODE_ENV !== 'production') return true;
    return false;
  }

  try {
    // Parse signature header
    const parts = signatureHeader.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    if (!parts.t || !parts.v1) return false;

    // Build payload to verify: timestamp + '.' + body
    const payload = `${parts.t}.${rawBody}`;

    // HMAC-SHA256
    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(parts.v1, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}
