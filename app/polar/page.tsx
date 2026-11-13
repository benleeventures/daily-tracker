import { Mark, c, font, s } from '../coaching/ui';

// Link the Polar band once. The Gut access key is the gate (same key as /gut/ingest).

const MESSAGES: Record<string, string> = {
  bad_key: 'That access key was not accepted.',
  not_configured: 'Polar is not set up on the server yet (missing POLAR_CLIENT_ID, POLAR_CLIENT_SECRET or GUT_TOKEN).',
  bad_state: 'The link expired. Start again.',
  token_failed: 'Polar did not hand over a token. Start again.',
  register_failed: 'Polar would not register the account. Start again.',
  save_failed: 'Could not save the Polar link.',
  access_denied: 'Polar access was declined.',
};

export default async function PolarPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const error = q.e ? (MESSAGES[q.e] ?? `Something went wrong (${q.e}).`) : null;
  return (
    <main style={{ minHeight: '100vh', background: c.bg, color: c.ink, fontFamily: font, padding: '2rem 16px 4rem' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <Mark size={24} />
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px' }}>Polar</span>
        </div>
        <h1 style={s.h1}>Connect your Polar band</h1>
        <p style={s.body}>
          Each morning, sleep, HRV, resting heart rate, steps and workouts go into Gut Audit and Dailys. Nothing you typed
          gets overwritten.
        </p>
        {q.ok && <p style={{ ...s.body, color: '#3d6b3a', fontWeight: 600 }}>Connected. The first sync runs tomorrow morning.</p>}
        {error && <p style={{ ...s.body, color: '#a3402c', fontWeight: 600 }}>{error}</p>}
        <form method="post" action="/api/polar/connect">
          <label htmlFor="polar-key" style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
            Gut access key
          </label>
          <input id="polar-key" name="key" type="password" autoComplete="off" required style={{ ...s.input, minHeight: 44, marginBottom: 20 }} />
          <button type="submit" style={{ ...s.button, minHeight: 44 }}>Connect Polar</button>
        </form>
      </div>
    </main>
  );
}
