'use client';

import { useEffect } from 'react';

// Home-screen icons saved before the move still open "/". Send them straight to Dailys.
export default function StandaloneRedirect() {
  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) window.location.replace('/dailies');
  }, []);
  return null;
}
