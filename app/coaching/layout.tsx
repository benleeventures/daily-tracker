import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ben Lee Coaching',
  description: 'Exercises, plans, and progress for Ben Lee coaching clients',
  robots: { index: false, follow: false },
};

export default function CoachingLayout({ children }: LayoutProps<'/coaching'>) {
  return children;
}
