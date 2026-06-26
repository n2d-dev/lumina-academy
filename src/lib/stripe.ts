import Stripe from 'stripe';

/**
 * Stripe server-side client
 * Chỉ dùng ở backend (API routes, server components)
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_dummy', {
  apiVersion: '2024-06-20',
  typescript: true,
});

/**
 * Tỷ giá VND -> USD cho Stripe (Stripe không hỗ trợ VND trực tiếp ở mọi region)
 * Trong production nên dùng API tỷ giá realtime hoặc multi-currency setup
 */
export const VND_TO_USD = 25000;

export function vndToCents(vnd: number): number {
  return Math.round((vnd / VND_TO_USD) * 100);
}
