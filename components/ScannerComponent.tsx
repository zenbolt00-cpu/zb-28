"use client";

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useLaserScanner } from '@/lib/hooks/useLaserScanner';
import { Camera, Terminal } from 'lucide-react';

interface ScannerComponentProps {
  onScan: (data: string) => void;
  scannerType?: 'inventory_receive' | 'order_pack' | 'return_process' | 'audit';
}

export function ScannerComponent({ onScan, scannerType = 'inventory_receive' }: ScannerComponentProps) {
  const [useCamera, setUseCamera] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Keyboard wedge / USB scanner hook
  useLaserScanner({
    onScan: (data) => handleScan(data, 'laser'),
    minLength: 5
  });

  const handleScan = (data: string, source: 'laser' | 'camera') => {
    setLastScanned(data);
    onScan(data);
    
    // Play a success beep for laser if you want, but camera usually has its own
    if (source === 'laser') {
      const beep = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
      beep.play().catch(() => {}); // catch error if browser blocks autoplay
    }
  };

  useEffect(() => {
    if (useCamera) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scannerRef.current.render(
        (decodedText) => handleScan(decodedText, 'camera'),
        () => {
          // ignore normal errors like "No QR found" to avoid log noise
        }
      );
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch((clearError) => {
            // eslint-disable-next-line no-console
            console.error(clearError);
          });
      }
    };
  }, [useCamera]);

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 tracking-tight">
          {scannerType === 'inventory_receive' && 'Receive Inventory'}
          {scannerType === 'order_pack' && 'Pack Order'}
          {scannerType === 'return_process' && 'Process Return'}
          {scannerType === 'audit' && 'Stock Audit'}
        </h2>
        
        <button
          onClick={() => setUseCamera(!useCamera)}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-600 focus:outline-none focus:ring-2 focus:ring-black"
          title={useCamera ? "Switch to Laser Scanner" : "Switch to Camera"}
        >
          {useCamera ? <Terminal size={20} /> : <Camera size={20} />}
        </button>
      </div>

      <div className="transition-all duration-300">
        {useCamera ? (
          <div className="overflow-hidden rounded-xl bg-black/5">
            <div id="qr-reader" className="w-full"></div>
            <p className="text-xs text-center text-gray-500 mt-2 pb-2">Align barcode within the frame</p>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <Terminal className="text-gray-400 mb-3" size={48} />
            <p className="text-sm font-medium text-gray-600">Waiting for scanner input...</p>
            <p className="text-xs text-gray-400 mt-1">Make sure you are not focused inside an input field</p>
          </div>
        )}
      </div>

      {lastScanned && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl animate-in fade-in slide-in-from-bottom-2">
          <p className="text-sm text-green-800 font-medium">Last Scanned:</p>
          <p className="text-lg font-mono text-green-900 mt-1 break-all">{lastScanned}</p>
        </div>
      )}
    </div>
  );
}
