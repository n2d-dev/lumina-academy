import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';
import { MOCK_COURSES } from '@/data/courses';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';

export function CategoriesSection() {
  const countByCategory = MOCK_COURSES.reduce<Record<string, number>>((acc, c) => {
    acc[c.category.slug] = (acc[c.category.slug] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="Danh mục"
          title="Bạn muốn học gì?"
          subtitle="Chọn lĩnh vực bạn quan tâm và bắt đầu hành trình học tập ngay hôm nay."
          action={
            <Link
              href="/courses"
              className="hidden md:inline-flex items-center gap-2 text-sm font-bold hover:gap-3 transition-all"
            >
              Xem tất cả
              <ArrowRight className="w-4 h-4" />
            </Link>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-5">
          {CATEGORIES.slice(1).map((cat) => {
            const Icon = cat.icon;
            const count = countByCategory[cat.slug] ?? 0;
            return (
              <Link
                key={cat.slug}
                href={`/courses?category=${cat.slug}`}
                className="group relative flex flex-col p-5 min-h-[156px] rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-elevated hover:border-foreground/15"
              >
                <span
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-auto transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: cat.color + '1a' }}
                >
                  <Icon className="w-6 h-6" style={{ color: cat.color }} />
                </span>
                <span className="mt-5 block">
                  <span className="block text-sm font-bold leading-snug">{cat.name}</span>
                  {count > 0 && (
                    <span className="block text-xs text-muted-foreground mt-1">{count} khóa học</span>
                  )}
                </span>
                <ArrowUpRight className="absolute top-5 right-5 w-4 h-4 text-muted-foreground opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300" />
              </Link>
            );
          })}
        </div>

        <div className="md:hidden mt-8 text-center">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-sm font-bold hover:gap-3 transition-all"
          >
            Xem tất cả khóa học
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Container>
    </Section>
  );
}
