# Testing Guide

Full coverage suite: **Vitest** (unit/integration/components) + **Playwright** (E2E) + **GitHub Actions CI**.

---

## Tóm tắt

**29 test files · 115 unit/component tests passing · Coverage targets: 70% lines/functions**

```
tests/
├── unit/                    # Pure logic, không DB, không network
│   ├── payments/
│   │   ├── momo.test.ts          (11 tests)
│   │   └── vnpay.test.ts         (12 tests)
│   ├── email/
│   │   ├── templates.test.ts     (31 tests)
│   │   └── send.test.ts          (13 tests)
│   └── lib/
│       └── utils.test.ts         (29 tests)
├── integration/             # Real Postgres + API routes
│   ├── payments/
│   │   └── fulfill.test.ts       # fulfillPayment idempotency, tampering
│   └── api/
│       ├── auth/
│       │   └── auth.test.ts      # Register, forgot/reset password
│       └── webhooks/
│           └── webhooks.test.ts  # MoMo + VNPay IPN handlers
├── components/              # React + Testing Library
│   ├── Button.test.tsx           (9 tests)
│   ├── Input.test.tsx            (8 tests)
│   └── ForgotPasswordPage.test.tsx (4 tests)
├── e2e/                     # Playwright browser tests
│   ├── auth.spec.ts              # Register → login flow
│   ├── password-reset.spec.ts    # Forgot → reset → login
│   └── purchase.spec.ts          # Browse → cart → checkout
└── helpers/
    ├── setup.ts                  # Global Vitest setup
    ├── db.ts                     # Prisma test client + factories
    └── setup-test-db.ts          # Apply schema to test DB
```

---

## Quick start

```bash
# 1. Install deps (đã có resend, vitest, playwright, testing-library)
npm install

# 2. Start test Postgres (Docker)
npm run test:db:up

# 3. Apply schema
npm run test:db:setup

# 4. Run tests
npm run test:unit          # ⚡ ~2s — không cần DB
npm run test:components    # ⚡ ~3s — không cần DB  
npm run test:integration   # 🐢 ~30s — cần Postgres
npm run test:e2e           # 🐢 ~60s — cần Postgres + dev server

# 5. Cleanup
npm run test:db:down
```

### Tất cả trong 1 lệnh

```bash
npm run test               # = vitest run (unit + integration + components)
npm run test:coverage      # + coverage report
```

---

## Strategy: tại sao real Postgres?

**SQLite in-memory** nhanh hơn nhưng khác semantics:
- ❌ JSON operators khác (Postgres dùng `->`, SQLite không có)
- ❌ Enum types không support
- ❌ Concurrent transaction semantics khác

Test trên SQLite có thể **pass** nhưng prod **fail** vì query khác behavior.

**Postgres trong Docker** với `tmpfs`:
- Data trong RAM → nhanh (~3s boot)
- Mỗi `docker compose down -v` là sạch
- 100% giống production

Tests có thể **bắt được Postgres-specific bugs** mà SQLite miss.

---

## Critical findings từ test suite này

Tests caught 2 production bugs khi viết:

### Bug 1: Double-escape XSS trong welcome email
```typescript
// Trước (BUG):
const name = escapeHtml(data.userName) || 'bạn';
${h1(`Chào mừng ${name}`)}  // h1() escape lại → &amp;lt; thay vì &lt;

// Sau:
const name = data.userName || 'bạn';
${h1(`Chào mừng ${name}`)}  // h1() escape 1 lần đúng cách
```

### Bug 2: MoMo signature verify crash với invalid hex
```typescript
// Trước (BUG):
crypto.timingSafeEqual(
  Buffer.from(receivedSignature, 'hex'),  // 'X' invalid hex → short buffer
  Buffer.from(expectedSignature, 'hex')   // → crypto throws RangeError
);

// Sau:
try {
  const r = Buffer.from(receivedSig, 'hex');
  const e = Buffer.from(expectedSig, 'hex');
  sigValid = r.length === e.length && crypto.timingSafeEqual(r, e);
} catch { sigValid = false; }
```

→ Bug 2 là **DoS-able** trước fix: attacker gửi malformed signature → MoMo webhook 500.

---

## Patterns dùng trong suite

### 1. Factories cho test data

```typescript
const user = await createTestUser({ email: 'a@b.com' });
const payment = await createTestPayment({ userId: user.id, amount: 100000 });
```

Không hardcode IDs/emails — counter + timestamp đảm bảo unique giữa các tests.

### 2. Database cleanup

```typescript
beforeEach(async () => {
  await cleanDatabase();   // wipe trước mỗi test → state independent
});
```

