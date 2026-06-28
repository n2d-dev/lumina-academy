/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development';

/**
 * Content-Security-Policy
 *
 * Khai báo tường minh các origin mà app được phép tải tài nguyên.
 * Đây là lớp phòng thủ chính chống XSS / injection.
 *
 * Nếu thêm dịch vụ bên thứ ba mới (analytics, chat widget, ...) thì phải
 * bổ sung origin tương ứng vào đây, nếu không trình duyệt sẽ chặn.
 */
const csp = [
  `default-src 'self'`,
  // Next.js cần 'unsafe-inline' cho inline script (theme init) và runtime chunks.
  // 'unsafe-eval' chỉ bật ở dev (React Refresh); production tắt để an toàn hơn.
  `script-src 'self' 'unsafe-inline' https://plausible.io ${isDev ? "'unsafe-eval'" : ''}`,
  // Tailwind/Next inline styles + Google Fonts stylesheet.
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com`,
  // Ảnh: assets local, data/blob URIs, các CDN ảnh đã cấu hình, thumbnail Mux.
  `img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://image.mux.com`,
  // Video HLS từ Mux.
  `media-src 'self' blob: https://stream.mux.com`,
  // Mux streaming + analytics (litix), Mux upload, gọi API nội bộ.
  `connect-src 'self' https://stream.mux.com https://*.litix.io https://*.mux.com https://plausible.io`,
  // Stripe checkout (nếu nhúng iframe), Mux player iframe.
  `frame-src 'self' https://js.stripe.com https://*.mux.com`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
]
  .filter(Boolean)
  .join('; ');

const securityHeaders = [
  // Ép HTTPS trong 2 năm, áp dụng cho cả subdomain.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Chống clickjacking (đồng bộ với frame-ancestors 'none').
  { key: 'X-Frame-Options', value: 'DENY' },
  // Chặn MIME sniffing.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Không rò referrer đầy đủ sang origin khác.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Khóa các API nhạy cảm của trình duyệt.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Content-Security-Policy', value: csp },
];

const nextConfig = {
  reactStrictMode: true,
  // Ẩn header X-Powered-By: Next.js (giảm lộ thông tin stack).
  poweredByHeader: false,
  // Nén gzip/brotli ở tầng app.
  compress: true,
  images: {
    // Định dạng hiện đại, nhẹ hơn JPEG/PNG đáng kể.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'image.mux.com' },
    ],
  },
  async headers() {
    return [
      {
        // Áp dụng security headers cho mọi route.
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
