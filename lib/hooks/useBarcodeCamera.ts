'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type BarcodeDetectResult = { rawValue?: string };

/**
 * Optional camera-based barcode/QR read (Chrome/Edge: BarcodeDetector + getUserMedia).
 * Hardware scanners should still use keyboard wedge / HID / serial.
 */
export function useBarcodeCamera(onDecode: (value: string) => void) {
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onDecodeRef = useRef(onDecode);
  const lastValueRef = useRef('');
  const lastAtRef = useRef(0);

  useEffect(() => {
    onDecodeRef.current = onDecode;
  }, [onDecode]);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'BarcodeDetector' in window);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    const v = videoRef.current;
    if (v) {
      v.srcObject = null;
    }
    setActive(false);
    setError(null);
  }, []);

  const start = useCallback(async () => {
    if (!supported || typeof window === 'undefined') {
      setError('Camera barcode scanning is not supported in this browser. Use Chrome or Edge, or a USB scanner.');
      return;
    }
    stop();
    setError(null);
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      video.srcObject = stream;
      await video.play();
      setActive(true);

      const BD = (window as unknown as { BarcodeDetector: new (opts?: { formats?: string[] }) => { detect: (src: HTMLVideoElement) => Promise<BarcodeDetectResult[]> } }).BarcodeDetector;
      let formats: string[] = ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e'];
      try {
        const supportedFormats = await (
          BD as unknown as { getSupportedFormats?: () => Promise<string[]> }
        ).getSupportedFormats?.();
        if (supportedFormats?.length) formats = supportedFormats;
      } catch {
        /* use defaults */
      }
      const detector = new BD({ formats });

      intervalRef.current = setInterval(async () => {
        const v = videoRef.current;
        if (!v || v.readyState < 2) return;
        try {
          const codes = await detector.detect(v);
          const raw = codes?.[0]?.rawValue?.trim();
          if (!raw) return;
          const now = Date.now();
          if (raw === lastValueRef.current && now - lastAtRef.current < 2000) return;
          lastValueRef.current = raw;
          lastAtRef.current = now;
          onDecodeRef.current(raw);
        } catch {
          /* ignore frame errors */
        }
      }, 350);
    } catch {
      setError('Could not access the camera. Allow permission and use HTTPS.');
      setActive(false);
    }
  }, [supported, stop]);

  useEffect(() => () => stop(), [stop]);

  return { videoRef, active, supported, error, start, stop };
}
