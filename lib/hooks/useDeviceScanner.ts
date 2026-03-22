// ─── Web HID & Web Serial type declarations (not shipped in TS dom lib) ──────
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  // Minimal Web HID types
  interface HIDDevice {
    opened: boolean;
    vendorId: number;
    productId: number;
    productName: string;
    open(): Promise<void>;
    close(): Promise<void>;
    addEventListener(type: 'inputreport', listener: (e: any) => void): void;
    removeEventListener(type: 'inputreport', listener: (e: any) => void): void;
  }
  interface HID {
    getDevices(): Promise<HIDDevice[]>;
    requestDevice(options: { filters: object[] }): Promise<HIDDevice[]>;
    addEventListener(type: 'disconnect', listener: (e: any) => void): void;
    removeEventListener(type: 'disconnect', listener: (e: any) => void): void;
  }
  // Minimal Web Serial types
  interface SerialPort {
    readable: ReadableStream<Uint8Array> | null;
    open(options: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
  }
  interface Serial {
    requestPort(options: { filters: object[] }): Promise<SerialPort>;
    addEventListener(type: 'disconnect', listener: (e: any) => void): void;
  }
  interface Navigator {
    hid: HID;
    serial: Serial;
  }
}

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeviceType = 'keyboard' | 'hid' | 'serial';

export type ScannerErrorCode =
  | 'ERR_DEVICE_LOCKED'
  | 'ERR_PERMISSION_DENIED'
  | 'ERR_NOT_SUPPORTED'
  | 'ERR_READ_FAILED'
  | 'ERR_NO_DEVICES_FOUND'
  | 'ERR_UNKNOWN';

export interface ScannerError {
  code: ScannerErrorCode;
  message: string;
  timestamp: number;
}

export interface ScannerDevice {
  id: string;
  name: string;
  type: DeviceType;
  connected: boolean;
  /** Milliseconds since last scan activity (keyboard-wedge only) */
  lastActivity?: number;
  /** Raw browser HIDDevice handle */
  hidDevice?: HIDDevice;
  /** Raw browser SerialPort handle */
  serialPort?: SerialPort;
  /** Explicit error state if connection or reading failed */
  error?: ScannerError;
}

interface UseDeviceScannerOptions {
  onScan: (barcode: string, deviceId: string) => void;
  /** ms between keystrokes to be treated as scanner (not manual typing). Default 80 */
  keyboardDebounceMs?: number;
  /** min barcode length to accept from keyboard wedge. Default 1 (suffix Enter/Tab or fast burst). */
  minBarcodeLength?: number;
}

interface UseDeviceScannerReturn {
  devices: ScannerDevice[];
  selectedDeviceId: string | null;
  selectDevice: (id: string) => void;
  isConnected: boolean;
  /** Open browser picker to add a Web HID device */
  requestHIDDevice: () => Promise<void>;
  /** Open browser picker to add a Web Serial device */
  requestSerialDevice: () => Promise<void>;
  /** Disconnect and remove a device from the list */
  removeDevice: (id: string) => void;
  /** Whether the current browser supports WebHID */
  hidSupported: boolean;
  /** Whether the current browser supports WebSerial */
  serialSupported: boolean;
  /** Global error state for connection attempts */
  globalError: ScannerError | null;
  /** Clear global error state */
  clearError: () => void;
}

// ─── HID report decoder ───────────────────────────────────────────────────────

/**
 * Most USB POS barcode scanners send HID reports where each byte is an ASCII
 * character. This covers standard HID Usage Page 0x8C (POS) scanners.
 * Some scanners use a 2-byte (2 bytes per char) structure; we handle both.
 */
