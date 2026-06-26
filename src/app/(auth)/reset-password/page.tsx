'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-black mb-3 font-display">Link không hợp lệ</h1>
        <p className="text-neutral-600 mb-6">
          Link đặt lại mật khẩu không có hoặc không đầy đủ. Vui lòng yêu cầu link mới.
        </p>
        <Link href="/forgot-password">
          <Button className="w-full">Yêu cầu link mới</Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      toast.error(err.message ?? 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-black mb-3 font-display">Đặt lại thành công!</h1>
        <p className="text-neutral-600 mb-6">
          Mật khẩu của bạn đã được đặt lại. Đang chuyển đến trang đăng nhập...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 max-w-md w-full">
      <h1 className="text-2xl sm:text-3xl font-black mb-2 font-display">Đặt mật khẩu mới</h1>
      <p className="text-neutral-600 mb-6">
        Nhập mật khẩu mới cho tài khoản của bạn. Mật khẩu phải có ít nhất 6 ký tự.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="password"
          placeholder="Mật khẩu mới"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <Input
          type="password"
          placeholder="Nhập lại mật khẩu"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />

        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 sm:px-6">
      <Suspense fallback={null}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
