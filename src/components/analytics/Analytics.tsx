import Script from 'next/script';

/**
 * Web analytics — privacy-friendly, không cookie (Plausible-compatible).
 *
 * Chỉ render khi có biến môi trường:
 *   NEXT_PUBLIC_ANALYTICS_DOMAIN  — domain đã đăng ký (vd: lumina-academy.vn)
 *   NEXT_PUBLIC_ANALYTICS_SRC     — (tùy chọn) URL script; mặc định Plausible cloud
 *
 * Để trống cả hai ở dev → component không render gì, không ảnh hưởng.
 * Tương thích Plausible self-hosted, hoặc đổi sang Umami/PostHog tùy nhu cầu.
 * Xem PRODUCTION.md, mục "Analytics".
 */
export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;
  if (!domain) return null;

  const src = process.env.NEXT_PUBLIC_ANALYTICS_SRC ?? 'https://plausible.io/js/script.js';

  return (
    <Script
      defer
      data-domain={domain}
      src={src}
      strategy="afterInteractive"
    />
  );
}
