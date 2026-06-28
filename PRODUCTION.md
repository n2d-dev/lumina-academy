# 🚀 Production Readiness — Lumina Academy

Checklist đưa nền tảng lên vận hành thật. Đánh dấu ✅ khi hoàn tất.

---

## 1. Đã triển khai trong code ✅

Những mục dưới đây **đã được code sẵn** trong lần cập nhật này:

- **Security headers** (`next.config.js`): CSP, HSTS, X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy, Permissions-Policy. Ẩn `X-Powered-By`.
- **Rate limiting** (`src/lib/rate-limit.ts`): đã áp cho `/api/auth/register` (5/phút),
  `/api/auth/forgot-password` (3/phút), `/api/auth/reset-password` (10/phút).
- **SEO**: `src/app/sitemap.ts` (động theo khóa học PUBLISHED), `src/app/robots.ts`,
  `metadataBase` + Open Graph/Twitter card ở `layout.tsx` và trang chi tiết khóa học.
- **Tối ưu ảnh**: bật AVIF/WebP trong `next.config.js`.
- **Analytics**: `src/components/analytics/Analytics.tsx` (bật bằng env, mặc định tắt).

---

## 2. Cần cấu hình trước khi go-live ⚙️

### 2.1. Biến môi trường (bắt buộc)
Sao chép `.env.example` → `.env` và điền **giá trị production thật** (KHÔNG dùng sandbox):

- [ ] `DATABASE_URL` — Postgres production (Neon / Supabase / RDS...)
- [ ] `NEXTAUTH_SECRET` — chuỗi ngẫu nhiên ≥ 32 ký tự (`openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` — domain thật, vd `https://lumina-academy.vn`
- [ ] Stripe: đổi `sk_test_` → `sk_live_`, cấu hình `STRIPE_WEBHOOK_SECRET` production
- [ ] MoMo: đổi endpoint sang `https://payment.momo.vn/...` + credentials merchant thật
- [ ] VNPay: đổi endpoint sang `https://pay.vnpay.vn/...` + `VNPAY_TMN_CODE`/`VNPAY_HASH_SECRET` thật
- [ ] Mux: `MUX_TOKEN_ID/SECRET`, `MUX_WEBHOOK_SECRET`, signing key cho signed playback
- [ ] Resend: `RESEND_API_KEY` + verify domain gửi mail
- [ ] Cập nhật `SITE_CONFIG.url` trong `src/lib/constants.ts` nếu đổi domain

### 2.2. Webhook (đăng ký URL ở dashboard từng nhà cung cấp)
- [ ] Stripe → `https://<domain>/api/webhooks/stripe`
- [ ] MoMo → `https://<domain>/api/webhooks/momo`
- [ ] VNPay → `https://<domain>/api/webhooks/vnpay`
- [ ] Mux → `https://<domain>/api/webhooks/mux`

### 2.3. Database
- [ ] Chạy migration thật: `npx prisma migrate deploy` (KHÔNG dùng `db push` ở prod)
- [ ] Seed dữ liệu danh mục/khóa học ban đầu nếu cần
- [ ] Bật backup tự động (point-in-time recovery)

---

## 3. Còn thiếu — nên làm để đạt chuẩn "cao cấp" 🔧

### 3.1. ⚠️ Trang chi tiết khóa học đang dùng MOCK DATA
`src/app/(main)/courses/[slug]/page.tsx` gọi `getCourseBySlug()` từ `src/data/courses.ts`
(dữ liệu giả), **chưa nối DB**. Cần thay bằng truy vấn Prisma thật trước khi go-live.
Kiểm tra thêm các trang khác còn import từ `@/data/courses`.

### 3.2. Error tracking (Sentry) — KHUYẾN NGHỊ
Hiện lỗi chỉ `console.error`. Để giám sát production:
```bash
npx @sentry/wizard@latest -i nextjs
```
Wizard sẽ tạo `sentry.*.config.ts` và wrap `next.config.js`. Sau đó điền `SENTRY_DSN`
và `NEXT_PUBLIC_SENTRY_DSN` (đã có sẵn trong `.env.example`).
Nhớ thêm `https://*.sentry.io` vào `connect-src` của CSP trong `next.config.js`.

### 3.3. Rate limiting phân tán (nếu deploy nhiều instance / serverless)
`src/lib/rate-limit.ts` hiện lưu in-memory → mỗi instance đếm riêng. Trên Vercel/đa
instance cần store dùng chung:
```bash
npm i @upstash/ratelimit @upstash/redis
```
Thay phần lõi của `rate-limit.ts` bằng Upstash, giữ nguyên hàm `checkRateLimit` để các
route không phải sửa.

### 3.4. Trang pháp lý (bắt buộc khi thu tiền thật)
- [ ] Điều khoản sử dụng
- [ ] Chính sách bảo mật (PDPL/Nghị định 13 về bảo vệ dữ liệu cá nhân)
- [ ] Chính sách hoàn tiền / hủy
- [ ] Thông tin doanh nghiệp + liên hệ (yêu cầu cho cổng thanh toán VN)

### 3.5. Vận hành
- [ ] Uptime monitoring (UptimeRobot / BetterStack) cho trang chủ + webhook
- [ ] Health-check endpoint (`/api/health`) kiểm tra DB
- [ ] Log tập trung (Logtail / Axiom) thay cho `console`
- [ ] CSP: sau khi deploy, mở DevTools → Console kiểm tra không có lỗi "blocked by CSP"
      (Mux player, Stripe, fonts, analytics). Bổ sung origin nếu bị chặn.

---

## 4. Trước mỗi lần deploy
```bash
npm run type-check     # phải sạch
npm run lint
npm run test           # unit + integration + e2e
npm run build          # build production phải thành công
```
CI (`.github/workflows/ci.yml`) đã chạy type-check + test tự động trên mỗi PR.

---

## 5. Kiểm thử sau deploy (smoke test)
- [ ] Đăng ký / đăng nhập / quên mật khẩu
- [ ] Mua khóa học qua từng cổng (Stripe, MoMo, VNPay) — kiểm tra webhook ghi nhận enrollment
- [ ] Xem video bài học (Mux signed playback hoạt động)
- [ ] Làm quiz, theo dõi tiến độ
- [ ] Kiểm tra `https://<domain>/sitemap.xml` và `/robots.txt`
- [ ] Dán link khóa học vào Facebook/Zalo → kiểm tra hiện ảnh + tiêu đề OG
- [ ] Chạy [PageSpeed Insights](https://pagespeed.web.dev) → mục tiêu Performance ≥ 90
- [ ] Chạy [securityheaders.com](https://securityheaders.com) → mục tiêu hạng A
