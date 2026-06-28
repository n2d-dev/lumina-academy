'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Field = 'name' | 'email' | 'password';
type Errors = Partial<Record<Field, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(field: Field, value: string): string | undefined {
  if (field === 'name') {
    if (!value.trim()) return 'Vui lòng nhập họ tên';
    if (value.trim().length < 2) return 'Họ tên quá ngắn';
  }
  if (field === 'email') {
    if (!value.trim()) return 'Vui lòng nhập email';
    if (!EMAIL_RE.test(value)) return 'Email không hợp lệ';
  }
  if (field === 'password') {
    if (!value) return 'Vui lòng nhập mật khẩu';
    if (value.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
  }
  return undefined;
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Errors>({});

  const refs: Record<Field, React.RefObject<HTMLInputElement>> = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
  };

  const handleBlur = (field: Field, value: string) => {
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: Errors = {
      name: validateField('name', form.name),
      email: validateField('email', form.email),
      password: validateField('password', form.password),
    };
    setErrors(nextErrors);

    // Auto-focus field lỗi đầu tiên theo thứ tự hiển thị
    const firstInvalid = (['name', 'email', 'password'] as Field[]).find((f) => nextErrors[f]);
    if (firstInvalid) return refs[firstInvalid].current?.focus();

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? 'Đăng ký thất bại');
      }

      toast.success('Đăng ký thành công! Vui lòng đăng nhập');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl sm:text-3xl font-black mb-2 font-display">Tạo tài khoản</h1>
          <p className="text-muted-foreground mb-6">Bắt đầu hành trình học tập của bạn</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              ref={refs.name}
              type="text"
              autoComplete="name"
              placeholder="Họ và tên"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onBlur={(e) => handleBlur('name', e.target.value)}
              error={errors.name}
            />
            <Input
              ref={refs.email}
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onBlur={(e) => handleBlur('email', e.target.value)}
              error={errors.email}
            />
            <Input
              ref={refs.password}
              type="password"
              autoComplete="new-password"
              placeholder="Mật khẩu (ít nhất 6 ký tự)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onBlur={(e) => handleBlur('password', e.target.value)}
              error={errors.password}
            />

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-yellow-600 dark:text-yellow-500 font-bold hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
