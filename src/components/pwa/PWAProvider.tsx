'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';

/**
 * PWAProvider:
 *   1. Register service worker khi app load
 *   2. Show "Add to Home Screen" banner khi điều kiện phù hợp
 *      - iOS Safari: show manual instruction (không có beforeinstallprompt)
 *      - Android Chrome: show native install prompt
 */
export function PWAProvider() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[SW] Registered:', reg.scope);
        })
        .catch((err) => {
          console.error('[SW] Registration failed:', err);
        });
    }
  }, []);

  // Capture install prompt (Android Chrome)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Chỉ show banner sau khi user tương tác ít nhất 30s
      setTimeout(() => {
        if (!sessionStorage.getItem('pwa-banner-dismissed')) {
          setShowBanner(true);
        }
      }, 30_000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    const promptEvent = installPrompt as any;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setInstallPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    sessionStorage.setItem('pwa-banner-dismissed', '1');
  };

  if (!showBanner || dismissed) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 bg-primary text-primary-foreground rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-slide-up">
      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
        <Download className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">Thêm vào màn hình chính</p>
        <p className="text-xs text-muted-foreground mt-0.5">Truy cập nhanh hơn, học mọi lúc</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 bg-card text-black text-xs font-bold rounded-full active:scale-95 transition-all touch-manipulation"
        >
          Cài đặt
        </button>
        <button
          onClick={handleDismiss}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
