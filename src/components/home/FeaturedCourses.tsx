import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CourseGrid } from '@/components/course/CourseGrid';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import type { Course } from '@/types';

interface FeaturedCoursesProps {
  courses: Course[];
}

export function FeaturedCourses({ courses }: FeaturedCoursesProps) {
  return (
    <Section className="bg-muted/40 border-y border-border">
      <Container>
        <SectionHeading
          eyebrow="Xu hướng"
          title="Khóa học nổi bật"
          subtitle="Những khóa học được học viên yêu thích và đánh giá cao nhất tuần này."
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
        <CourseGrid courses={courses} />
      </Container>
    </Section>
  );
}
