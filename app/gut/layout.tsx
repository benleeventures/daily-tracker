import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Gut Audit',
  description: 'A private 60-day gut log',
  robots: { index: false, follow: false },
  manifest: '/gut-manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Gut Audit' },
};

// viewport-fit=cover lets the bottom tab bar sit under the iPhone home indicator via safe-area insets
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#faf8f3',
};

export default function GutLayout({ children }: LayoutProps<'/gut'>) {
  return children;
}
