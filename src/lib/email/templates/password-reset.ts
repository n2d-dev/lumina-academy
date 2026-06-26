import {
  divider,
  emailButton,
  emailLayout,
  escapeHtml,
  h1,
  htmlToText,
  infoBox,
  p,
} from './shared/layout';

export interface PasswordResetEmailData {
  userName: string;
  resetUrl: string;
  /** Số phút token còn hiệu lực */
  expiresInMinutes: number;
  /** IP của request — để user verify đúng request của họ */
  requestIp?: string;
}

export function renderPasswordResetEmail(data: PasswordResetEmailData): {
  html: string;
  text: string;
} {
  const name = escapeHtml(data.userName) || 'bạn';

  const body = `
    ${h1('Đặt lại mật khẩu')}
    ${p(`Xin chào ${name},`)}
    ${p(`Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Click vào nút bên dưới để tạo mật khẩu mới:`)}

    ${emailButton(data.resetUrl, 'Đặt lại mật khẩu')}

    ${p(`Hoặc copy link này vào trình duyệt:`, { size: 'sm', muted: true })}
    <p style="margin: 0 0 16px 0; padding: 12px; background-color: #fafafa; border-radius: 8px; font-family: monospace; font-size: 12px; word-break: break-all; color: #525252;">${escapeHtml(data.resetUrl)}</p>

    ${infoBox(`
      <p style="margin: 0; font-size: 14px; color: #ea580c; font-weight: 700;">
        ⏱ Link này hết hạn sau ${data.expiresInMinutes} phút
      </p>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #525252;">
        Vì lý do bảo mật, link đặt lại mật khẩu chỉ có hiệu lực trong thời gian ngắn.
      </p>
    `)}

    ${divider()}

    <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #0a0a0a;">Bạn không yêu cầu việc này?</h3>
    ${p(`Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể bỏ qua email này một cách an toàn — tài khoản của bạn vẫn an toàn và mật khẩu hiện tại không thay đổi.`, { size: 'sm', muted: true })}
    ${
      data.requestIp
        ? p(`Yêu cầu đến từ địa chỉ IP: <code style="background:#fafafa;padding:2px 6px;border-radius:4px;">${escapeHtml(data.requestIp)}</code>`, { size: 'sm', muted: true })
        : ''
    }
    ${p(`Nếu bạn nghi ngờ có người đang cố gắng truy cập tài khoản, vui lòng liên hệ ngay <a href="mailto:support@lumina.academy" style="color: #000;">support@lumina.academy</a>.`, { size: 'sm', muted: true })}
  `;

  const html = emailLayout({
    title: 'Đặt lại mật khẩu - Lumina Academy',
    preheader: `Yêu cầu đặt lại mật khẩu, hết hạn sau ${data.expiresInMinutes} phút`,
    body,
  });

  return { html, text: htmlToText(html) };
}
