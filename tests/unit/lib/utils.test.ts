/**
 * Unit tests cho src/lib/utils.ts
 *
 * Pure functions, không có DB/network → test rất nhanh và chính xác.
 */

import { describe, it, expect } from 'vitest';
import {
  cn,
  formatPrice,
  formatNumber,
  formatDuration,
  calculateDiscount,
  slugify,
  truncate,
} from '@/lib/utils';

describe('cn (Tailwind merge)', () => {
  it('merges classes', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('resolves conflicts (later wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'active')).toBe('base active');
  });

  it('handles undefined/null/false', () => {
    expect(cn('base', undefined, null, false, 'after')).toBe('base after');
  });
});

describe('formatPrice', () => {
  it('formats VND with dot separator', () => {
    expect(formatPrice(1290000)).toBe('1.290.000đ');
  });

  it('handles zero', () => {
    expect(formatPrice(0)).toBe('0đ');
  });

  it('handles small amounts', () => {
    expect(formatPrice(100)).toBe('100đ');
  });

  it('handles 1 billion+', () => {
    expect(formatPrice(1_000_000_000)).toBe('1.000.000.000đ');
  });
});

describe('formatNumber', () => {
  it('uses dot as thousands separator (vi-VN locale)', () => {
    expect(formatNumber(1247)).toBe('1.247');
    expect(formatNumber(1_000_000)).toBe('1.000.000');
  });

  it('handles zero and negatives', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(-1500)).toBe('-1.500');
  });
});

describe('formatDuration', () => {
  it('shows only minutes when under 1 hour', () => {
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(30)).toBe('0m'); // 30s = 0m, hợp lý cho course
    expect(formatDuration(60)).toBe('1m');
    expect(formatDuration(3599)).toBe('59m');
  });

  it('shows hours and minutes when >= 1 hour', () => {
    expect(formatDuration(3600)).toBe('1h 0m');
    expect(formatDuration(3660)).toBe('1h 1m');
    expect(formatDuration(7320)).toBe('2h 2m');
  });

  it('handles course-length durations', () => {
    // Một course 10 giờ
    expect(formatDuration(36_000)).toBe('10h 0m');
  });
});

describe('calculateDiscount', () => {
  it('returns 0 when no discount', () => {
    expect(calculateDiscount(100, 100)).toBe(0);
    expect(calculateDiscount(100, 150)).toBe(0); // negative discount → 0
  });

  it('rounds percentage', () => {
    expect(calculateDiscount(1000, 700)).toBe(30); // -30%
    expect(calculateDiscount(1290000, 590000)).toBe(54); // 54.26% → 54
  });

  it('handles 100% discount (free course promotion)', () => {
    expect(calculateDiscount(100, 0)).toBe(100);
  });

  it('handles zero original price (no division error)', () => {
    expect(calculateDiscount(0, 0)).toBe(0);
    expect(calculateDiscount(0, 100)).toBe(0);
  });
});

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes Vietnamese diacritics', () => {
    expect(slugify('Khóa học React')).toBe('khoa-hoc-react');
    expect(slugify('Tiếng Việt')).toBe('tieng-viet');
  });

  it('handles đ specially (NFD does not split it)', () => {
    expect(slugify('Đỗ Văn A')).toBe('do-van-a');
  });

  it('removes special chars', () => {
    expect(slugify('Hello, World! 2026')).toBe('hello-world-2026');
  });

  it('collapses multiple spaces/hyphens', () => {
    expect(slugify('a   b---c')).toBe('a-b-c');
  });

  it('handles empty/whitespace', () => {
    expect(slugify('')).toBe('');
    expect(slugify('   ')).toBe('');
  });

  it('preserves numbers', () => {
    expect(slugify('React 18 Course')).toBe('react-18-course');
  });
});

describe('truncate', () => {
  it('returns original when shorter than max', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates and adds ellipsis', () => {
    expect(truncate('hello world', 5)).toBe('hello...');
  });

  it('handles exact length (no truncation)', () => {
    expect(truncate('12345', 5)).toBe('12345');
  });

  it('handles empty string', () => {
    expect(truncate('', 10)).toBe('');
  });

  it('handles Vietnamese (counts unicode chars, not bytes)', () => {
    expect(truncate('Xin chào thế giới', 8)).toBe('Xin chào...');
  });
});
