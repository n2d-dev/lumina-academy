import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-yellow-400" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-black font-display">
                Lumina<span className="text-yellow-400">.</span>
              </span>
            </div>
            <p className="text-neutral-400 mb-6 max-w-sm">
              Nền tảng học trực tuyến hàng đầu Việt Nam, kết nối hàng triệu học viên với những giảng viên chất lượng.
            </p>
          </div>

          <FooterColumn
            title="Dành cho học viên"
            links={[
              { href: '/courses', label: 'Khám phá khóa học' },
              { href: '/my-learning', label: 'Học tập của tôi' },
              { href: '/wishlist', label: 'Yêu thích' },
            ]}
          />

          <FooterColumn
            title="Dành cho giảng viên"
            links={[
              { href: '/teach', label: 'Trở thành giảng viên' },
              { href: '/teach/dashboard', label: 'Quản lý khóa học' },
            ]}
          />

          <FooterColumn
            title="Hỗ trợ"
            links={[
              { href: '/help', label: 'Trung tâm trợ giúp' },
              { href: '/contact', label: 'Liên hệ' },
              { href: '/terms', label: 'Điều khoản' },
              { href: '/privacy', label: 'Bảo mật' },
            ]}
          />
        </div>

        <div className="pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between gap-4 text-sm text-neutral-500">
          <p>© 2026 Lumina Academy. Tất cả quyền được bảo lưu.</p>
          <p>Made with ❤️ in Vietnam</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="font-bold mb-4">{title}</h4>
      <ul className="space-y-2 text-sm text-neutral-400">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-yellow-400">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
