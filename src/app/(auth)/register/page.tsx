'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-yellow-400" strokeWidth={2.5} />
          </div>
          <span className="text-3xl font-black font-display">
            Lumina<span className="text-yellow-500">.</span>
          </span>
        </Link>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h1 className="text-2xl sm:text-3xl font-black mb-2 font-display">Tạo tài khoản</h1>
          <p className="text-neutral-600 mb-6">Bắt đầu hành trình học tập của bạn</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Họ và tên"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              type="password"
              placeholder="Mật khẩu (ít nhất 6 ký tự)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={6}
              required
            />

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-600">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-yellow-600 font-bold hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
