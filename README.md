# 🎓 Lumina Academy

Nền tảng học trực tuyến hiện đại, được xây dựng với Next.js 14, TypeScript, Prisma và Stripe.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Prisma](https://img.shields.io/badge/Prisma-5-darkblue) ![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan)

## ✨ Tính năng

- 🏠 **Trang chủ** với hero section, danh mục, khóa học nổi bật
- 🔍 **Khám phá khóa học** với filter danh mục, tìm kiếm, sắp xếp
- 📚 **Chi tiết khóa học** với 4 tabs: Tổng quan, Nội dung, Giảng viên, Đánh giá
- 🛒 **Giỏ hàng & Wishlist** với localStorage persist
- 💳 **Thanh toán Stripe** (đã tích hợp) - hỗ trợ thẻ tín dụng quốc tế
- 🎬 **Video player** với custom controls, tracking progress
- 📊 **My Learning** - dashboard học viên với progress tracking
- 👨‍🏫 **Trở thành giảng viên** - landing page cho instructors
- 🔐 **Authentication** - NextAuth (Email/Password, Google, GitHub)
- 🎛️ **Admin Panel** - quản lý courses, users, orders, analytics
- 🔔 **Toast notifications** với Sonner

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Database | PostgreSQL + Prisma ORM |
| Authentication | NextAuth.js v4 |
| Payment | Stripe |
| State Management | Zustand (with persist) |
| Styling | Tailwind CSS + class-variance-authority |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Notifications | Sonner |

## 📦 Cài đặt

### 1. Clone và cài đặt dependencies

```bash
git clone <your-repo-url>
cd lumina-academy
npm install
```

### 2. Setup database

Cài PostgreSQL local hoặc dùng dịch vụ cloud (Supabase, Neon, Railway).

```bash
# Copy file env mẫu
cp .env.example .env.local

# Chỉnh DATABASE_URL trong .env.local
# Ví dụ: postgresql://user:pass@localhost:5432/lumina

# Push schema vào database
npm run db:push

# Seed data mẫu
npm run db:seed
```

### 3. Cấu hình environment variables

Mở `.env.local` và điền các giá trị:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="<generate bằng: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"

# Stripe (lấy từ https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### 4. Chạy development server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

### 5. Tài khoản test (sau khi seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lumina.vn | password123 |
| Instructor | instructor@lumina.vn | password123 |
| Student | student@lumina.vn | password123 |

## 📁 Cấu trúc dự án

```
lumina-academy/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Script tạo data mẫu
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Route group: login, register
│   │   ├── (main)/            # Route group có header/footer
│   │   │   ├── courses/       # Listing + detail
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── my-learning/
│   │   │   ├── teach/
│   │   │   └── wishlist/
│   │   ├── learn/[courseId]/  # Immersive video player
│   │   ├── admin/             # Admin panel (role: ADMIN)
│   │   └── api/               # API routes
│   │       ├── auth/          # NextAuth + register
│   │       ├── checkout/      # Stripe checkout
│   │       ├── courses/       # Public courses API
│   │       └── webhooks/      # Stripe webhook
│   ├── components/
│   │   ├── ui/                # Atomic components (Button, Input, Badge)
│   │   ├── layout/            # Header, Footer, UserMenu
│   │   ├── course/            # CourseCard, CourseGrid, CourseTabs
│   │   ├── home/              # HeroSection, CategoriesSection
│   │   ├── learning/          # VideoPlayer, LessonSidebar
│   │   └── admin/             # AdminSidebar
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── stripe.ts          # Stripe client
│   │   ├── utils.ts           # formatPrice, cn(), etc.
│   │   └── constants.ts       # CATEGORIES, GRADIENTS
│   ├── store/                 # Zustand stores
│   │   ├── cartStore.ts
│   │   └── wishlistStore.ts
│   ├── data/                  # Mock data (dev)
│   ├── types/                 # TypeScript definitions
│   └── ...
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 🔑 Các quy chuẩn code quan trọng

### Component organization
- **Server Components mặc định** - chỉ dùng `'use client'` khi cần interactivity
- **1 component = 1 file**, max ~200 dòng
- **UI components** trong `components/ui/` - tái sử dụng, không có business logic
- **Feature components** trong `components/[domain]/` - có business logic cụ thể

### Naming conventions
- **Files**: PascalCase cho components (`CourseCard.tsx`), camelCase cho utilities (`utils.ts`)
- **Components**: PascalCase exports
- **Hooks**: prefix `use` (vd: `useCart`)
- **Stores**: suffix `Store` (vd: `cartStore`)

### State management strategy
- **Local UI state** → `useState`
- **Form state** → React Hook Form
- **Global client state** → Zustand (cart, wishlist)
- **Server state** → React Server Components + Prisma queries
- **URL state** → searchParams (filters, pagination)

### Type safety
- Mọi component đều có Props interface
- Không dùng `any` (trừ trường hợp đặc biệt cho NextAuth)
- Validate API input bằng Zod

## 🚀 Deploy

### Vercel (khuyến nghị)
```bash
npm i -g vercel
vercel
```

### Setup production database
- [Neon](https://neon.tech) - Free tier 0.5GB
- [Supabase](https://supabase.com) - Free tier 500MB
- [Railway](https://railway.app) - $5/tháng

### Setup Stripe webhook
```bash
stripe listen --forward-to https://your-domain.com/api/webhooks/stripe
```

## 🎨 Course Builder (NEW - v2)

Hệ thống tạo & quản lý khóa học hoàn chỉnh dành cho instructor:

### Workflow 5 bước
1. **Thông tin cơ bản** (`/teach/courses/[id]/edit`)
   - Title, subtitle, description với validation real-time
   - Cấp độ, ngôn ngữ
   - Array editor cho whatYouLearn / requirements / targetAudience
   - **Auto-save** sau 1.5s không gõ
   
2. **Curriculum** (`/teach/courses/[id]/curriculum`)
   - Tree view: Course → Sections → Lessons
   - Inline edit title (click để sửa)
   - Move up/down sections và lessons
   - Lesson editor modal với upload video (presigned URL pattern)
   - Auto-detect video duration từ file
   - Toggle preview lesson

3. **Pricing** (`/teach/courses/[id]/pricing`)
   - 6 tier giá có sẵn + tùy chỉnh
   - Original price (cho hiệu ứng giảm giá)
   - Live preview + tính revenue share (70% cho instructor)

4. **Settings** (`/teach/courses/[id]/settings`)
   - Chọn thumbnail (8 gradients)
   - Cài đặt nâng cao

5. **Publish** (`/teach/courses/[id]/publish`)
   - Validation checklist (7 mục)
   - Progress bar trực quan
   - Publish / Unpublish toggle

### Kiến trúc Course Builder
```
src/app/api/instructor/      # API routes (course/section/lesson CRUD)
src/app/(main)/teach/        # UI pages
src/components/instructor/   # Reusable components
src/lib/validations/         # Zod schemas
src/lib/auth-helpers.ts      # requireInstructor, requireCourseOwner
src/hooks/useApi.ts          # API hook with toast
src/hooks/useAutoSave.ts     # Debounced auto-save
```

### Security
- Tất cả `/api/instructor/*` endpoints check role INSTRUCTOR/ADMIN
- `requireCourseOwner()` verify ownership trước mọi mutation
- Zod validation cả client & server

## 🎓 Quiz & Assignment System (NEW - v3)

Hệ thống quiz hoàn chỉnh với 4 loại câu hỏi và auto-grading:

### 4 loại câu hỏi
1. **Multiple Choice** - Trắc nghiệm 1 đáp án đúng (radio buttons)
2. **Multiple Select** - Trắc nghiệm nhiều đáp án (checkboxes)
3. **True/False** - Câu hỏi đúng/sai
4. **Short Answer** - Trả lời ngắn (text matching, có option case-sensitive)

### Cho Instructor
- Tạo quiz cho từng lesson (1 lesson = 1 quiz)
- Question editor với UI khác nhau cho từng type
- Visual feedback (✓ check icon cho đáp án đúng)
- Cài đặt quiz: time limit, passing score, max attempts, shuffle, show correct answers
- Xem stats: số câu hỏi, lượt làm bài, average score

### Cho Student
- 3-phase UX: Intro → Taking → Result
- Timer countdown nếu có time limit (tự động submit khi hết giờ)
- Question navigator (jump giữa các câu)
- Progress bar
- Review chi tiết sau khi submit (đáp án bạn chọn vs đáp án đúng)
- Retake nếu chưa hết attempts

### Anti-cheat
- Server **KHÔNG** gửi `isCorrect` xuống client khi đang làm bài
- Server tự strip `acceptedAnswers` cho SHORT_ANSWER
- Grading 100% ở server-side với pure functions (`/lib/grading.ts`)
- Verify enrollment trước khi cho làm quiz

### Files
```
src/lib/grading.ts                   # Auto-grading engine (pure functions)
src/lib/validations/quiz.ts          # Zod schemas
src/types/quiz.ts                    # TypeScript types
src/app/api/instructor/quizzes/      # CRUD API
src/app/api/quiz/[id]/submit/        # Student submit endpoint
src/app/(main)/teach/.../quizzes/    # Instructor UI
src/app/learn/.../quiz/[id]/         # Student UI
src/components/quiz/                 # QuestionEditor, QuizResult
```

## 🎬 Video Streaming với Mux (NEW - v4)

Video infrastructure production-ready thay thế upload S3 mock của v1:

### Tính năng
- **Direct Upload** — client upload thẳng tới Mux, không qua server (resumable, hỗ trợ file 5GB+)
- **Adaptive Bitrate Streaming (HLS)** — Mux auto-transcode nhiều resolutions, browser tự chọn theo network
- **Signed Playback URLs** — JWT-based access control, token expire 6h
- **Webhook integration** — DB tự update khi video processed/errored
- **Mux Data analytics** — engagement, drop-off, error tracking
- **Auto thumbnails** — `https://image.mux.com/{playbackId}/thumbnail.jpg`

### Architecture
```
[Instructor]                [Server]              [Mux]            [Student]
     |                         |                    |                  |
     |-- "upload video" ------>|                    |                  |
     |                         |-- create upload -->|                  |
     |                         |<-- uploadUrl ------|                  |
     |<--- uploadUrl ----------|                    |                  |
     |--- PUT file ----------->|------------------->|                  |
     |                         |                    |-- processing... -|
     |                         |<-- webhook --------|                  |
     |                         | save assetId,                         |
     |                         | playbackId                            |
     |                                                                 |
     |                         |<-- "play video" ----------------------|
     |                         |- check enrollment                     |
     |                         |- generate JWT                         |
     |                         |--- playbackId + token --------------->|
     |                                              |<-- HLS stream ---|
     |                                              | (with token) ----|
```

### Files
```
src/lib/mux.ts                                # Mux client + helpers (JWT, webhook verify)
src/app/api/instructor/lessons/[id]/upload/   # Create direct upload URL
src/app/api/lessons/[id]/playback/            # Get signed token cho student
src/app/api/webhooks/mux/                     # Webhook handler (asset.ready, errored, ...)
src/components/instructor/VideoUploader.tsx   # MuxUploader wrapper
src/components/learning/VideoPlayer.tsx       # MuxPlayer wrapper
```

### Setup Mux

1. Tạo account tại https://mux.com → vào Dashboard
2. Tạo Access Token: https://dashboard.mux.com/settings/access-tokens
   - Set vào `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`
3. Tạo Signing Key cho signed URLs:
   ```bash
   curl https://api.mux.com/system/v1/signing-keys \
     -H "Content-Type: application/json" \
     -u $MUX_TOKEN_ID:$MUX_TOKEN_SECRET \
     -X POST
   ```
   - Encode private key thành base64, set vào `MUX_SIGNING_KEY_PRIVATE_BASE64`
4. Setup Webhook: https://dashboard.mux.com/settings/webhooks
   - URL: `https://your-domain.com/api/webhooks/mux`
   - Events: `video.asset.ready`, `video.asset.errored`, `video.upload.cancelled`, `video.upload.asset_created`
   - Copy signing secret vào `MUX_WEBHOOK_SECRET`

### Local development webhook

Mux webhook không thể đến `localhost`. Dùng ngrok:
```bash
npm install -g ngrok
ngrok http 3000
# Copy ngrok URL, paste vào Mux webhook settings (tạm thời cho dev)
```

### Cost estimate (Mux pricing 2026)
- **Encoding**: ~$0.027/min video (one-time)
- **Storage**: ~$0.003/min/month
- **Streaming**: ~$0.00096/min watched
- Ví dụ: 1 khóa học 50 giờ + 1000 students xem hết = ~$50/month

## 📋 Roadmap (cần build thêm)

- [x] ~~Course builder studio (UI tạo course cho instructor)~~ ✅ DONE
- [x] ~~Quiz & assignment system~~ ✅ DONE (v3)
- [x] ~~Video Streaming với Mux~~ ✅ DONE (v4)
- [ ] Tích hợp MoMo + VNPay

- [ ] Live streaming với LiveKit/Mux
- [ ] Discussion forum / Q&A per lesson
- [ ] Certificate generation (PDF)
- [ ] Email notifications (Resend/SendGrid)
- [ ] Mobile app (React Native)
- [ ] Multi-language (i18n với next-intl)
- [ ] Recommendation engine
- [ ] Tích hợp MoMo, VNPay cho thị trường VN
- [ ] Tests (Vitest + Playwright)

## 📝 Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run type-check   # TypeScript check
npm run db:push      # Push schema to DB
npm run db:studio    # Prisma Studio (DB GUI)
npm run db:seed      # Seed sample data
```

## 📄 License

MIT © 2026 Lumina Academy

---

Made with ❤️ in Vietnam
