import {
  APP_URL,
  divider,
  emailButton,
  emailLayout,
  escapeHtml,
  h1,
  htmlToText,
  p,
  successBox,
} from './shared/layout';

export interface CourseCompletionEmailData {
  userName: string;
  courseTitle: string;
  courseId: string;
  instructorName: string;
  /** ID của certificate để generate download link */
  certificateId: string;
  /** Tổng số phút đã học (để show stat) */
  totalMinutesLearned?: number;
}

export function renderCourseCompletionEmail(data: CourseCompletionEmailData): {
  html: string;
  text: string;
  subject: string;
} {
  const name = data.userName || 'bạn';
  const courseTitleEscaped = escapeHtml(data.courseTitle);

  const hours = data.totalMinutesLearned
    ? Math.floor(data.totalMinutesLearned / 60)
    : null;

  const body = `
    ${h1(`🏆 Chúc mừng ${name}!`)}
    ${p(`Bạn đã hoàn thành khóa học <strong>${courseTitleEscaped}</strong>.`)}
    ${p(`Đây là một thành tựu đáng tự hào. Hãy chia sẻ chứng chỉ này trên LinkedIn để showcase kỹ năng mới với nhà tuyển dụng và đồng nghiệp.`)}

    ${successBox(`
      <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #16a34a; font-weight: 700;">
        Chứng chỉ hoàn thành
      </p>
      <p style="margin: 0 0 12px 0; font-size: 18px; font-weight: 900; color: #0a0a0a;">
        ${courseTitleEscaped}
      </p>
      <p style="margin: 0; font-size: 13px; color: #525252;">
        Giảng viên: <strong>${escapeHtml(data.instructorName)}</strong>
      </p>
      ${
        hours
          ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #525252;">Tổng thời gian học: <strong>${hours} giờ</strong></p>`
          : ''
      }
      <p style="margin: 12px 0 0 0; font-size: 11px; font-family: monospace; color: #737373;">
        ID: ${escapeHtml(data.certificateId)}
      </p>
    `)}

    ${emailButton(`${APP_URL}/certificates/${data.certificateId}`, 'Tải chứng chỉ PDF')}
    ${emailButton(`${APP_URL}/certificates/${data.certificateId}/share`, 'Chia sẻ trên LinkedIn', 'outline')}

    ${divider()}

    <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #0a0a0a;">Tiếp theo bạn nên làm gì?</h3>
    ${p(`📚 Khám phá các <a href="${APP_URL}/courses" style="color: #000;">khóa học liên quan</a> để tiếp tục nâng cao kỹ năng`)}
    ${p(`⭐ <a href="${APP_URL}/courses/${data.courseId}#review" style="color: #000;">Đánh giá khóa học</a> để giúp các học viên khác`)}
    ${p(`💼 Cập nhật <a href="${APP_URL}/profile" style="color: #000;">hồ sơ Lumina</a> để hiển thị chứng chỉ này`)}
  `;

  const html = emailLayout({
    title: `Chứng chỉ hoàn thành - ${data.courseTitle}`,
    preheader: `Chúc mừng! Bạn đã hoàn thành "${data.courseTitle}". Tải chứng chỉ ngay.`,
    body,
  });

  const subject = `🏆 Chứng chỉ hoàn thành: ${data.courseTitle}`;

  return { html, text: htmlToText(html), subject };
}
