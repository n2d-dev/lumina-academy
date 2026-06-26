/**
 * Email layout & styling helpers.
 *
 * Email HTML cần inline CSS + table-based layout để render đúng trên mọi client
 * (Gmail, Outlook, Apple Mail, Yahoo). KHÔNG dùng flexbox/grid/CSS classes.
 *
 * Color palette + typography match theme web (font-display ≈ system-ui, accent đen).
 */

const BRAND = {
  primary: '#000000',
  primaryHover: '#1a1a1a',
  textDark: '#0a0a0a',
  textMuted: '#525252',
  textLight: '#737373',
  border: '#e5e5e5',
  bgLight: '#fafafa',
  success: '#16a34a',
  successBg: '#f0fdf4',
  danger: '#dc2626',
  warning: '#ea580c',
};

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const APP_URL = process.env.NEXTAUTH_URL ?? 'https://lumina.academy';

interface LayoutOptions {
  title: string;
  preheader?: string; // Text preview hiển thị trong inbox (Gmail/Outlook)
  body: string;
  footer?: string;
}

/**
 * Wrap email content trong layout chuẩn:
 *   - Header: logo Lumina
 *   - Body: main content
 *   - Footer: copyright + unsubscribe + reply-to
 */
export function emailLayout({ title, preheader, body, footer }: LayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
  /* Email client reset */
  body { margin: 0; padding: 0; font-family: ${FONT_STACK}; }
  table { border-collapse: collapse; }
  img { border: 0; display: block; }
  a { color: ${BRAND.primary}; }
  /* Mobile responsive */
  @media only screen and (max-width: 600px) {
    .container { width: 100% !important; }
    .px-mobile { padding-left: 24px !important; padding-right: 24px !important; }
  }
</style>
</head>
<body style="background-color: ${BRAND.bgLight}; margin: 0; padding: 0; font-family: ${FONT_STACK}; color: ${BRAND.textDark};">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ''}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${BRAND.bgLight};">
  <tr>
    <td align="center" style="padding: 40px 16px;">

      <!-- Container -->
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; max-width: 600px;">

        <!-- Header -->
        <tr>
          <td class="px-mobile" style="padding: 32px 40px; border-bottom: 1px solid ${BRAND.border};">
            <a href="${APP_URL}" style="text-decoration: none; color: ${BRAND.textDark};">
              <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">Lumina</span>
              <span style="font-size: 24px; font-weight: 400; color: ${BRAND.textMuted}; letter-spacing: -0.5px;"> Academy</span>
            </a>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td class="px-mobile" style="padding: 40px;">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="px-mobile" style="padding: 24px 40px; background-color: ${BRAND.bgLight}; border-top: 1px solid ${BRAND.border};">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: ${BRAND.textLight}; line-height: 1.6;">
              ${footer ?? `Cần hỗ trợ? Trả lời email này hoặc liên hệ <a href="mailto:support@lumina.academy" style="color: ${BRAND.primary};">support@lumina.academy</a>`}
            </p>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: ${BRAND.textLight};">
              © ${new Date().getFullYear()} Lumina Academy. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
}

/** Render button kiểu primary (đen) */
export function emailButton(href: string, label: string, variant: 'primary' | 'outline' = 'primary'): string {
  const isPrimary = variant === 'primary';
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 16px 0;">
    <tr>
      <td style="border-radius: 12px; background-color: ${isPrimary ? BRAND.primary : '#ffffff'};">
        <a href="${href}" target="_blank" style="
          display: inline-block;
          padding: 14px 32px;
          font-size: 15px;
          font-weight: 700;
          color: ${isPrimary ? '#ffffff' : BRAND.primary};
          text-decoration: none;
          border-radius: 12px;
          border: 2px solid ${BRAND.primary};
        ">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

/** Heading H1 */
export function h1(text: string): string {
  return `<h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 900; line-height: 1.3; letter-spacing: -0.5px; color: ${BRAND.textDark};">${escapeHtml(text)}</h1>`;
}

/** Paragraph */
export function p(text: string, opts?: { muted?: boolean; size?: 'sm' | 'base' }): string {
  const color = opts?.muted ? BRAND.textMuted : BRAND.textDark;
  const size = opts?.size === 'sm' ? '14px' : '16px';
  return `<p style="margin: 0 0 16px 0; font-size: ${size}; line-height: 1.6; color: ${color};">${text}</p>`;
}

/** Divider line */
export function divider(): string {
  return `<div style="height: 1px; background-color: ${BRAND.border}; margin: 24px 0;"></div>`;
}

/** Info box (đen nhạt) */
export function infoBox(html: string): string {
  return `<div style="background-color: ${BRAND.bgLight}; border: 1px solid ${BRAND.border}; border-radius: 12px; padding: 20px; margin: 16px 0;">${html}</div>`;
}

/** Success box (xanh) */
export function successBox(html: string): string {
  return `<div style="background-color: ${BRAND.successBg}; border: 1px solid ${BRAND.success}; border-radius: 12px; padding: 20px; margin: 16px 0;">${html}</div>`;
}

/** Format VND price */
export function formatVnd(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ';
}

/**
 * Escape HTML để chống XSS khi nhúng user-input vào email
 * (vd. tên user, course title từ user-generated content).
 */
export function escapeHtml(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Strip HTML tags để tạo plain text version */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export { APP_URL, BRAND };
