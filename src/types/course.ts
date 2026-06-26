/**
 * Type definitions cho Course domain
 * Tách riêng để tái sử dụng giữa client và server
 */

export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration: number; // giây
  order: number;
  isPreview: boolean;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
}

export interface Instructor {
  id: string;
  name: string;
  title?: string;
  image?: string;
  bio?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  description: string;
  thumbnail?: string;
  promoVideoUrl?: string;

  price: number;
  originalPrice?: number;

  level: CourseLevel;
  status: CourseStatus;
  language: string;

  whatYouLearn: string[];
  requirements: string[];
  targetAudience: string[];

  totalLectures: number;
  totalDuration: number;
  averageRating: number;
  totalReviews: number;
  totalStudents: number;

  isBestseller: boolean;
  isFeatured: boolean;

  instructor: Instructor;
  category: Category;
  sections?: Section[];

  createdAt: Date;
  publishedAt?: Date;
}

export interface CourseListItem extends Omit<Course, 'sections' | 'requirements' | 'targetAudience'> {}
