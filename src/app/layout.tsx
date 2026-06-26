import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import { SITE_CONFIG } from '@/lib/constants';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: SITE_CONFIG.name,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  // PWA
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_CONFIG.name,
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: SITE_CONFIG.name,
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  // Không dùng user-scalable=no — accessibility best practice
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;0,9..144,900;1,9..144,700;1,9..144,900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* PWA icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.svg" />
        <link rel="icon" type="image/svg+xml" href="/icons/favicon-32x32.svg" />
        <link rel="shortcut icon" href="/icons/favicon-32x32.svg" />
        {/* iOS safe area */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
