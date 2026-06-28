'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { PWAProvider } from '@/components/pwa/PWAProvider';
import { ThemeProvider, useTheme } from '@/components/theme/ThemeProvider';

/** Toaster bám theo theme thực tế (light/dark) thay vì preference OS */
function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster position="top-center" richColors theme={resolvedTheme} />;
}

/**
 * Wrap toàn bộ app với providers cần thiết
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <ThemedToaster />
        <PWAProvider />
      </ThemeProvider>
    </SessionProvider>
  );
}