`cleanDatabase()` xoá theo thứ tự FK constraints (child trước, parent sau).

### 3. Mock external services

```typescript
// Mock email — không gửi thật
vi.mock('@/lib/email', () => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue({ ok: true }),
}));

// Mock fetch cho MoMo API
vi.stubGlobal('fetch', vi.fn(async () => new Response('...')));
```

### 4. Real API route testing

```typescript
import { POST } from '@/app/api/auth/register/route';

const req = new Request('http://localhost/api/auth/register', {
  method: 'POST',
  body: JSON.stringify({ name: 'X', email: 'x@y.com', password: 'pass' }),
});
const res = await POST(req);
expect(res.status).toBe(200);
```

→ Test handler thật, đi qua zod validation thật, ghi DB thật. Không mock middleware/Next.

### 5. Concurrent idempotency test

```typescript
// Mô phỏng IPN retry + return URL trùng nhau
const results = await Promise.all(
  Array.from({ length: 10 }, () => fulfillPayment(verified))
);
// Vẫn CHỈ 1 enrollment được tạo
expect(enrollments).toHaveLength(1);
```

### 6. Anti-tampering verification

```typescript
const result = await fulfillPayment({
  ...verified,
  amount: 1, // attacker fake amount thấp
});
expect(result.ok).toBe(false);
expect(payment.status).toBe('FAILED');
```

### 7. E2E sử dụng direct DB cho setup

```typescript
// E2E không thể đọc email → fetch token trực tiếp DB
const tokenRow = await prisma.passwordResetToken.findFirst({
  where: { userId: user.id, usedAt: null },
});
// Replace token với raw để mô phỏng user click email link
```

---

## CI workflow

`.github/workflows/ci.yml` chạy 4 jobs song song:

| Job | Trigger | Duration (est.) |
|---|---|---|
| `unit-tests` | Push, PR | ~30s |
| `integration-tests` | Push, PR | ~2min (Postgres service container) |
| `e2e-tests` | Push, PR | ~3min (Playwright + Postgres) |
| `type-check` | Push, PR | ~30s |

E2E test artifacts (screenshots, videos) được upload nếu fail → debug từ GitHub UI.

---

## Coverage targets

`vitest.config.ts` đặt thresholds:
- Lines: 70%
- Functions: 70%
- Branches: 65%
- Statements: 70%

Bypass cho:
- `*.config.*`
- `app/**/layout.tsx`, `app/**/error.tsx` (boilerplate)
- `types/**` (declarations)
- `prisma/**` (generated)

```bash
npm run test:coverage  # generate HTML report → coverage/index.html
```

---

## Known limitations / future work

1. **E2E purchase flow stub** — Không thể auto-complete sandbox MoMo/VNPay từ headless browser. Full lifecycle test đã cover qua webhook integration tests.

2. **`MOCK_COURSES` mock** — Production sẽ thay `prisma.course.findMany()`. Khi đó test cần seed courses thật vào DB qua factory.

3. **NextAuth E2E** — Chỉ test register/login flow. Test middleware-protected routes cần setup cookie/session manual hoặc dùng `next-auth/test`.

4. **Component coverage chỉ Button, Input, ForgotPasswordPage** — Khi UI ổn định, thêm tests cho `CourseCard`, `Header`, `Cart` components.

5. **Performance tests** — Suite hiện không có. Nếu cần, thêm k6 hoặc Artillery cho load test API.

6. **Visual regression** — Optional với Playwright `toHaveScreenshot()`. Chưa có vì design có thể còn change.

---

## Adding new tests

### Unit test (no DB)
```bash
# Tạo file mới
tests/unit/lib/my-feature.test.ts

# Run
npx vitest run tests/unit/lib/my-feature.test.ts

# Watch mode
npx vitest tests/unit/lib/my-feature.test.ts
```

### Integration test (with DB)
```bash
# Cần Docker DB running
npm run test:db:up
npm run test:db:setup

# Tạo trong tests/integration/
# Import factories từ '../../helpers/db'
```

### E2E test
```bash
# Cần DB + dev server
npm run test:db:up
npm run dev  # terminal 1
npm run test:e2e:ui  # terminal 2 (UI mode để debug step-by-step)
```

---

## Commands reference

```bash
# Run all
npm test

# Filter
npm test -- payments        # tests matching "payments"
npm test -- -t "idempotent" # tests matching name

# Watch (TDD mode)
npm run test:watch

# UI dashboard
npm run test:ui

# Coverage
npm run test:coverage

# E2E debug
npm run test:e2e:ui         # Playwright UI
npx playwright test --debug # step-through mode
npx playwright show-report  # view last run report
```
