/**
 * Constants được sử dụng trên toàn ứng dụng
 */

import {
  Code, Palette, Briefcase, TrendingUp,
  Camera, Music, Globe, Layers, type LucideIcon
} from 'lucide-react';

export interface CategoryConfig {
  id: string;
  name: string;
  slug: string;
  icon: LucideIcon;
  color: string;
}

export const CATEGORIES: CategoryConfig[] = [
  { id: 'all', name: 'Tất cả', slug: 'all', icon: Layers, color: '#0a0a0a' },
  { id: 'programming', name: 'Lập trình', slug: 'programming', icon: Code, color: '#0066ff' },
  { id: 'design', name: 'Thiết kế', slug: 'design', icon: Palette, color: '#ff3366' },
  { id: 'business', name: 'Kinh doanh', slug: 'business', icon: Briefcase, color: '#10b981' },
  { id: 'marketing', name: 'Marketing', slug: 'marketing', icon: TrendingUp, color: '#f59e0b' },
  { id: 'photography', name: 'Nhiếp ảnh', slug: 'photography', icon: Camera, color: '#8b5cf6' },
  { id: 'music', name: 'Âm nhạc', slug: 'music', icon: Music, color: '#ec4899' },
  { id: 'language', name: 'Ngoại ngữ', slug: 'language', icon: Globe, color: '#06b6d4' },
];

export const GRADIENTS: Record<string, string> = {
  'gradient-blue': 'linear-gradient(135deg, #0066ff 0%, #00d4ff 100%)',
  'gradient-pink': 'linear-gradient(135deg, #ff3366 0%, #ff8a00 100%)',
  'gradient-purple': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
  'gradient-orange': 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'gradient-green': 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  'gradient-dark': 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
  'gradient-cyan': 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
  'gradient-magenta': 'linear-gradient(135deg, #d946ef 0%, #f97316 100%)',
};

export const SITE_CONFIG = {
  name: 'Lumina Academy',
  description: 'Nền tảng học trực tuyến hàng đầu Việt Nam',
  url: 'https://lumina-academy.vn',
  ogImage: '/og-image.png',
};
