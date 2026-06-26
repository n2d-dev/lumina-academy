import {
  APP_URL,
  divider,
  emailButton,
  emailLayout,
  escapeHtml,
  formatVnd,
  h1,
  htmlToText,
  infoBox,
  p,
  successBox,
} from './shared/layout';

export interface OrderConfirmationData {
  userName: string;
  orderId: string;
  paymentId: string;
  provider: 'stripe' | 'momo' | 'vnpay';
  amount: number;
  paidAt: Date;
  courses: { title: string; price: number }[];
}

const PROVIDER_LABEL: Record<string, string> = {
  stripe: 'Thẻ tín dụng (Stripe)',
  momo: 'Ví MoMo',
  vnpay: 'VNPay',
};

export function renderOrderConfirmation(data: OrderConfirmationData): {
  html: string;
  text: string;
  subject: string;
} {
  const name = escapeHtml(data.userName) || 'bạn';
  const courseCount = data.courses.length;
  const courseLabel = courseCount === 1 ? 'khóa học' : `${courseCount} khóa học`;

  const courseRows = data.courses
    .map(
      (c) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; vertical-align: top;">
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0a0a0a;">${escapeHtml(c.title)}</p>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right; vertical-align: top; white-space: nowrap;">
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0a0a0a;">${formatVnd(c.price)}</p>
          </td>
        </tr>`
    )
    .join('');

  const formattedDate = data.paidAt.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const body = `
    ${h1(`Cảm ơn ${name} đã mua hàng! 🎉`)}
    ${p(`Đơn hàng của bạn đã được thanh toán thành công. Bạn có thể bắt đầu học ${courseLabel} ngay bây giờ.`)}

    ${successBox(`
      <p style="margin: 0; font-size: 14px; color: #16a34a; font-weight: 700;">
        ✓ Thanh toán thành công
      </p>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #525252;">
        Quyền truy cập khóa học đã được kích hoạt vĩnh viễn cho tài khoản của bạn.
      </p>
    `)}

    ${emailButton(`${APP_URL}/my-learning`, 'Bắt đầu học')}

    ${divider()}

    <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #0a0a0a;">Chi tiết đơn hàng</h2>

    ${infoBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; color: #525252;">
        <tr>
          <td style="padding: 4px 0;">Mã đơn hàng:</td>
          <td style="padding: 4px 0; text-align: right; font-family: monospace; color: #0a0a0a;">${escapeHtml(data.orderId)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0;">Phương thức:</td>
          <td style="padding: 4px 0; text-align: right; color: #0a0a0a;">${PROVIDER_LABEL[data.provider] ?? data.provider}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0;">Thời gian:</td>
          <td style="padding: 4px 0; text-align: right; color: #0a0a0a;">${escapeHtml(formattedDate)}</td>
        </tr>
      </table>
    `)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
      <thead>
        <tr>
          <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #0a0a0a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #525252;">Khóa học</th>
          <th style="text-align: right; padding: 8px 0; border-bottom: 2px solid #0a0a0a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #525252;">Giá</th>
        </tr>
      </thead>
      <tbody>
        ${courseRows}
      </tbody>
      <tfoot>
        <tr>
          <td style="padding: 16px 0 0 0; font-size: 16px; font-weight: 900;">Tổng cộng</td>
          <td style="padding: 16px 0 0 0; font-size: 20px; font-weight: 900; text-align: right;">${formatVnd(data.amount)}</td>
        </tr>
      </tfoot>
    </table>

    ${divider()}

    ${p('📄 Email này đồng thời là biên lai/hóa đơn của bạn. Vui lòng lưu lại để tham khảo sau này.', { size: 'sm', muted: true })}
    ${p(`Có thắc mắc về đơn hàng? Trả lời email này hoặc liên hệ <a href="mailto:support@lumina.academy" style="color: #000000;">support@lumina.academy</a> kèm mã đơn hàng <strong>${escapeHtml(data.orderId)}</strong>.`, { size: 'sm', muted: true })}
  `;

  const html = emailLayout({
    title: `Đơn hàng ${data.orderId} - Lumina Academy`,
    preheader: `Thanh toán ${formatVnd(data.amount)} thành công cho ${courseLabel}`,
    body,
  });

  const subject = `✓ Đã thanh toán ${formatVnd(data.amount)} - ${courseCount === 1 ? data.courses[0].title : `${courseCount} khóa học`}`;

  return { html, text: htmlToText(html), subject };
}
