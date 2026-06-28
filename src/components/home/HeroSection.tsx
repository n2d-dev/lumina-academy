import Link from 'next/link';
import { ArrowRight, Flame, Play, Star, Trophy, CheckCircle2, Users } from 'lucide-react';
import { GRADIENTS } from '@/lib/constants';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

const STATS = [
  { value: '2M+', label: 'Học viên' },
  { value: '15K+', label: 'Khóa học' },
  { value: '4.8★', label: 'Đánh giá' },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Nền + signature "ánh sáng Lumina" */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-accent/[0.07] via-background to-background" />
      <div className="absolute -top-40 right-[-10%] -z-10 h-[520px] w-[520px] glow-amber rounded-full blur-2xl" />
      <div className="absolute inset-0 -z-10 opacity-[0.4] text-foreground [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]">
        <svg width="100%" height="100%">
          <pattern id="hero-dots" width="44" height="44" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.18" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#hero-dots)" />
        </svg>
      </div>

      <Container className="py-14 sm:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — thesis */}
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-accent text-accent-foreground rounded-full text-xs font-bold tracking-wide shadow-soft mb-7">
              <Flame className="w-3.5 h-3.5" />
              ƯU ĐÃI 50% CHO NGƯỜI MỚI
            </div>

            <h1 className="font-display text-[2.75rem] sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight mb-6">
              Học bất cứ điều gì,
              <br />
              <span className="italic">trở thành</span>{' '}
              <span className="relative inline-block">
                bất cứ ai
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  height="14"
                  viewBox="0 0 300 14"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M4 9 Q150 1 296 9"
                    stroke="hsl(var(--accent))"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed mb-8">
              Hơn <strong className="text-foreground font-semibold">15.000+ khóa học</strong> chất
              lượng cao từ những chuyên gia hàng đầu. Học mọi lúc, mọi nơi, theo nhịp độ của riêng bạn.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link href="/courses">
                <Button size="lg" className="w-full sm:w-auto">
                  Khám phá khóa học
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/teach">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Trở thành giảng viên
                </Button>
              </Link>
            </div>

            <dl className="flex items-center gap-6 sm:gap-10">
              {STATS.map((s, i) => (
                <div key={s.label} className="flex items-center gap-6 sm:gap-10">
                  {i > 0 && <span className="h-9 w-px bg-border" aria-hidden />}
                  <div>
                    <dd className="font-display text-2xl sm:text-3xl font-black">{s.value}</dd>
                    <dt className="text-xs text-muted-foreground font-medium">{s.label}</dt>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          {/* Right — feature showcase */}
          <div className="relative hidden lg:block">
            <FeatureCard />
          </div>
        </div>
      </Container>
    </section>
  );
}

function FeatureCard() {
  return (
    <div className="relative">
      <div className="relative z-20 bg-card border border-border rounded-3xl shadow-elevated p-6 rotate-1 hover:rotate-0 transition-transform duration-500">
        <div
          className="aspect-video rounded-2xl mb-5 relative overflow-hidden"
          style={{ background: GRADIENTS['gradient-blue'] }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Play className="w-7 h-7 text-black ml-1" fill="currentColor" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
          <span className="font-bold text-sm">4.9</span>
          <span className="text-xs text-muted-foreground">(12.847 đánh giá)</span>
        </div>
        <h3 className="font-bold text-lg mb-1">React.js Toàn Tập 2026</h3>
        <p className="text-sm text-muted-foreground mb-4">Nguyễn Minh Anh • Senior @ Google</p>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-black">1.290.000đ</span>
            <span className="text-sm text-muted-foreground line-through">2.590.000đ</span>
          </div>
          <span className="px-2.5 py-1 bg-accent text-accent-foreground text-xs font-black rounded-lg">
            -50%
          </span>
        </div>
      </div>

      <div className="absolute -top-4 -left-4 z-30 bg-accent text-accent-foreground px-4 py-2 rounded-full -rotate-12 shadow-soft">
        <span className="text-xs font-black flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5" />
          BESTSELLER
        </span>
      </div>

      <div className="absolute -bottom-5 right-6 z-30 bg-primary text-primary-foreground px-4 py-3 rounded-2xl shadow-elevated flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-400" />
        <span className="text-xs font-bold">+45.230 học viên</span>
      </div>

      <div className="absolute -bottom-8 -left-6 z-10 bg-card border border-border px-4 py-3 rounded-2xl shadow-soft flex items-center gap-2.5 rotate-[-4deg]">
        <Users className="w-4 h-4 text-accent-foreground bg-accent rounded-full p-0.5 box-content" />
        <span className="text-xs font-bold">Cộng đồng năng động</span>
      </div>
    </div>
  );
}
