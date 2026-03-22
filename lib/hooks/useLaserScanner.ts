import { useState, useEffect, useRef } from 'react';

interface UseLaserScannerOptions {
  onScan: (barcode: string) => void;
  debounceTime?: number; // Time between keystrokes to consider it a scanner (ms). Usually < 50ms
  minLength?: number;    // Minimum length of a valid barcode
}

export function useLaserScanner({
  onScan,
  debounceTime = 500, // Increased to 500ms for slower Bluetooth scanners
  minLength = 4,
}: UseLaserScannerOptions) {
  const [scannedData, setScannedData] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global listener as requested - no longer ignoring inputs
      
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // If timeDiff is larger than debounce, we assume it's manual typing, not a scanner
      if (timeDiff > debounceTime) {
        bufferRef.current = '';
      }

      // Barcode scanners usually end with an 'Enter' or 'Tab' key press
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (bufferRef.current.length >= minLength) {
          const barcode = bufferRef.current;
          setScannedData(barcode);
          setIsConnected(true);
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

  return { scannedData, isConnected };
}
