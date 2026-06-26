import {
  APP_URL,
  divider,
  emailButton,
  emailLayout,
  escapeHtml,
  h1,
  htmlToText,
  p,
} from './shared/layout';

export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
}

export function renderWelcomeEmail(data: WelcomeEmailData): { html: string; text: string } {
  const name = data.userName || 'bạn';

  const body = `
    ${h1(`Chào mừng đến với Lumina Academy, ${name}!`)}
    ${p(`Cảm ơn bạn đã tham gia cộng đồng học tập của chúng tôi. Tài khoản của bạn đã được tạo thành công với email <strong>${escapeHtml(data.userEmail)}</strong>.`)}

    ${p('Bắt đầu hành trình học tập của bạn với:')}

    <ul style="margin: 16px 0; padding-left: 20px; color: #525252; font-size: 16px; line-height: 1.8;">
      <li>📚 Hơn 1,000 khóa học chất lượng cao về lập trình, thiết kế, kinh doanh</li>
      <li>🎓 Giảng viên là chuyên gia từ Google, Meta, Amazon</li>
      <li>📱 Học mọi lúc mọi nơi trên web và mobile</li>
      <li>🏆 Chứng chỉ hoàn thành sau mỗi khóa học</li>
    </ul>

    ${emailButton(`${APP_URL}/courses`, 'Khám phá khóa học')}

    ${divider()}

    ${p('💡 <strong>Mẹo:</strong> Hãy thêm địa chỉ email này vào danh bạ để không bỏ lỡ thông báo quan trọng từ chúng tôi.', { size: 'sm', muted: true })}
  `;

  const html = emailLayout({
    title: 'Chào mừng đến với Lumina Academy',
    preheader: `Chào ${name}, tài khoản của bạn đã sẵn sàng. Bắt đầu học ngay!`,
    body,
  });

  return { html, text: htmlToText(html) };
}
