import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLaserScannerOptions {
  onScan: (barcode: string) => void;
  debounceTime?: number; // Max ms between keystrokes to be treated as scanner input
  minLength?: number;    // Minimum barcode length to accept
  activityTimeoutMs?: number; // How long after last scan to stay "connected"
}

/**
 * Detects keyboard-wedge / USB barcode scanner input.
 *
 * Key design decisions:
 * - Uses a ref for the onScan callback so the event listener is NEVER
 *   torn down/re-added when the parent re-renders (stable listener).
 * - isConnected = true while scanner activity is recent (within activityTimeoutMs).
 *   It resets to false after inactivity so the UI reflects the real state.
 */
export function useLaserScanner({
  onScan,
  debounceTime = 80,          // USB scanners send chars in <50ms; Bluetooth ~80ms
  minLength = 4,
  activityTimeoutMs = 3000,   // Show "connected" for 3s after last scan
}: UseLaserScannerOptions) {
  const [scannedData, setScannedData] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  // Keep onScan in a ref so the event listener never needs to be re-registered
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const activityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markActive = useCallback(() => {
    setIsConnected(true);
    if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    activityTimerRef.current = setTimeout(() => {
      setIsConnected(false);
    }, activityTimeoutMs);
  }, [activityTimeoutMs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // If gap between keystrokes is too large, this is manual typing — reset buffer
      if (timeDiff > debounceTime && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      // Scanner terminates with Enter or Tab
      if (e.key === 'Enter' || e.key === 'Tab') {
        const barcode = bufferRef.current.trim();
        bufferRef.current = '';

        if (barcode.length >= minLength) {
          setScannedData(barcode);
          markActive();
          onScanRef.current(barcode);
          e.preventDefault(); // prevent accidental form submissions
        }
        return;
      }

      // Accumulate printable characters only
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    };
    // Intentionally NOT including onScan — we use the ref instead
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounceTime, minLength, markActive]);

  return { scannedData, isConnected };
}
