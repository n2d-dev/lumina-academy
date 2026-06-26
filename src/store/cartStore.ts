'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Course } from '@/types';

interface CartState {
  items: Course[];
  addItem: (course: Course) => void;
  removeItem: (courseId: string) => void;
  clearCart: () => void;
  isInCart: (courseId: string) => boolean;
  getTotal: () => number;
  getOriginalTotal: () => number;
}

/**
 * Cart store với persist middleware
 * Tự động lưu vào localStorage để giỏ hàng không mất khi refresh
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (course) => {
        const items = get().items;
        if (items.find((c) => c.id === course.id)) return;
        set({ items: [...items, course] });
      },

      removeItem: (courseId) => {
        set({ items: get().items.filter((c) => c.id !== courseId) });
      },

      clearCart: () => set({ items: [] }),

      isInCart: (courseId) => {
        return get().items.some((c) => c.id === courseId);
      },

      getTotal: () => {
        return get().items.reduce((sum, c) => sum + c.price, 0);
      },

      getOriginalTotal: () => {
        return get().items.reduce((sum, c) => sum + (c.originalPrice ?? c.price), 0);
      },
    }),
    { name: 'lumina-cart' }
  )
);
