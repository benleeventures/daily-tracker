import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Energy Audit — Ben Lee',
  description: 'Find what fuels you, what drains you, and what you’re tolerating. The free tool Ben Lee has every coaching client start with.',
  openGraph: {
    title: 'Energy Audit — Ben Lee',
    description: 'Find what fuels you, what drains you, and what you’re tolerating.',
  },
};

export default function EnergyAuditLayout({ children }: LayoutProps<'/energy-audit'>) {
  return children;
}
