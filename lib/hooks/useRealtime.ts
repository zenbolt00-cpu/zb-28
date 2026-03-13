"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * A custom hook to simulate real-time updates on Vercel without WebSockets.
 * It uses a smart polling mechanism to refresh the current Server Component
 * periodically or when the window regains focus.
 */
export function useRealtimeSync(intervalMs = 15000) {
  const router = useRouter();

  useEffect(() => {
    // Polling interval
    const intervalId = setInterval(() => {
      // router.refresh() does a soft reload of the Server Components
      // fetching the latest data from the database without losing client state.
      router.refresh();
    }, intervalMs);

    // Refresh instantly when the user comes back to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs, router]);
}