function decodeHIDReport(data: DataView): string {
  const bytes: number[] = [];
  for (let i = 0; i < data.byteLength; i++) {
    const b = data.getUint8(i);
    if (b === 0) continue; // skip nulls / padding
    if (b >= 32 && b < 127) bytes.push(b); // printable ASCII only
  }
  return String.fromCharCode(...bytes).trim();
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

function isScanTerminatorKey(e: KeyboardEvent): boolean {
  if (e.key === 'Enter' || e.key === 'Tab') return true;
  if (e.code === 'NumpadEnter') return true;
  return false;
}

export function useDeviceScanner({
  onScan,
  keyboardDebounceMs = 80,
  minBarcodeLength = 1,
}: UseDeviceScannerOptions): UseDeviceScannerReturn {

  const KEYBOARD_DEVICE_ID = 'keyboard-wedge';

  const [devices, setDevices] = useState<ScannerDevice[]>([
    {
      id: KEYBOARD_DEVICE_ID,
      name: 'iOS / USB / Bluetooth Scanner (Default Keyboard)',
      type: 'keyboard',
      connected: true,
    },
  ]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(KEYBOARD_DEVICE_ID);

  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  // ── Keyboard wedge state ────────────────────────────────────────────────────
  const kbBufferRef = useRef('');

  const [globalError, setGlobalError] = useState<ScannerError | null>(null);

  const showError = useCallback((code: ScannerErrorCode, message: string) => {
    setGlobalError({ code, message, timestamp: Date.now() });
    // Auto-clear global error after 6 seconds
    setTimeout(() => {
      setGlobalError(prev => (prev?.timestamp === undefined ? null : prev));
    }, 6000);
  }, []);

  const clearError = useCallback(() => setGlobalError(null), []);

  const setDeviceError = useCallback((id: string, code: ScannerErrorCode, message: string) => {
    setDevices(prev =>
      prev.map(d => (d.id === id ? { ...d, connected: false, error: { code, message, timestamp: Date.now() } } : d))
    );
  }, []);

  /** Keyboard wedge stays available; lastActivity updates for "ACTIVE NOW" in the device list. */
  const markKeyboardActive = useCallback(() => {
    setDevices(prev =>
      prev.map(d => (d.id === KEYBOARD_DEVICE_ID ? { ...d, connected: true, lastActivity: Date.now() } : d))
    );
  }, []);

  /**
   * Keyboard wedge must always be honored: most USB/Bluetooth scanners only emulate a keyboard.
   * Selecting USB HID/COM in the UI must not block those keystrokes (common misconfiguration).
   */
  const flushKeyboardWedgeScan = useCallback(
    (raw: string, e?: KeyboardEvent) => {
      const barcode = raw.trim();
      if (barcode.length < minBarcodeLength) return;
      markKeyboardActive();
      kbBufferRef.current = '';
      onScanRef.current(barcode, KEYBOARD_DEVICE_ID);
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [markKeyboardActive, minBarcodeLength]
  );

  function isScannerCaptureElement(el: EventTarget | null): el is HTMLInputElement | HTMLTextAreaElement {
    if (!el || !(el instanceof HTMLElement)) return false;
    return el.getAttribute('data-scanner-input') === 'true';
  }

  // Keyboard-wedge listener — capture phase so we handle Enter before form submit / other handlers
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let idleFlushTimer: ReturnType<typeof setTimeout> | null = null;
    const bufferIdleMs = Math.max(550, keyboardDebounceMs * 7);
    /** Scanners finish a code in a short wall-clock window; slow typing should require Enter. */
    const maxBurstMs = 4500;
    const scanIdleGapMs = Math.max(85, Math.min(160, keyboardDebounceMs + 35));
    const burstStartRef = { current: 0 };

    const clearIdleFlush = () => {
      if (idleFlushTimer) {
        clearTimeout(idleFlushTimer);
        idleFlushTimer = null;
      }
    };

    const scheduleIdleFlush = () => {
      clearIdleFlush();
      idleFlushTimer = setTimeout(() => {
        idleFlushTimer = null;
        const barcode = kbBufferRef.current.trim();
        if (barcode.length < minBarcodeLength) return;
        const burstMs = Date.now() - burstStartRef.current;
        if (burstMs <= maxBurstMs) {
          flushKeyboardWedgeScan(barcode);
        } else {
          kbBufferRef.current = '';
        }
      }, scanIdleGapMs);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing) return;

      const el = document.activeElement;
      const inGenericField =
        el &&
        (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable);

      // Dedicated capture field: scanner types here; on Enter/Tab read value (keyboard wedge).
      if (inGenericField && isScannerCaptureElement(el)) {
        if (isScanTerminatorKey(e)) {
          if (debounceTimer) clearTimeout(debounceTimer);
          clearIdleFlush();
          const input = el as HTMLInputElement;
          const barcode = (input.value || '').trim();
          if (barcode.length >= minBarcodeLength) {
            flushKeyboardWedgeScan(barcode, e);
          }
        }
        return;
      }

      // Other inputs: don't steal keystrokes from manual typing
      if (inGenericField) return;

      // Scanner terminates with Enter or Tab (incl. numpad enter)
      if (isScanTerminatorKey(e)) {
        if (debounceTimer) clearTimeout(debounceTimer);
        clearIdleFlush();
        const barcode = kbBufferRef.current.trim();
        kbBufferRef.current = '';
        if (barcode.length >= minBarcodeLength) {
          flushKeyboardWedgeScan(barcode, e);
        }
        return;
      }

      // Accumulate printable characters only
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (kbBufferRef.current.length === 0) burstStartRef.current = Date.now();
        kbBufferRef.current += e.key;

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          kbBufferRef.current = '';
        }, bufferIdleMs);
        scheduleIdleFlush();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (debounceTimer) clearTimeout(debounceTimer);
      clearIdleFlush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyboardDebounceMs, minBarcodeLength, flushKeyboardWedgeScan]);

  // ── Restore previously paired HID devices on mount ──────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hid = (navigator as any).hid as typeof navigator.hid | undefined;
    if (!hid) return;

    hid.getDevices().then((existingDevices: HIDDevice[]) => {
      if (existingDevices.length === 0) return;
      const newEntries: ScannerDevice[] = existingDevices.map(d => ({
        id: `hid-${d.vendorId}-${d.productId}-${d.productName}`,
        name: d.productName || `HID Device ${d.vendorId}:${d.productId}`,
        type: 'hid' as DeviceType,
        connected: d.opened,
        hidDevice: d,
      }));

      setDevices(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const incoming = newEntries.filter(n => !existingIds.has(n.id));
        return [...prev, ...incoming];
      });

      // Auto-open and listen to previously paired devices
      existingDevices.forEach(d => openHIDDevice(d));
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── HID device helpers ──────────────────────────────────────────────────────
  const openHIDDevice = useCallback(async (device: HIDDevice) => {
    const deviceId = `hid-${device.vendorId}-${device.productId}-${device.productName}`;
    try {
      if (!device.opened) await device.open();

      const handler = (event: any) => {
        const barcode = decodeHIDReport(event.data as DataView);
        if (barcode.length >= minBarcodeLength) {
          setDevices(prev =>
            prev.map(d => d.id === deviceId ? { ...d, connected: true, lastActivity: Date.now() } : d)
          );
          onScanRef.current(barcode, deviceId);
        }
      };

      device.addEventListener('inputreport', handler);

      setDevices(prev =>
        prev.map(d => d.id === deviceId ? { ...d, connected: true } : d)
      );

      // Handle disconnection
      const disconnectHandler = (e: any) => {
        if (e.device === device) {
          setDevices(prev =>
            prev.map(d => d.id === deviceId ? { ...d, connected: false } : d)
          );
        }
      };
      (navigator as any).hid.addEventListener('disconnect', disconnectHandler);

    } catch (err: any) {
      console.warn('Failed to open HID device:', err);
      // Determine explicit reason
      let code: ScannerErrorCode = 'ERR_UNKNOWN';
      let msg = 'Failed to connect to the physical scanner.';

      const errString = String(err).toLowerCase();
      if (errString.includes('security') || errString.includes('permission')) {
        code = 'ERR_PERMISSION_DENIED';
        msg = 'Permission to access the scanner was denied by the browser or OS.';
      } else if (errString.includes('busy') || errString.includes('locked') || errString.includes('access denied')) {
        code = 'ERR_DEVICE_LOCKED';
        msg = 'The scanner is locked. Close other apps or inventory windows using it.';
      }

      setDeviceError(deviceId, code, msg);
    }
  }, [minBarcodeLength, setDeviceError]);

  const requestHIDDevice = useCallback(async () => {
    const hid = (navigator as any).hid as typeof navigator.hid | undefined;
    if (!hid) return;
    try {
      // Request any HID device — let user pick
      const selected: HIDDevice[] = await hid.requestDevice({ filters: [] });
      for (const device of selected) {
        const id = `hid-${device.vendorId}-${device.productId}-${device.productName}`;
        setDevices(prev => {
          if (prev.find(d => d.id === id)) return prev;
          return [
            ...prev,
            {
              id,
              name: device.productName || `HID ${device.vendorId.toString(16)}:${device.productId.toString(16)}`,
              type: 'hid',
              connected: false,
              hidDevice: device,
            },
          ];
        });
        await openHIDDevice(device);
        setSelectedDeviceId(id);
      }
    } catch (err: any) {
      // User cancelled picker or permission error
      if (err.name !== 'NotFoundError' && !String(err).includes('cancelled')) {
        showError('ERR_PERMISSION_DENIED', 'Could not open the device picker or permission was explicitly denied.');
      }
    }
  }, [openHIDDevice, showError]);

  // ── Serial device helpers ───────────────────────────────────────────────────
  const requestSerialDevice = useCallback(async () => {
    const serial = (navigator as any).serial as typeof navigator.serial | undefined;
    if (!serial) return;
    try {
      const port: SerialPort = await serial.requestPort({ filters: [] });
      try {
        await port.open({ baudRate: 9600 });
      } catch (err: any) {
        const errStr = String(err).toLowerCase();
        let code: ScannerErrorCode = 'ERR_UNKNOWN';
        let msg = 'Could not open the serial port.';
        if (errStr.includes('locked') || errStr.includes('busy') || errStr.includes('access denied')) {
          code = 'ERR_DEVICE_LOCKED';
          msg = 'Serial port is locked. Another terminal/app might be using it.';
        }
        showError(code, msg);
        return;
      }

      const id = `serial-${Date.now()}`;
      const reader = port.readable?.getReader();
      if (!reader) return;

      setDevices(prev => [
        ...prev,
        {
          id,
          name: 'Serial Scanner',
          type: 'serial',
          connected: true,
          serialPort: port,
        },
      ]);
      setSelectedDeviceId(id);

      // Read loop
      const decoder = new TextDecoder();
      let buffer = '';
      const readLoop = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split(/[\r\n]+/);
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              const barcode = line.trim();
              if (barcode.length >= minBarcodeLength) {
                onScanRef.current(barcode, id);
              }
            }
          }
        } catch {
          setDeviceError(id, 'ERR_READ_FAILED', 'Connection lost while reading from serial port.');
        }
      };
      readLoop();

      const disconnectHandler = (e: any) => {
        const target = e.target as unknown as SerialPort;
        if (target === port) {
          setDevices(prev => prev.map(d => d.id === id ? { ...d, connected: false } : d));
        }
      };
      (navigator as any).serial.addEventListener('disconnect', disconnectHandler);

    } catch (err: any) {
      // User cancelled picker or permission error
      if (err.name !== 'NotFoundError' && !String(err).includes('cancelled')) {
        showError('ERR_PERMISSION_DENIED', 'Could not open the serial picker or permission denied.');
      }
    }
  }, [minBarcodeLength, showError, setDeviceError]);

  // ── Remove device ───────────────────────────────────────────────────────────
  const removeDevice = useCallback((id: string) => {
    if (id === KEYBOARD_DEVICE_ID) return; // can't remove keyboard
    setDevices(prev => {
      const device = prev.find(d => d.id === id);
      if (device?.hidDevice?.opened) device.hidDevice.close().catch(() => {});
      return prev.filter(d => d.id !== id);
    });
    setSelectedDeviceId(prev => (prev === id ? KEYBOARD_DEVICE_ID : prev));
  }, []);

  // ── Derived state ───────────────────────────────────────────────────────────
  const selectedDevice = devices.find(d => d.id === selectedDeviceId);
  /** Keyboard wedge has no pairing step — treat as always ready when that source is selected. */
  const isConnected =
    selectedDevice?.type === 'keyboard' ? true : (selectedDevice?.connected ?? false);

  const hidSupported = typeof window !== 'undefined' && 'hid' in navigator;
  const serialSupported = typeof window !== 'undefined' && 'serial' in navigator;

  return {
    devices,
    selectedDeviceId,
    selectDevice: setSelectedDeviceId,
    isConnected,
    requestHIDDevice,
    requestSerialDevice,
    removeDevice,
    hidSupported,
    serialSupported,
    globalError,
    clearError,
  };
}
