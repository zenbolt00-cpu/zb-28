"use client";

import { useRef, useState, useCallback, FormEvent } from 'react';
import { useDeviceScanner, ScannerDevice } from '@/lib/hooks/useDeviceScanner';
import {
  ScanLine,
  Usb,
  Bluetooth,
  Cable,
  Keyboard,
  PlugZap,
  PlugZapIcon,
  Unplug,
  Trash2,
  CheckCircle2,
  CircleDot,
  Radio,
  TriangleAlert,
  ChevronRight,
  AlertOctagon,
  X,
  HelpCircle,
  Info
} from 'lucide-react';

interface ScannerComponentProps {
  onScan: (data: string) => void;
  scannerType?: string;
}

/** Play a short confirmation beep via Web Audio API. */
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    /* ignore if AudioContext unavailable */
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DeviceTypeIcon({ type, className }: { type: ScannerDevice['type']; className?: string }) {
  if (type === 'hid') return <Usb className={className} />;
  if (type === 'serial') return <Cable className={className} />;
  return <Keyboard className={className} />;
}

function StatusDot({ connected }: { connected: boolean }) {
  return connected ? (
    <span className="relative flex h-2 w-2 flex-shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
  ) : (
    <span className="h-2 w-2 rounded-full bg-foreground/15 flex-shrink-0" />
  );
}

