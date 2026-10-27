import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'WhatsApp Brief',
  description: 'Who to get back to',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#faf8f3' };

export default function WhatsAppLayout({ children }: LayoutProps<'/whatsapp'>) {
  return children;
}
