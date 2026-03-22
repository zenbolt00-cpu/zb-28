"use client";

import { useEffect, useState } from 'react';
import { useLaserScanner } from '@/lib/hooks/useLaserScanner';
import { Terminal, CheckCircle2 } from 'lucide-react';

interface ScannerComponentProps {
  onScan: (data: string) => void;
  scannerType?: 'inventory_receive' | 'order_pack' | 'return_process' | 'audit';
}

export function ScannerComponent({ onScan, scannerType = 'inventory_receive' }: ScannerComponentProps) {
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  // Keyboard wedge / USB scanner hook
  const { isConnected } = useLaserScanner({
    onScan: (data) => handleScan(data),
    minLength: 4
  });

  const handleScan = (data: string) => {
    setLastScanned(data);
    onScan(data);
    
    // Play a success beep
    const beep = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
    beep.play().catch(() => {}); // catch error if browser blocks autoplay
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 tracking-tight">
          {scannerType === 'inventory_receive' && 'Receive Inventory'}
          {scannerType === 'order_pack' && 'Pack Order'}
          {scannerType === 'return_process' && 'Process Return'}
          {scannerType === 'audit' && 'Stock Audit'}
        </h2>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
          {isConnected ? (
            <>
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Scanner Connected</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ready to Scan</span>
            </>
          )}
        </div>
      </div>

      <div className="transition-all duration-300">
        <div className="h-48 flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Terminal className="text-gray-400 mb-3" size={48} />
          <p className="text-sm font-medium text-gray-600">Waiting for scanner input...</p>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Input Layer Active</p>
        </div>
      </div>

      {lastScanned && (
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-in fade-in slide-in-from-bottom-2">
          <p className="text-sm text-emerald-800 font-medium">Last Scanned:</p>
          <p className="text-lg font-mono text-emerald-900 mt-1 break-all">{lastScanned}</p>
        </div>
      )}
    </div>
  );
}
