import Link from 'next/link';
import StandaloneRedirect from './standalone-redirect';

const tools = [
  { href: '/dailies', name: 'Dailys', blurb: 'Tasks, habits, energy, meeting notes' },
  { href: '/coaching', name: 'Coaching', blurb: 'Client exercises, plans, and progress' },
  { href: '/energy-audit', name: 'Energy Audit', blurb: 'Free: find what fuels you and what drains you' },
];

export default function Home() {
  return (
    <main style={styles.page}>
      <StandaloneRedirect />
      <div style={styles.inner}>
        <header style={styles.header}>
          <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={styles.logo} aria-hidden>
            <rect width="22" height="22" x="9" y="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <rect width="14" height="14" x="13" y="13" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span style={styles.brand}>Ben Lee</span>
        </header>

        <nav>
          <ul style={styles.list}>
            {tools.map((t) => (
              <li key={t.href} style={styles.row}>
                <Link href={t.href} style={styles.link}>
                  <span style={styles.name}>{t.name}</span>
                  <span style={styles.blurb}>{t.blurb}</span>
                  <span style={styles.arrow} aria-hidden>→</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#faf8f3',
    color: '#3d3a33',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: '4rem 1rem',
  },
  inner: { maxWidth: '640px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '3rem' },
  logo: { width: '32px', height: '32px', color: '#c6a96c', flexShrink: 0 },
  brand: { fontSize: '16px', fontWeight: 600, letterSpacing: '-0.5px' },
  list: { listStyle: 'none', margin: 0, padding: 0, borderTop: '0.5px solid #e8e3db' },
  row: { borderBottom: '0.5px solid #e8e3db' },
  link: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '16px',
    padding: '18px 0',
    color: 'inherit',
    textDecoration: 'none',
  },
  name: { fontSize: '16px', fontWeight: 500, minWidth: '96px' },
  blurb: { fontSize: '14px', color: '#9ca084', flex: 1 },
  arrow: { color: '#c6a96c' },
} as const;
