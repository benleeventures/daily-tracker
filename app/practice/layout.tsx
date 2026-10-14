import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Practice',
  description: 'Nervous System · Week 1. A meditation course by Miguel de la Roza.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#faf8f3',
};

export default function PracticeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
