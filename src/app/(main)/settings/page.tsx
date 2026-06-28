'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { User, Lock, Bell, Globe, Shield, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type Section = 'profile' | 'password' | 'notifications' | 'language';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [active, setActive] = useState<Section>('profile');
  const [saving, setSaving] = useState(false);

  if (status === 'unauthenticated') {
    redirect('/login?callbackUrl=/settings');
  }

  const user = session?.user as any;

  const MENU = [
    { id: 'profile' as Section, label: 'Hồ sơ cá nhân', icon: User },
    { id: 'password' as Section, label: 'Đổi mật khẩu', icon: Lock },
    { id: 'notifications' as Section, label: 'Thông báo', icon: Bell },
    { id: 'language' as Section, label: 'Ngôn ngữ & Khu vực', icon: Globe },
  ];

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success('Đã lưu thay đổi');
  };

  return (
    <div className="bg-muted/40 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile" className="p-2 hover:bg-muted rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-black">Cài đặt</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Sidebar */}
          <div className="sm:w-56 flex-shrink-0">
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {MENU.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3.5 text-sm font-medium transition-colors border-b border-neutral-50 last:border-0 ${
                    active === item.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted/40 text-muted-foreground'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 bg-card rounded-2xl border border-border p-6">
            {active === 'profile' && (
              <div className="space-y-5">
                <h2 className="text-lg font-black mb-4">Hồ sơ cá nhân</h2>
                <div>
                  <label className="text-sm font-bold mb-1.5 block">Họ và tên</label>
                  <Input defaultValue={user?.name ?? ''} placeholder="Tên của bạn" />
                </div>
                <div>
                  <label className="text-sm font-bold mb-1.5 block">Email</label>
                  <Input defaultValue={user?.email ?? ''} disabled className="opacity-60" />
                  <p className="text-xs text-muted-foreground mt-1">Email không thể thay đổi</p>
                </div>
                <div>
                  <label className="text-sm font-bold mb-1.5 block">Tiêu đề / Chức danh</label>
                  <Input placeholder="Ví dụ: Senior Developer tại Google" />
                </div>
                <div>
                  <label className="text-sm font-bold mb-1.5 block">Giới thiệu bản thân</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-border rounded-xl outline-none focus:border-foreground resize-none text-sm"
                    placeholder="Viết vài dòng giới thiệu về bản thân..."
                  />
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            )}

            {active === 'password' && (
              <div className="space-y-5">
                <h2 className="text-lg font-black mb-4">Đổi mật khẩu</h2>
                <div>
                  <label className="text-sm font-bold mb-1.5 block">Mật khẩu hiện tại</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div>
                  <label className="text-sm font-bold mb-1.5 block">Mật khẩu mới</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div>
                  <label className="text-sm font-bold mb-1.5 block">Xác nhận mật khẩu mới</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
                </Button>
              </div>
            )}

            {active === 'notifications' && (
              <div className="space-y-4">
                <h2 className="text-lg font-black mb-4">Thông báo</h2>
                {[
                  { label: 'Khóa học mới từ giảng viên yêu thích', desc: 'Nhận thông báo khi có khóa học mới' },
                  { label: 'Nhắc nhở học tập', desc: 'Nhắc bạn tiếp tục khóa học đang dở' },
                  { label: 'Khuyến mãi & ưu đãi', desc: 'Thông báo giảm giá và mã coupon' },
                  { label: 'Cập nhật hệ thống', desc: 'Thông báo bảo trì và tính năng mới' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      className="relative w-11 h-6 rounded-full bg-yellow-400 transition-colors flex-shrink-0"
                    >
                      <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-card rounded-full shadow transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {active === 'language' && (
              <div className="space-y-5">
                <h2 className="text-lg font-black mb-4">Ngôn ngữ & Khu vực</h2>
                <div>
                  <label className="text-sm font-bold mb-1.5 block">Ngôn ngữ giao diện</label>
                  <select className="w-full px-4 py-3 border-2 border-border rounded-xl outline-none focus:border-foreground text-sm">
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold mb-1.5 block">Múi giờ</label>
                  <select className="w-full px-4 py-3 border-2 border-border rounded-xl outline-none focus:border-foreground text-sm">
                    <option value="Asia/Ho_Chi_Minh">Việt Nam (GMT+7)</option>
                    <option value="Asia/Bangkok">Bangkok (GMT+7)</option>
                    <option value="Asia/Singapore">Singapore (GMT+8)</option>
                  </select>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
