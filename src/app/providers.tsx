'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { PWAProvider } from '@/components/pwa/PWAProvider';

/**
 * Wrap toàn bộ app với providers cần thiết
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster position="top-center" richColors />
      <PWAProvider />
    </SessionProvider>
  );
}
