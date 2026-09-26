'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [next, setNext] = useState('/dailies');
  const router = useRouter();

  useEffect(() => {
    // Only allow same-site paths as the post-login destination
    const requested = new URLSearchParams(window.location.search).get('next');
    if (requested && requested.startsWith('/') && !requested.startsWith('//')) setNext(requested);
  }, []);

  const isCoaching = next.startsWith('/coaching');

  // Passwordless option for coaching clients. Only works for invited emails (no new sign-ups).
  const sendLink = async () => {
    setError('');
    setNotice('');
    if (!email) {
      setError('Enter your email first');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: window.location.origin + next },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setNotice('Check your email for a sign-in link.');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push(next);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={styles.logo}>
            <rect width="40" height="40" fill="none" />
            <rect width="22" height="22" x="9" y="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <rect width="14" height="14" x="13" y="13" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span style={styles.brandText}>{isCoaching ? 'Ben Lee Coaching' : 'Dailys'}</span>
        </div>

        <h1 style={styles.title}>Sign In</h1>

        <form onSubmit={handleAuth} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          {error && <div style={styles.error}>{error}</div>}
          {notice && <div style={{ ...styles.error, color: '#6f7a4f' }}>{notice}</div>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Loading...' : 'Sign In'}
          </button>
        </form>

        <button type="button" onClick={sendLink} disabled={loading} style={styles.linkButton}>
          No password? Email me a sign-in link
        </button>
      </div>
    </div>
  );
}

const styles = {
  linkButton: {
    display: 'block',
    margin: '16px auto 0',
    background: 'transparent',
    border: 'none',
    color: '#876a30',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  container: {
    minHeight: '100vh',
    background: '#faf8f3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    background: 'white',
    borderRadius: '8px',
    padding: '2rem',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '2rem',
  },
  logo: {
    width: '32px',
    height: '32px',
    color: '#c6a96c',
    flexShrink: 0,
  },
  brandText: {
    fontSize: '16px',
    fontWeight: 600 as const,
    color: '#3d3a33',
    letterSpacing: '-0.5px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600 as const,
    color: '#3d3a33',
    marginBottom: '1.5rem',
    margin: '0 0 1.5rem 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginBottom: '1.5rem',
  },
  input: {
    background: 'transparent',
    border: '0.5px solid #e8e3db',
    borderRadius: '4px',
    padding: '10px 12px',
    fontSize: '14px',
    color: '#3d3a33',
    fontFamily: 'inherit',
    outline: 'none',
  },
  error: {
    color: '#de905a',
    fontSize: '13px',
    padding: '8px 12px',
    background: 'rgba(222, 144, 90, 0.1)',
    borderRadius: '4px',
    textAlign: 'center' as const,
  },
  button: {
    padding: '10px 16px',
    background: '#876a30',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500 as const,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
