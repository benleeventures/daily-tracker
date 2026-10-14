'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { Mark, c, font, s } from '../../coaching/ui';

// A plain form for tools that can fill a web page but can't set request headers (Instinct's password vault
// can only fill a form field). It has no login: the access key is the gate, and it is sent as a bearer
// token to /api/dailies/import, which checks it. Nothing is stored in the browser.

type Result = { kind: 'ok' | 'error'; text: string };

const label: CSSProperties = { display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 };

export default function DailiesIngestForm() {
  const [key, setKey] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/dailies/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key.trim()}`, 'Content-Type': 'text/markdown' },
        body: note,
      });
      const data = (await res.json().catch(() => ({}))) as { status?: string; error?: string; message?: string };
      if (data.status === 'imported') {
        setResult({ kind: 'ok', text: `Imported. ${data.message ?? ''}` });
        setNote('');
      } else if (data.status === 'duplicate') {
        setResult({ kind: 'ok', text: `Already imported. ${data.message ?? 'Nothing changed.'}` });
        setNote('');
      } else if (res.status === 401) {
        setResult({ kind: 'error', text: 'That access key was not accepted.' });
      } else if (res.status === 429) {
        setResult({ kind: 'error', text: 'Too many wrong tries. Wait a bit and try again.' });
      } else {
        setResult({ kind: 'error', text: data.message || `Not imported (${data.error ?? res.status}).` });
      }
    } catch {
      setResult({ kind: 'error', text: "Couldn't reach the server. Try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: c.bg, color: c.ink, fontFamily: font, padding: '2rem 16px 4rem' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <Mark size={24} />
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px' }}>Dailys</span>
        </div>
        <h1 style={s.h1}>Send a daily note</h1>
        <p style={s.body}>Paste the day’s note, enter the access key, and send. Sending the same note twice is safe, and nothing already in Dailys is overwritten.</p>

        <form onSubmit={submit}>
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="dailies-key" style={label}>Access key</label>
            <input
              id="dailies-key"
              name="key"
              type="password"
              autoComplete="off"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
              style={{ ...s.input, minHeight: 44 }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="dailies-note" style={label}>Day note</label>
            <textarea
              id="dailies-note"
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
              rows={12}
              placeholder={'# 2026-10-14\n\n## Day\nenergy: 4\nhabits: meditate, write\nreflection: Good build day.\n\n## Tasks\n- [ ] Send Anya the workbook link\n\n## Meetings\n### Anya\nnotes: Weekly check-in.\n- [ ] Follow up on GoHighLevel'}
              style={{ ...s.input, resize: 'vertical', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 14 }}
            />
          </div>
          <button type="submit" disabled={busy} style={{ ...s.button, minHeight: 48, width: '100%', opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Sending…' : 'Send note'}
          </button>
        </form>

        <div role="status" aria-live="polite" style={{ marginTop: 18, minHeight: 24, fontSize: 15, lineHeight: 1.5, color: result?.kind === 'error' ? c.alert : c.ink }}>
          {result?.text}
        </div>
      </div>
    </main>
  );
}
