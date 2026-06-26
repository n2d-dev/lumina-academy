'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

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
          <h1 className="text-2xl sm:text-3xl font-black mb-2 font-display">Đăng nhập</h1>
          <p className="text-neutral-600 mb-6">Tiếp tục hành trình học tập của bạn</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-neutral-600 hover:text-black hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-500">HOẶC</span>
            <div className="flex-1 h-px bg-neutral-200" />
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

          <p className="mt-6 text-center text-sm text-neutral-600">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="text-yellow-600 font-bold hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
