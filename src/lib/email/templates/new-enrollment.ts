import {
  APP_URL,
  divider,
  emailButton,
  emailLayout,
  escapeHtml,
  h1,
  htmlToText,
  infoBox,
  p,
} from './shared/layout';

export interface NewEnrollmentEmailData {
  instructorName: string;
  studentName: string;
  studentEmail: string;
  courses: { id: string; title: string }[];
  /** Tổng số học viên hiện tại của course (để show số liệu motivational) */
  totalStudents?: number;
}

export function renderNewEnrollmentEmail(data: NewEnrollmentEmailData): {
  html: string;
  text: string;
  subject: string;
} {
  const instructorName = data.instructorName || 'bạn';
  const studentName = data.studentName || 'học viên mới';
  const courseCount = data.courses.length;

  const courseList = data.courses
    .map(
      (c) =>
        `<li style="margin-bottom: 8px; font-size: 15px; color: #0a0a0a;"><strong>${escapeHtml(c.title)}</strong></li>`
    )
    .join('');

  const body = `
    ${h1(`🎉 Bạn vừa có học viên mới!`)}
    ${p(`Xin chào ${instructorName},`)}
    ${p(`Một học viên vừa đăng ký khóa học của bạn:`)}

    ${infoBox(`
      <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #0a0a0a;">
        ${studentName}
      </p>
      <p style="margin: 0; font-size: 13px; color: #525252;">
        ${escapeHtml(data.studentEmail)}
      </p>
    `)}

    <p style="margin: 16px 0 8px 0; font-size: 14px; font-weight: 700; color: #0a0a0a;">
      Đã đăng ký ${courseCount === 1 ? 'khóa học' : `${courseCount} khóa học`}:
    </p>
    <ul style="margin: 0 0 16px 0; padding-left: 20px;">
      ${courseList}
    </ul>

    ${
      data.totalStudents
        ? p(`Bạn hiện có tổng cộng <strong>${data.totalStudents.toLocaleString('vi-VN')}</strong> học viên đang theo học. Tiếp tục duy trì chất lượng nội dung tuyệt vời nhé! 💪`)
        : ''
    }

    ${emailButton(`${APP_URL}/teach/dashboard`, 'Xem dashboard')}

    ${divider()}

    ${p(`💡 <strong>Mẹo:</strong> Trả lời câu hỏi của học viên trong vòng 24h giúp tăng tỷ lệ hoàn thành khóa học và đánh giá tích cực.`, { size: 'sm', muted: true })}
    ${p(`Bạn có thể tắt loại email này trong phần <a href="${APP_URL}/teach/settings" style="color: #000;">Cài đặt giảng viên</a>.`, { size: 'sm', muted: true })}
  `;

  const html = emailLayout({
    title: `Học viên mới - ${studentName}`,
    preheader: `${studentName} vừa đăng ký ${courseCount === 1 ? 'khóa học' : `${courseCount} khóa học`} của bạn`,
    body,
  });

  const subject = `🎉 ${studentName} vừa đăng ký khóa học của bạn`;

  return { html, text: htmlToText(html), subject };
}