function DeviceRow({
  device,
  isSelected,
  onSelect,
  onRemove,
}: {
  device: ScannerDevice;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const canRemove = device.type !== 'keyboard';
  const timeSince = device.lastActivity
    ? Math.round((Date.now() - device.lastActivity) / 1000)
    : null;

  return (
    <div
      onClick={onSelect}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200
        border group
        ${isSelected
          ? 'bg-foreground/[0.06] border-foreground/20 shadow-sm'
          : 'bg-foreground/[0.01] border-foreground/[0.05] hover:bg-foreground/[0.03] hover:border-foreground/10'}
      `}
    >
      {/* Status dot */}
      <StatusDot connected={device.connected} />

      {/* Icon */}
      <DeviceTypeIcon
        type={device.type}
        className={`w-3.5 h-3.5 flex-shrink-0 ${device.connected ? 'text-foreground/70' : 'text-foreground/25'}`}
      />

      {/* Name & meta */}
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-black uppercase tracking-tight leading-none truncate ${
          device.error ? 'text-rose-500' : isSelected ? 'text-foreground' : 'text-foreground/60'
        }`}>
          {device.name}
        </p>
        <p className={`text-[8.5px] font-bold uppercase tracking-widest mt-1 leading-none ${device.error ? 'text-rose-500/80' : 'text-foreground/30'}`}>
          {device.error
            ? device.error.code === 'ERR_DEVICE_LOCKED' ? 'Locked by another app' : 'Connection failed'
            : device.connected
            ? timeSince !== null && timeSince < 10
              ? 'Active now'
              : 'Connected'
            : device.type === 'keyboard'
              ? 'No USB scanner detected'
              : 'Disconnected'}
        </p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isSelected && (
          <span className="text-[7px] font-black text-foreground/50 bg-foreground/[0.06] px-2 py-0.5 rounded uppercase tracking-widest">
            Active
          </span>
        )}
        {canRemove && (
          <button
            onClick={e => { e.stopPropagation(); onRemove(); }}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-rose-500 text-foreground/30 transition-all"
            title="Remove device"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
        <ChevronRight className={`w-3 h-3 transition-colors ${isSelected ? 'text-foreground/50' : 'text-foreground/15'}`} />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ScannerComponent({ onScan }: ScannerComponentProps) {
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [lastDeviceId, setLastDeviceId] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleScan = useCallback(
    (data: string, deviceId: string) => {
      const trimmed = data.trim();
      if (!trimmed) return;
      setLastScanned(trimmed);
      setLastDeviceId(deviceId);
      onScan(trimmed);
      playBeep();
    },
    [onScan],
  );

  const {
    devices,
    selectedDeviceId,
    selectDevice,
    isConnected,
    requestHIDDevice,
    requestSerialDevice,
    removeDevice,
    hidSupported,
    serialSupported,
    globalError,
    clearError,
  } = useDeviceScanner({ onScan: handleScan });

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = manualInput.trim();
    if (!trimmed) return;
    handleScan(trimmed, 'manual');
    setManualInput('');
    inputRef.current?.focus();
  };

  const connectedCount = devices.filter(d => d.connected).length;

  return (
    <div className="w-full space-y-5">

      {/* ── Global Error Banner ────────────────────────────────────────────── */}
      {globalError && (
        <div className="animate-in slide-in-from-top-2 fade-in relative flex items-start gap-3 p-3.5 bg-rose-500/[0.05] border border-rose-500/20 rounded-xl">
          <AlertOctagon className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none mb-1">
              Connection Error
            </h4>
            <p className="text-[11px] font-medium text-rose-500/80 leading-snug">
              {globalError.message}
            </p>
            {globalError.code === 'ERR_DEVICE_LOCKED' && (
              <p className="text-[10px] font-medium text-rose-500/60 mt-1.5">
                Tip: If the scanner is in "Keyboard Mode", you don't need to click Add USB—just scan directly!
              </p>
            )}
          </div>
          <button onClick={clearError} className="p-1 hover:bg-rose-500/10 rounded-md text-rose-500/50 hover:text-rose-500 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Devices panel ──────────────────────────────────────────────────── */}
      <div className="bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/[0.04]">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-foreground/40" />
            <span className="text-[9px] font-black text-foreground/60 uppercase tracking-widest">
              Input Devices
            </span>
            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${
              connectedCount > 0
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-foreground/[0.05] text-foreground/30'
            }`}>
              {connectedCount} connected
            </span>
          </div>

          {/* Add device buttons */}
          <div className="flex items-center gap-1.5">
            {hidSupported && (
              <button
                onClick={requestHIDDevice}
                title="Add USB/HID scanner"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-foreground/[0.04] hover:bg-foreground/[0.07] border border-foreground/[0.06] rounded-lg text-[8px] font-black text-foreground/60 hover:text-foreground uppercase tracking-widest transition-all duration-150"
              >
                <Usb className="w-3 h-3" />
                Add USB
              </button>
            )}
            {serialSupported && (
              <button
                onClick={requestSerialDevice}
                title="Add serial scanner"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-foreground/[0.04] hover:bg-foreground/[0.07] border border-foreground/[0.06] rounded-lg text-[8px] font-black text-foreground/60 hover:text-foreground uppercase tracking-widest transition-all duration-150"
              >
                <Cable className="w-3 h-3" />
                Add Serial
              </button>
            )}
          </div>
        </div>

        {/* Device list */}
        <div className="p-3 space-y-1.5">
          {devices.map(device => (
            <DeviceRow
              key={device.id}
              device={device}
              isSelected={selectedDeviceId === device.id}
              onSelect={() => selectDevice(device.id)}
              onRemove={() => removeDevice(device.id)}
            />
          ))}
        </div>

        {/* No-WebHID notice (Firefox etc.) */}
        {!hidSupported && !serialSupported && (
          <div className="px-4 pb-3 flex items-start gap-2">
            <TriangleAlert className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-[8px] font-bold text-foreground/40 uppercase tracking-wider leading-relaxed">
              USB device pairing requires Chrome or Edge. Use keyboard mode or manual entry below.
            </p>
          </div>
        )}

        {/* Troubleshooting Guide Toggle */}
        <div className="border-t border-foreground/[0.04] bg-foreground/[0.01]">
          <button
            onClick={() => setShowTroubleshooting(!showTroubleshooting)}
            className="w-full flex items-center justify-center gap-1.5 py-2 hover:bg-foreground/[0.02] transition-colors"
          >
            <HelpCircle className="w-3 h-3 text-foreground/30" />
            <span className="text-[9px] font-black text-foreground/40 uppercase tracking-widest">
              Connection Help
            </span>
          </button>
          
          {showTroubleshooting && (
            <div className="p-4 pt-2 space-y-3 animate-in fade-in slide-in-from-top-1">
              <div className="flex gap-2.5">
                <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-black text-foreground uppercase tracking-wider mb-1">Scanner is connected but not working?</h4>
                  <p className="text-[10px] text-foreground/60 leading-relaxed">Most basic USB scanners act like keyboards. You don't need to click "Add USB" for these. Just select the <span className="font-bold text-foreground">Keyboard Mode</span> row above, make sure your cursor isn't in a text box, and scan a barcode.</p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-black text-foreground uppercase tracking-wider mb-1">Getting a "Device Locked" error?</h4>
                  <p className="text-[10px] text-foreground/60 leading-relaxed">If you try to "Add USB" and get a locked error, it means your scanner is exclusively in "Keyboard Wedge" mode. The browser cannot claim it via raw USB. Simply rely on the Keyboard Mode instead.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Active scan area ────────────────────────────────────────────────── */}
      <div className={`relative h-32 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-500 ${
        isConnected
          ? 'border-emerald-500/30 bg-emerald-500/[0.03]'
          : 'border-foreground/[0.07] bg-foreground/[0.01]'
      }`}>
        <ScanLine
          className={`mb-2 transition-all duration-300 ${
            isConnected ? 'text-emerald-500 scale-110' : 'text-foreground/15'
          }`}
          size={30}
        />
        <p className={`text-[9.5px] font-black uppercase tracking-[0.2em] transition-colors ${
          isConnected ? 'text-emerald-500' : 'text-foreground/25'
        }`}>
          {isConnected ? 'Reading scan…' : 'Select & connect a device above'}
        </p>

        {lastScanned && (
          <div className="mt-2.5 flex items-center gap-2 bg-foreground/[0.04] border border-foreground/[0.06] px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
            <p className="text-[10px] font-mono text-foreground/70">{lastScanned}</p>
          </div>
        )}
      </div>

      {/* ── Manual entry fallback ───────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 px-0.5">
          <Keyboard className="w-3 h-3 text-foreground/25" />
          <span className="text-[8px] font-black text-foreground/30 uppercase tracking-[0.25em]">
            Manual Entry
          </span>
        </div>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            placeholder="Type or paste barcode / SKU…"
            className="flex-1 bg-foreground/[0.03] border border-foreground/[0.07] rounded-lg px-3 py-2 text-[11px] font-medium text-foreground placeholder:text-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:border-foreground/20 transition-all"
          />
          <button
            type="submit"
            disabled={!manualInput.trim()}
            className="px-4 py-2 bg-foreground text-background text-[9px] font-black uppercase tracking-widest rounded-lg transition-all duration-200 hover:opacity-80 disabled:opacity-20 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </form>
      </div>

    </div>
  );
}
