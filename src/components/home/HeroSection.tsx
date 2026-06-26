import Link from 'next/link';
import { Flame, ArrowRight, Trophy, CheckCircle2, Star, Play } from 'lucide-react';
import { GRADIENTS } from '@/lib/constants';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
      <div className="absolute inset-0 opacity-40">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="hero-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <circle cx="25" cy="25" r="1" fill="#000" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-black text-white rounded-full text-xs font-bold mb-5 sm:mb-8">
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400" />
              ƯU ĐÃI 50% CHO NGƯỜI MỚI
            </div>

            {/* Headline — scales from mobile to desktop */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[0.95] mb-4 sm:mb-6 tracking-tight font-display">
              Học bất cứ điều gì,
              <br />
              <span className="italic">trở thành</span>
              <br />
              <span className="relative inline-block">
                bất cứ ai
                <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full" height="16" viewBox="0 0 300 20">
                  <path d="M5,15 Q150,0 295,15" stroke="#facc15" strokeWidth="6" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="text-base sm:text-lg text-neutral-700 mb-6 sm:mb-8 max-w-lg leading-relaxed">
              Hơn <strong>15,000+ khóa học</strong> chất lượng cao từ những chuyên gia hàng đầu.
              Học mọi lúc, mọi nơi, theo nhịp độ của riêng bạn.
            </p>

            {/* CTAs — stack on mobile, row on sm+ */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8 sm:mb-12">
              <Link
                href="/courses"
                className="flex items-center justify-center gap-2 px-6 py-4 bg-black text-white font-bold rounded-full hover:bg-neutral-800 active:scale-95 transition-all text-sm sm:text-base"
              >
                Khám phá khóa học
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/teach"
                className="flex items-center justify-center px-6 py-4 bg-white border-2 border-black text-black font-bold rounded-full hover:bg-neutral-50 active:scale-95 transition-all text-sm sm:text-base"
              >
                Trở thành giảng viên
              </Link>
            </div>

            {/* Stats — compact on mobile */}
            <div className="flex items-center gap-4 sm:gap-8">
              <Stat value="2M+" label="Học viên" />
              <div className="w-px h-8 sm:h-12 bg-neutral-300" />
              <Stat value="15K+" label="Khóa học" />
              <div className="w-px h-8 sm:h-12 bg-neutral-300" />
              <Stat value="4.8★" label="Đánh giá" />
            </div>
          </div>

          {/* Feature card — hidden on mobile, show lg+ */}
          <div className="relative hidden lg:block">
            <FeatureCard />
          </div>

          {/* Mobile-only mini feature strip */}
          <div className="lg:hidden flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
            {[
              { title: 'React.js 2026', rating: 4.9, price: '1.290.000đ' },
              { title: 'TypeScript Pro', rating: 4.8, price: '890.000đ' },
              { title: 'UI/UX Design', rating: 4.7, price: '990.000đ' },
            ].map((c) => (
              <div key={c.title} className="flex-shrink-0 snap-start bg-white rounded-2xl p-4 shadow-md w-52">
                <div
                  className="aspect-video rounded-xl mb-3 flex items-center justify-center"
                  style={{ background: GRADIENTS['gradient-blue'] }}
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <Play className="w-4 h-4 text-black ml-0.5" fill="currentColor" />
                  </div>
                </div>
                <p className="font-bold text-sm mb-1 line-clamp-1">{c.title}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-500 font-bold">★ {c.rating}</span>
                  <span className="text-xs font-black">{c.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl sm:text-3xl font-black font-display">{value}</div>
      <div className="text-xs text-neutral-600 font-medium">{label}</div>
    </div>
  );
}

function FeatureCard() {
  return (
    <div className="relative">
      <div className="relative z-20 bg-white rounded-3xl shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-500">
        <div
          className="aspect-video rounded-2xl mb-4 relative overflow-hidden"
          style={{ background: GRADIENTS['gradient-blue'] }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <Play className="w-7 h-7 text-black ml-1" fill="currentColor" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
          <span className="font-bold text-sm">4.9</span>
          <span className="text-xs text-neutral-500">(12,847 đánh giá)</span>
        </div>
        <h3 className="font-bold mb-1">React.js Toàn Tập 2026</h3>
        <p className="text-xs text-neutral-600 mb-3">Nguyễn Minh Anh • Senior @ Google</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-black">1.290.000đ</span>
            <span className="text-xs text-neutral-400 line-through ml-2">2.590.000đ</span>
          </div>
          <span className="px-2 py-1 bg-yellow-400 text-black text-xs font-bold rounded">-50%</span>
        </div>
      </div>

      <div className="absolute -top-4 -left-4 z-30 bg-yellow-400 px-4 py-2 rounded-full transform -rotate-12 shadow-lg">
        <span className="text-xs font-black flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5" />
          BESTSELLER
        </span>
      </div>

      <div className="absolute -bottom-6 left-1/2 z-30 bg-black text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-400" />
        <span className="text-xs font-bold">+45,230 học viên</span>
      </div>
    </div>
  );
}
