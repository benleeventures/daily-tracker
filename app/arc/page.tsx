'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCoachingSession } from '../coaching/data';
import ArcApp from './components/ArcApp';

const OWNER_EMAIL = 'ben@benlee.ventures';

export default function ArcPage() {
  const router = useRouter();
  const { profile, email } = useCoachingSession();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) return;
    if (email !== OWNER_EMAIL) router.replace('/coaching');
  }, [email, router]);

  useEffect(() => {
    if (!profile?.user_id) return;

    const loadBookmarks = async () => {
      const { data, error } = await supabase
        .from('arc_bookmarks')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading bookmarks:', error);
      } else {
        setBookmarks(data || []);
      }
      setLoading(false);
    };

    loadBookmarks();

    // Subscribe to realtime updates
    const subscription = supabase
      .channel(`arc_bookmarks:${profile.user_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'arc_bookmarks',
          filter: `user_id=eq.${profile.user_id}`,
        },
        (payload: any) => {
          setBookmarks((prev) => {
            if (payload.eventType === 'INSERT') {
              return [payload.new, ...prev];
            } else if (payload.eventType === 'UPDATE') {
              return prev.map((b) => (b.id === payload.new.id ? payload.new : b));
            } else if (payload.eventType === 'DELETE') {
              return prev.filter((b) => b.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profile?.user_id]);

  if (!profile || email !== OWNER_EMAIL) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <ArcApp
      bookmarks={bookmarks}
      setBookmarks={setBookmarks}
      loading={loading}
      userId={profile.user_id}
    />
  );
}
