'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ShareMeeting() {
  const params = useParams();
  const [meeting, setMeeting] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      if (params.shareData) {
        const decoded = JSON.parse(atob(params.shareData as string));
        setMeeting(decoded);
      }
    } catch (e) {
      setError('Invalid share link');
    }
  }, [params.shareData]);

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf8f3', color: '#3d3a33', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: '2rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '640px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '1rem' }}>Invalid share link</h1>
          <p style={{ color: '#9ca084' }}>This link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf8f3', color: '#3d3a33', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: '2rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f3', color: '#3d3a33', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={{ width: '32px', height: '32px', color: '#c6a96c' }}>
            <rect width="40" height="40" fill="none"/>
            <rect width="22" height="22" x="9" y="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            <rect width="14" height="14" x="13" y="13" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <span style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.5px' }}>Dailys</span>
        </div>

        {/* Meeting */}
        <div style={{ background: 'transparent', borderBottom: '0.5px solid #e8e3db', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
          <h1 style={{ margin: '0 0 1rem 0', fontSize: '28px', fontWeight: 600 }}>{meeting.person}</h1>

          {meeting.notes && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca084', display: 'block', marginBottom: '0.5rem' }}>Notes</label>
              <div style={{ fontSize: '15px', lineHeight: '1.6', color: '#3d3a33', whiteSpace: 'pre-wrap' }}>
                {meeting.notes}
              </div>
            </div>
          )}

          {meeting.granola_link && (
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca084', display: 'block', marginBottom: '0.5rem' }}>Meeting link</label>
              <a href={meeting.granola_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: '#c6a96c', textDecoration: 'none', wordBreak: 'break-all' }}>
                {meeting.granola_link} ↗
              </a>
            </div>
          )}
        </div>

        <p style={{ fontSize: '13px', color: '#9ca084', textAlign: 'center' }}>Shared via Dailys</p>
      </div>
    </div>
  );
}
