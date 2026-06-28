import type { Metadata, Viewport } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import { Providers } from './providers';
import { Analytics } from '@/components/analytics/Analytics';
import { themeInitScript } from '@/components/theme/ThemeProvider';
import { SITE_CONFIG } from '@/lib/constants';
import './globals.css';

/**
 * Self-host font qua next/font: loại bỏ FOUT/nhảy layout, không request
 * Google ngoài (nhanh hơn + bớt rủi ro CSP). Bao gồm subset 'vietnamese'
 * để hiển thị đúng dấu tiếng Việt. Phơi ra CSS variable cho Tailwind.
 */
const fraunces = Fraunces({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  // Base để Next resolve mọi URL tương đối (OG image, canonical) thành tuyệt đối.
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? SITE_CONFIG.url),
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
    locale: 'vi_VN',
    siteName: SITE_CONFIG.name,
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    images: [{ url: SITE_CONFIG.ogImage, width: 1200, height: 630, alt: SITE_CONFIG.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    images: [SITE_CONFIG.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
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
    <html lang="vi" className={`${fraunces.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <head>
        {/* Set dark class trước paint để tránh nhấp nháy theme */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
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
        <Analytics />
      </body>
    </html>
  );
}
