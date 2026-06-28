import Link from 'next/link';
import {
  Sparkles, ArrowRight, User, DollarSign, Globe, Star,
  Edit3, Video, TrendingUp, BarChart3, Users
} from 'lucide-react';

/**
 * Trang "Trở thành giảng viên" - landing page cho instructor
 */
export default function TeachPage() {
  return (
    <div className="bg-card min-h-screen">
      <HeroSection />
      <StepsSection />
      <BenefitsSection />
      <CTASection />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-black via-neutral-900 to-black text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="teach-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="#facc15" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#teach-pattern)" />
        </svg>
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-full text-xs font-bold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              CHO GIẢNG VIÊN
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-4 sm:mb-6 leading-[0.95] font-display">
              Đến lượt bạn
              <br />
              <span className="italic text-yellow-400">truyền cảm hứng</span>
            </h1>

            <p className="text-lg text-neutral-300 mb-8 max-w-lg">
              Tham gia cùng hơn 75,000 giảng viên Lumina, chia sẻ kiến thức và xây dựng thu nhập từ đam mê.
            </p>

            <Link
              href="/teach/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-yellow-400 text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-all touch-manipulation"
            >
              Tạo khóa học miễn phí
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '75K+', label: 'Giảng viên', icon: User },
              { value: '$2.5M', label: 'Trả/tháng', icon: DollarSign },
              { value: '180+', label: 'Quốc gia', icon: Globe },
              { value: '4.8★', label: 'Đánh giá', icon: Star },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 bg-white/5 backdrop-blur border border-white/10 rounded-2xl"
                >
                  <Icon className="w-6 h-6 text-yellow-400 mb-3" />
                  <div className="text-3xl font-black mb-1 font-display">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function StepsSection() {
  const steps = [
    {
      num: '01',
      icon: Edit3,
      title: 'Lập kế hoạch khóa học',
      desc: 'Quyết định chủ đề, đối tượng học viên và xây dựng outline chi tiết.',
    },
    {
      num: '02',
      icon: Video,
      title: 'Quay và chỉnh sửa video',
      desc: 'Sử dụng công cụ studio chuyên nghiệp để tạo nội dung chất lượng cao.',
    },
    {
      num: '03',
      icon: TrendingUp,
      title: 'Khởi chạy và kiếm tiền',
      desc: 'Chia sẻ với hàng triệu học viên và nhận thu nhập từ mỗi đăng ký.',
    },
  ];

  return (
    <section className="py-12 sm:py-20 max-w-[1400px] mx-auto px-4 sm:px-6">
      <div className="text-center mb-16">
        <p className="text-sm font-bold text-yellow-600 mb-2 tracking-wider">CÁCH HOẠT ĐỘNG</p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-display">
          Bắt đầu chỉ với <span className="italic">3 bước</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.num} className="relative">
              <div className="absolute -top-4 -left-4 text-9xl font-black text-yellow-100 -z-10 font-display">
                {step.num}
              </div>
              <div className="relative p-8 bg-card border-2 border-border rounded-2xl hover:border-foreground transition-all">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-yellow-400" />
                </div>
                <h3 className="text-2xl font-black mb-3 font-display">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BenefitsSection() {
  const benefits = [
    {
      icon: DollarSign,
      title: 'Thu nhập không giới hạn',
      desc: 'Nhận đến 70% mỗi đơn đăng ký. Một số giảng viên kiếm hơn $50,000/năm.',
      color: '#10b981',
    },
    {
      icon: BarChart3,
      title: 'Phân tích chi tiết',
      desc: 'Theo dõi hiệu suất khóa học, học viên và doanh thu với dashboard.',
      color: '#0066ff',
    },
    {
      icon: Users,
      title: 'Cộng đồng hỗ trợ',
      desc: 'Kết nối với cộng đồng giảng viên toàn cầu, học hỏi và phát triển.',
      color: '#ec4899',
    },
  ];

  return (
    <section className="py-12 sm:py-20 max-w-[1400px] mx-auto px-4 sm:px-6">
      <div className="grid md:grid-cols-3 gap-8">
        {benefits.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="p-8 bg-card border-2 border-border rounded-3xl">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                style={{ backgroundColor: item.color + '20' }}
              >
                <Icon className="w-7 h-7" style={{ color: item.color }} />
              </div>
              <h3 className="text-2xl font-black mb-3 font-display">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-12 sm:py-20 max-w-[1400px] mx-auto px-4 sm:px-6">
      <div className="bg-yellow-400 rounded-3xl p-12 lg:p-20 text-center relative overflow-hidden">
        <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black tracking-tight mb-4 sm:mb-6 font-display text-black">
          Sẵn sàng <span className="italic">truyền cảm hứng?</span>
        </h2>
        <p className="text-lg text-black/80 mb-8 max-w-xl mx-auto">
          Bắt đầu hành trình giảng dạy của bạn ngay hôm nay. Hoàn toàn miễn phí.
        </p>
        <Link
          href="/teach/dashboard"
          className="inline-block px-10 py-4 bg-primary text-primary-foreground font-bold rounded-full hover:scale-105 active:scale-95 transition-all touch-manipulation"
        >
          Tạo khóa học miễn phí →
        </Link>
      </div>
    </section>
  );
}
