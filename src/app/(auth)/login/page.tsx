'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Field = 'email' | 'password';
type Errors = Partial<Record<Field, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(field: Field, value: string): string | undefined {
  if (field === 'email') {
    if (!value.trim()) return 'Vui lòng nhập email';
    if (!EMAIL_RE.test(value)) return 'Email không hợp lệ';
  }
  if (field === 'password') {
    if (!value) return 'Vui lòng nhập mật khẩu';
  }
  return undefined;
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Validate khi rời khỏi field (on-blur) — không làm phiền khi đang gõ
  const handleBlur = (field: Field, value: string) => {
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: Errors = {
      email: validateField('email', email),
      password: validateField('password', password),
    };
    setErrors(nextErrors);

    // Auto-focus field lỗi đầu tiên
    if (nextErrors.email) return emailRef.current?.focus();
    if (nextErrors.password) return passwordRef.current?.focus();

    setLoading(true);
    const result = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Đăng nhập thành công');
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-950/30 dark:via-neutral-950 dark:to-red-950/20 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-black" strokeWidth={2.5} />
          </div>
          <span className="text-3xl font-black font-display">
            Lumina<span className="text-yellow-500">.</span>
          </span>
        </Link>

        <div className="bg-card text-card-foreground rounded-3xl shadow-xl p-8">
          <h1 className="text-2xl sm:text-3xl font-black mb-2 font-display">Đăng nhập</h1>
          <p className="text-muted-foreground mb-6">Tiếp tục hành trình học tập của bạn</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              ref={emailRef}
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => handleBlur('email', e.target.value)}
              error={errors.email}
            />
            <Input
              ref={passwordRef}
              type="password"
              autoComplete="current-password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={(e) => handleBlur('password', e.target.value)}
              error={errors.password}
            />

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">HOẶC</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signIn('google', { callbackUrl: '/' })}
            >
              Đăng nhập với Google
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signIn('github', { callbackUrl: '/' })}
            >
              Đăng nhập với GitHub
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="text-yellow-600 dark:text-yellow-500 font-bold hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
