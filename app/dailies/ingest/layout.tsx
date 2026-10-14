import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Send a note to Dailys',
  robots: { index: false, follow: false },
};

export default function DailysIngestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
