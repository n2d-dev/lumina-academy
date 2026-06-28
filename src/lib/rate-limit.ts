/**
 * Rate limiting cho API routes.
 *
 * Thuật toán fixed-window đơn giản, lưu trong bộ nhớ tiến trình (in-memory).
 *
 * ⚠️ GIỚI HẠN: in-memory chỉ đúng trên MỘT instance. Khi deploy nhiều
 * instance / serverless (Vercel) thì mỗi instance đếm riêng → giới hạn
 * thực tế lỏng hơn. Để chính xác tuyệt đối cần store dùng chung (Upstash
 * Redis / @upstash/ratelimit). Xem PRODUCTION.md, mục "Rate limiting".
 * Dù vậy, in-memory vẫn chặn hiệu quả brute-force/spam từ một nguồn.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

// Dọn rác định kỳ để Map không phình vô hạn (chỉ chạy ở môi trường Node).
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | undefined;

function ensureCleanup() {
  if (cleanupTimer || typeof setInterval === 'undefined') return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of store) {
      if (bucket.resetAt <= now) store.delete(key);
    }
  }, CLEANUP_INTERVAL);
  // Không giữ tiến trình sống chỉ vì timer này.
  cleanupTimer.unref?.();
}

export interface RateLimitResult {
  /** true nếu request được phép đi tiếp. */
  success: boolean;
  /** Số request tối đa trong cửa sổ. */
  limit: number;
  /** Số request còn lại. */
  remaining: number;
  /** Thời điểm (epoch ms) cửa sổ reset. */
  resetAt: number;
}

export interface RateLimitOptions {
  /** Số request tối đa cho phép trong cửa sổ. */
  limit: number;
  /** Độ dài cửa sổ tính bằng mili-giây. */
  windowMs: number;
}

/**
 * Kiểm tra & tăng bộ đếm cho một định danh (thường là "tên-route:IP").
 */
export function rateLimit(identifier: string, options: RateLimitOptions): RateLimitResult {
  ensureCleanup();
  const now = Date.now();
  const bucket = store.get(identifier);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + options.windowMs;
    store.set(identifier, { count: 1, resetAt });
    return { success: true, limit: options.limit, remaining: options.limit - 1, resetAt };
  }

  bucket.count += 1;
  const remaining = Math.max(0, options.limit - bucket.count);
  return {
    success: bucket.count <= options.limit,
    limit: options.limit,
    remaining,
    resetAt: bucket.resetAt,
  };
}

/**
 * Lấy IP client từ các header proxy phổ biến (x-forwarded-for, x-real-ip).
 * Trả 'unknown' nếu không xác định được — vẫn rate-limit chung nhóm 'unknown'.
 */
export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * Helper gộp: tính kết quả rate-limit cho một request theo route.
 * Nếu vượt giới hạn, trả kèm Response 429 sẵn sàng dùng.
 *
 * @example
 *   const limited = checkRateLimit(request, 'register', { limit: 5, windowMs: 60_000 });
 *   if (limited.response) return limited.response;
 */
export function checkRateLimit(
  request: Request,
  routeName: string,
  options: RateLimitOptions
): { result: RateLimitResult; response: Response | null } {
  const ip = getClientIp(request);
  const result = rateLimit(`${routeName}:${ip}`, options);

  if (result.success) return { result, response: null };

  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
  const response = new Response(
    JSON.stringify({ message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
      },
    }
  );
  return { result, response };
}
