'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistState {
  items: string[]; // Course IDs
  toggle: (courseId: string) => void;
  isInWishlist: (courseId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (courseId) => {
        const items = get().items;
        if (items.includes(courseId)) {
          set({ items: items.filter((id) => id !== courseId) });
        } else {
          set({ items: [...items, courseId] });
        }
      },

      isInWishlist: (courseId) => get().items.includes(courseId),

      clear: () => set({ items: [] }),
    }),
    { name: 'lumina-wishlist' }
  )
);
