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
}

interface UseDeviceScannerOptions {
  onScan: (barcode: string, deviceId: string) => void;
  /** ms between keystrokes to be treated as scanner (not manual typing). Default 80 */
  keyboardDebounceMs?: number;
  /** min barcode length to accept from keyboard wedge. Default 4 */
  minBarcodeLength?: number;
  /** how long to show keyboard device as "connected" after last scan. Default 3000 */
  keyboardActivityTimeoutMs?: number;
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

export function useDeviceScanner({
  onScan,
  keyboardDebounceMs = 80,
  minBarcodeLength = 4,
  keyboardActivityTimeoutMs = 3000,
}: UseDeviceScannerOptions): UseDeviceScannerReturn {

  const KEYBOARD_DEVICE_ID = 'keyboard-wedge';

  const [devices, setDevices] = useState<ScannerDevice[]>([
    {
      id: KEYBOARD_DEVICE_ID,
      name: 'USB / Bluetooth Scanner (Keyboard Mode)',
      type: 'keyboard',
      connected: false,
    },
  ]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(KEYBOARD_DEVICE_ID);

  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  // ── Keyboard wedge state ────────────────────────────────────────────────────
  const kbBufferRef = useRef('');
  const kbLastKeyTimeRef = useRef(0);
  const kbActivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markKeyboardActive = useCallback(() => {
    setDevices(prev =>
      prev.map(d => d.id === KEYBOARD_DEVICE_ID ? { ...d, connected: true, lastActivity: Date.now() } : d)
    );
    if (kbActivityTimerRef.current) clearTimeout(kbActivityTimerRef.current);
    kbActivityTimerRef.current = setTimeout(() => {
      setDevices(prev =>
        prev.map(d => d.id === KEYBOARD_DEVICE_ID ? { ...d, connected: false } : d)
      );
    }, keyboardActivityTimeoutMs);
  }, [keyboardActivityTimeoutMs]);

  // Keyboard-wedge listener — always active regardless of selected device
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const diff = now - kbLastKeyTimeRef.current;
      kbLastKeyTimeRef.current = now;

      if (diff > keyboardDebounceMs && kbBufferRef.current.length > 0) {
        kbBufferRef.current = '';
      }

      if (e.key === 'Enter' || e.key === 'Tab') {
        const barcode = kbBufferRef.current.trim();
        kbBufferRef.current = '';
        if (barcode.length >= minBarcodeLength) {
          markKeyboardActive();
          // Only fire onScan if keyboard device is the selected one
          setSelectedDeviceId(current => {
            if (current === KEYBOARD_DEVICE_ID || current === null) {
              onScanRef.current(barcode, KEYBOARD_DEVICE_ID);
            }
            return current;
          });
          e.preventDefault();
        }
        return;
      }

      if (e.key.length === 1) {
        kbBufferRef.current += e.key;
        // If this came in fast (scanner speed), track activity
        if (diff < keyboardDebounceMs || kbBufferRef.current.length === 1) {
          // Could be scanner - don't mark active yet, wait for Enter
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (kbActivityTimerRef.current) clearTimeout(kbActivityTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyboardDebounceMs, minBarcodeLength, markKeyboardActive]);

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
          setSelectedDeviceId(current => {
            if (current === deviceId) {
              onScanRef.current(barcode, deviceId);
            }
            return current;
          });
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

    } catch (err) {
      console.warn('Failed to open HID device:', err);
      setDevices(prev =>
        prev.map(d => d.id === deviceId ? { ...d, connected: false } : d)
      );
    }
  }, [minBarcodeLength]);

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
    } catch {
      // User cancelled picker — ignore
    }
  }, [openHIDDevice]);

  // ── Serial device helpers ───────────────────────────────────────────────────
  const requestSerialDevice = useCallback(async () => {
    const serial = (navigator as any).serial as typeof navigator.serial | undefined;
    if (!serial) return;
    try {
      const port: SerialPort = await serial.requestPort({ filters: [] });
      await port.open({ baudRate: 9600 });

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
                setSelectedDeviceId(current => {
                  if (current === id) onScanRef.current(barcode, id);
                  return current;
                });
              }
            }
          }
        } catch {
          setDevices(prev => prev.map(d => d.id === id ? { ...d, connected: false } : d));
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

    } catch {
      // User cancelled picker — ignore
    }
  }, [minBarcodeLength]);

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
  const isConnected = selectedDevice?.connected ?? false;

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
  };
}
