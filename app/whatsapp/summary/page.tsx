'use client';

import { useState, type FormEvent } from 'react';
import { Mark, c, font, s } from '../../coaching/ui';

// A plain form for Instinct, whose password vault can fill a form field but can't set request headers.
// The read key is the gate; it's sent as a bearer token to /api/whatsapp/summary. Nothing is stored.

export default function SummaryForm() {
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setText('');
    setError('');
    try {
      const res = await fetch('/api/whatsapp/summary', { method: 'POST', headers: { Authorization: `Bearer ${key.trim()}` } });
      const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
      if (data.text) setText(data.text);
      else setError(res.status === 401 ? 'That access key was not accepted.' : `Couldn't get the brief (${data.error ?? res.status}).`);
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: c.bg, color: c.ink, fontFamily: font, padding: '2rem 16px 4rem' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <Mark size={24} />
        <h1 style={s.h1}>WhatsApp brief summary</h1>
        <p style={s.body}>Enter the access key and press Get summary. Copy the text that appears and send it as-is.</p>
        <form onSubmit={submit}>
          <label htmlFor="wa-key" style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Access key</label>
          <input id="wa-key" name="key" type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} required style={{ ...s.input, minHeight: 44, marginBottom: 16 }} />
          <button type="submit" disabled={busy} style={s.button}>{busy ? 'Getting…' : 'Get summary'}</button>
        </form>
        {error && <p role="alert" style={{ ...s.body, color: c.alert, marginTop: 20 }}>{error}</p>}
        {text && (
          <pre id="summary" style={{ ...s.body, fontFamily: font, whiteSpace: 'pre-wrap', background: c.paper, border: `0.5px solid ${c.line}`, borderRadius: 6, padding: 14, marginTop: 20 }}>
            {text}
          </pre>
        )}
      </div>
    </main>
  );
}
