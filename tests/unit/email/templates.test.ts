/**
 * Unit tests cho email templates.
 *
 * Tập trung:
 *   - HTML structure hợp lệ (DOCTYPE, đóng tag)
 *   - XSS escape user input
 *   - Required data hiển thị đúng
 *   - Plain text fallback có nội dung
 */

import { describe, it, expect } from 'vitest';
import { renderWelcomeEmail } from '@/lib/email/templates/welcome';
import { renderOrderConfirmation } from '@/lib/email/templates/order-confirmation';
import { renderPasswordResetEmail } from '@/lib/email/templates/password-reset';
import { renderNewEnrollmentEmail } from '@/lib/email/templates/new-enrollment';
import { renderCourseCompletionEmail } from '@/lib/email/templates/course-completion';
import { escapeHtml, htmlToText } from '@/lib/email/templates/shared/layout';

describe('Email Templates', () => {
  describe('shared utilities', () => {
    describe('escapeHtml', () => {
      it('escapes HTML special chars', () => {
        expect(escapeHtml('<script>alert("xss")</script>')).toBe(
          '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
        );
      });

      it('escapes & first to avoid double-encoding', () => {
        expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
      });

      it('escapes single quotes', () => {
        expect(escapeHtml("it's")).toBe('it&#39;s');
      });

      it('handles null/undefined', () => {
        expect(escapeHtml(null)).toBe('');
        expect(escapeHtml(undefined)).toBe('');
      });

      it('coerces number to string', () => {
        expect(escapeHtml(42)).toBe('42');
      });

      it('preserves Vietnamese chars (UTF-8 safe)', () => {
        expect(escapeHtml('Nguyễn Văn A')).toBe('Nguyễn Văn A');
      });
    });

    describe('htmlToText', () => {
      it('strips tags', () => {
        expect(htmlToText('<p>Hello <strong>World</strong></p>')).toBe('Hello World');
      });

      it('strips style blocks completely', () => {
        const html = '<style>body { color: red; }</style><p>Text</p>';
        expect(htmlToText(html)).toBe('Text');
      });

      it('decodes common entities', () => {
        expect(htmlToText('Tom &amp; Jerry &lt;hi&gt;')).toBe('Tom & Jerry <hi>');
      });

      it('collapses whitespace', () => {
        expect(htmlToText('<p>a</p>\n\n\n<p>b</p>')).toBe('a b');
      });
    });
  });

  describe('renderWelcomeEmail', () => {
    it('renders valid HTML document', () => {
      const { html } = renderWelcomeEmail({
        userName: 'Test User',
        userEmail: 'test@example.com',
      });

      expect(html).toMatch(/^<!DOCTYPE html>/);
      expect(html).toContain('</html>');
      expect(html).toContain('<title>');
    });

    it('includes user name and email', () => {
      const { html } = renderWelcomeEmail({
        userName: 'Nguyễn A',
        userEmail: 'nguyena@test.com',
      });
      expect(html).toContain('Nguyễn A');
      expect(html).toContain('nguyena@test.com');
    });

    it('escapes XSS in userName', () => {
      const { html } = renderWelcomeEmail({
        userName: '<script>alert(1)</script>',
        userEmail: 'a@b.com',
      });
      expect(html).not.toContain('<script>alert(1)</script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('produces non-empty plain text', () => {
      const { text } = renderWelcomeEmail({
        userName: 'Test',
        userEmail: 'a@b.com',
      });
      expect(text.length).toBeGreaterThan(50);
      expect(text).not.toContain('<');
    });
  });

  describe('renderOrderConfirmation', () => {
    const baseData = {
      userName: 'Test User',
      orderId: 'ORD-123',
      paymentId: 'pay_abc',
      provider: 'momo' as const,
      amount: 1290000,
      paidAt: new Date('2026-01-15T10:30:00Z'),
      courses: [{ title: 'React Course', price: 1290000 }],
    };

    it('formats VND price correctly', () => {
      const { html } = renderOrderConfirmation(baseData);
      expect(html).toContain('1.290.000đ');
    });

    it('shows correct provider label', () => {
      const momoEmail = renderOrderConfirmation({ ...baseData, provider: 'momo' });
      const vnpayEmail = renderOrderConfirmation({ ...baseData, provider: 'vnpay' });
      const stripeEmail = renderOrderConfirmation({ ...baseData, provider: 'stripe' });

      expect(momoEmail.html).toContain('Ví MoMo');
      expect(vnpayEmail.html).toContain('VNPay');
      expect(stripeEmail.html).toContain('Stripe');
    });

    it('lists all courses', () => {
      const { html } = renderOrderConfirmation({
        ...baseData,
        amount: 1290000 + 590000,
        courses: [
          { title: 'React Course', price: 1290000 },
          { title: 'TypeScript Course', price: 590000 },
        ],
      });
      expect(html).toContain('React Course');
      expect(html).toContain('TypeScript Course');
      expect(html).toContain('590.000đ');
    });

    it('escapes course titles (XSS in course name from instructor)', () => {
      const { html } = renderOrderConfirmation({
        ...baseData,
        courses: [{ title: '<img src=x onerror=alert(1)>', price: 100 }],
      });
      expect(html).not.toContain('<img src=x onerror=alert(1)>');
      expect(html).toContain('&lt;img');
    });

    it('subject includes total and course title for single course', () => {
      const { subject } = renderOrderConfirmation(baseData);
      expect(subject).toContain('1.290.000đ');
      expect(subject).toContain('React Course');
    });

    it('subject says "N khóa học" when multiple', () => {
      const { subject } = renderOrderConfirmation({
        ...baseData,
        courses: [
          { title: 'A', price: 100 },
          { title: 'B', price: 200 },
        ],
      });
      expect(subject).toContain('2 khóa học');
    });

    it('formats date in Vietnamese timezone', () => {
      const { html } = renderOrderConfirmation(baseData);
      // 10:30 UTC → 17:30 Asia/Ho_Chi_Minh
      expect(html).toMatch(/17:30/);
    });
  });

  describe('renderPasswordResetEmail', () => {
    it('includes reset URL', () => {
      const url = 'https://lumina.academy/reset-password?token=abc123';
      const { html } = renderPasswordResetEmail({
        userName: 'A',
        resetUrl: url,
        expiresInMinutes: 30,
      });
      expect(html).toContain(url);
    });

    it('shows expiration time', () => {
      const { html } = renderPasswordResetEmail({
        userName: 'A',
        resetUrl: 'http://x',
        expiresInMinutes: 30,
      });
      expect(html).toContain('30 phút');
    });

    it('shows IP address when provided', () => {
      const { html } = renderPasswordResetEmail({
        userName: 'A',
        resetUrl: 'http://x',
        expiresInMinutes: 30,
        requestIp: '192.168.1.100',
      });
      expect(html).toContain('192.168.1.100');
    });

    it('omits IP section when not provided', () => {
      const { html } = renderPasswordResetEmail({
        userName: 'A',
        resetUrl: 'http://x',
        expiresInMinutes: 30,
      });
      expect(html).not.toContain('Yêu cầu đến từ địa chỉ IP');
    });
  });

  describe('renderNewEnrollmentEmail', () => {
    it('mentions student name and email', () => {
      const { html, subject } = renderNewEnrollmentEmail({
        instructorName: 'Teacher',
        studentName: 'Student',
        studentEmail: 'student@test.com',
        courses: [{ id: '1', title: 'React' }],
      });
      expect(html).toContain('Student');
      expect(html).toContain('student@test.com');
      expect(subject).toContain('Student');
    });

    it('lists multiple courses if student bought multiple at once', () => {
      const { html } = renderNewEnrollmentEmail({
        instructorName: 'T',
        studentName: 'S',
        studentEmail: 's@t.com',
        courses: [
          { id: '1', title: 'React' },
          { id: '2', title: 'Vue' },
        ],
      });
      expect(html).toContain('React');
      expect(html).toContain('Vue');
      expect(html).toContain('2 khóa học');
    });

    it('shows total students stat when provided', () => {
      const { html } = renderNewEnrollmentEmail({
        instructorName: 'T',
        studentName: 'S',
        studentEmail: 's@t.com',
        courses: [{ id: '1', title: 'R' }],
        totalStudents: 1247,
      });
      expect(html).toContain('1.247');
    });
  });

  describe('renderCourseCompletionEmail', () => {
    it('includes certificate ID', () => {
      const { html } = renderCourseCompletionEmail({
        userName: 'A',
        courseTitle: 'React',
        courseId: '1',
        instructorName: 'B',
        certificateId: 'CERT-XYZ',
      });
      expect(html).toContain('CERT-XYZ');
    });

    it('shows hours when totalMinutesLearned provided', () => {
      const { html } = renderCourseCompletionEmail({
        userName: 'A',
        courseTitle: 'React',
        courseId: '1',
        instructorName: 'B',
        certificateId: 'C-1',
        totalMinutesLearned: 1872, // 31.2 hours
      });
      expect(html).toContain('31 giờ');
    });

    it('omits hours when not provided', () => {
      const { html } = renderCourseCompletionEmail({
        userName: 'A',
        courseTitle: 'R',
        courseId: '1',
        instructorName: 'B',
        certificateId: 'C',
      });
      expect(html).not.toContain('Tổng thời gian học');
    });
  });
});
