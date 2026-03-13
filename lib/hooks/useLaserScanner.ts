import { useState, useEffect, useRef } from 'react';

interface UseLaserScannerOptions {
  onScan: (barcode: string) => void;
  debounceTime?: number; // Time between keystrokes to consider it a scanner (ms). Usually < 50ms
  minLength?: number;    // Minimum length of a valid barcode
}

export function useLaserScanner({
  onScan,
  debounceTime = 50,
  minLength = 4,
}: UseLaserScannerOptions) {
  const [scannedData, setScannedData] = useState<string>('');
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field natively
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // If timeDiff is larger than debounce, we assume it's manual typing, not a scanner
      if (timeDiff > debounceTime) {
        bufferRef.current = '';
      }

      // Barcode scanners usually end with an 'Enter' key press
      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minLength) {
          const barcode = bufferRef.current;
          setScannedData(barcode);
          onScan(barcode);
          e.preventDefault(); // Prevent accidental form submissions
        }
        bufferRef.current = '';
        return;
      }

      // Append printable characters to the buffer
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, debounceTime, minLength]);

  return { scannedData };
}
