'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message ?? 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center px-4 sm:px-6">
        <div className="bg-card rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-black mb-3 font-display">Kiểm tra email của bạn</h1>
          <p className="text-muted-foreground mb-6">
            Nếu email <strong className="text-foreground">{email}</strong> tồn tại trong hệ
            thống, chúng tôi đã gửi link đặt lại mật khẩu. Link có hiệu lực trong 30
            phút.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Không thấy email? Kiểm tra thư rác hoặc đợi vài phút.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Quay lại đăng nhập
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center px-4 sm:px-6">
      <div className="bg-card rounded-2xl p-8 max-w-md w-full">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại đăng nhập
        </Link>

        <h1 className="text-2xl sm:text-3xl font-black mb-2 font-display">Quên mật khẩu?</h1>
        <p className="text-muted-foreground mb-6">
          Nhập email tài khoản, chúng tôi sẽ gửi link đặt lại mật khẩu qua email.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? 'Đang gửi...' : 'Gửi link đặt lại'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-foreground font-bold hover:underline">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}
