"use client";

import { useState } from 'react';
import {
  ScanLine,
  Package,
  ShoppingCart,
  Undo2,
  ClipboardList,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  Trash2,
} from 'lucide-react';
import { ScannerComponent } from '@/components/ScannerComponent';

type ScanMode = 'inventory_receive' | 'order_pack' | 'return_process' | 'audit';

interface ScannedItem {
  barcode: string;
  time: Date;
  mode: ScanMode;
  status: 'processing' | 'success' | 'error';
  product?: string;
  message?: string;
}

const modeConfig: Record<
  ScanMode,
  {
    label: string;
    icon: React.ComponentType<any>;
    color: string;
    bg: string;
    actionLabel: string;
  }
> = {
  inventory_receive: {
    label: 'Receive Stock',
    icon: Package,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    actionLabel: 'Receiving to Warehouse',
  },
  order_pack: {
    label: 'Pack Orders',
    icon: ShoppingCart,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    actionLabel: 'Packing for Dispatch',
  },
  return_process: {
    label: 'Process Returns',
    icon: Undo2,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    actionLabel: 'Processing Return',
  },
  audit: {
    label: 'Stock Audit',
    icon: ClipboardList,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    actionLabel: 'Auditing Stock',
  },
};

export default function DashboardScannerPage() {
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [activeTab, setActiveTab] = useState<ScanMode>('inventory_receive');
  const [hasSeenScan, setHasSeenScan] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);

  const handleScan = async (data: string) => {
    if (!hasSeenScan) {
      setHasSeenScan(true);
    }
    if (data === lastScan) return; // debounce duplicates
    setLastScan(data);
    setTimeout(() => setLastScan(null), 1500);

    const newItem: ScannedItem = {
      barcode: data,
      time: new Date(),
      mode: activeTab,
      status: 'processing',
    };

    setScannedItems((prev) => [newItem, ...prev]);

    try {
      const res = await fetch('/api/scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: data,
          mode: activeTab,
        }),
      });

      const payload = await res.json();

      if (!res.ok || !payload.success) {
        const message = payload.error || 'Scan failed';
        setScannedItems((prev) =>
          prev.map((item, idx) =>
            idx === 0
              ? {
                  ...item,
                  status: 'error',
                  message,
                }
              : item,
          ),
        );
        return;
      }

      const productTitle =
        payload.product?.title ||
        payload.product?.sku ||
        payload.product?.barcode ||
        'Matched product';
      const stock =
        payload.inventory && typeof payload.inventory.stockQuantity === 'number'
          ? `Stock: ${payload.inventory.stockQuantity}`
          : undefined;

      setScannedItems((prev) =>
        prev.map((item, idx) =>
          idx === 0
            ? {
                ...item,
                status: 'success',
                product: stock ? `${productTitle} — ${stock}` : productTitle,
                message: undefined,
              }
            : item,
        ),
      );
    } catch {
      setScannedItems((prev) =>
        prev.map((item, idx) =>
          idx === 0
            ? {
                ...item,
                status: 'error',
                message: 'Network error while processing scan',
              }
            : item,
        ),
      );
    }
  };

  const clearAll = () => setScannedItems([]);

  const config = modeConfig[activeTab];
  const Icon = config.icon;

   return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-6 mb-8 lg:mb-12 relative z-10">
        <div className="space-y-1 lg:space-y-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground uppercase tracking-tighter leading-none">
            Transmission Link
          </h1>
          <p className="text-[9px] lg:text-[10px] text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/40 font-bold uppercase tracking-[0.3em] max-w-xl">
            Real-time optical substrate analysis and synchronization.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-foreground/[0.02] border border-foreground/[0.04] rounded-lg w-fit">
          {hasSeenScan ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-rose-500" />
          )}
          <span
            className={`text-[9px] font-black uppercase tracking-widest ${
              hasSeenScan ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {hasSeenScan ? 'Relay Active' : 'Offline'}
          </span>
        </div>
      </div>

       {/* Mode Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(modeConfig) as ScanMode[]).map((mode) => {
          const m = modeConfig[mode];
          const MIcon = m.icon;
          const isActive = activeTab === mode;
          return (
            <button
              key={mode}
              onClick={() => setActiveTab(mode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-200 border ${
                isActive
                  ? 'bg-foreground text-background border-transparent shadow-lg shadow-foreground/5'
                  : 'text-foreground/50 dark:text-foreground/50 dark:text-foreground/50 dark:text-foreground/50 dark:text-foreground/30 border-foreground/[0.05] hover:text-foreground hover:bg-foreground/[0.02] bg-transparent'
              }`}
            >
              <MIcon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        {/* Scanner Component - 2/5 width */}
         <div className="lg:col-span-2 space-y-4">
          <div className="bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl p-6 shadow-sm overflow-hidden">
            <div className={`flex items-center gap-3 mb-6 px-4 py-2.5 rounded-lg border border-foreground/[0.02] ${config.bg.replace('400/10', '500/5')}`}>
              <Icon className="w-4 h-4 text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/40" />
              <div>
                <p className="text-[7px] text-foreground/40 dark:text-foreground/20 dark:text-white/10 font-black uppercase tracking-[0.2em] leading-none mb-1">
                  Active Mode
                </p>
                <p className="text-[10px] font-black text-foreground uppercase tracking-tight leading-none lowercase">{config.actionLabel}</p>
              </div>
            </div>
            <ScannerComponent onScan={handleScan} scannerType={activeTab} />
          </div>

          <div className="bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl p-4 shadow-sm">
            <p className="text-[8px] text-foreground/40 dark:text-foreground/20 dark:text-white/20 font-black uppercase tracking-[0.3em] mb-4">
              Metadata Analysis
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-foreground/[0.02] rounded-lg p-3 border border-foreground/[0.02]">
                <p className="text-xl font-black text-foreground leading-none">{scannedItems.length}</p>
                <p className="text-[8px] font-black text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20 uppercase tracking-widest mt-1.5">Total Nodes</p>
              </div>
              <div className="bg-foreground/[0.02] rounded-lg p-3 border border-foreground/[0.02]">
                <p className="text-xl font-black text-emerald-500 leading-none">
                  {scannedItems.filter((i) => i.status === 'success').length}
                </p>
                <p className="text-[8px] font-black text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20 uppercase tracking-widest mt-1.5">Processed OK</p>
              </div>
            </div>
          </div>
        </div>

        {/* Log - 3/5 width */}
         <div className="lg:col-span-3 bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl overflow-hidden flex flex-col max-h-[700px] shadow-sm">
          <div className="px-5 py-3 border-b border-foreground/[0.03] flex items-center justify-between flex-shrink-0 bg-foreground/[0.01]">
            <div className="flex items-center gap-2">
              <ScanLine className="w-3.5 h-3.5 text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20" />
              <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest">Scan Log</h3>
              <span className="ml-1 bg-foreground/5 text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/40 text-[8px] px-1.5 rounded font-black">
                {scannedItems.length}
              </span>
            </div>
            {scannedItems.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 text-[8px] font-black text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20 hover:text-rose-500 uppercase tracking-widest transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear Archives
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {scannedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-gray-600 p-8">
                <ScanLine className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium text-gray-400">No scans yet</p>
                <p className="text-xs text-gray-600 mt-1">
                  Scan or type a barcode to get started
                </p>
              </div>
            ) : (
               <ul className="divide-y divide-foreground/[0.02]">
                {scannedItems.map((item, index) => (
                  <li
                    key={index}
                    className="px-5 py-3 flex items-start justify-between gap-3 hover:bg-foreground/[0.01] transition-colors group"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div
                        className={`mt-1 flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center border border-foreground/[0.03] ${modeConfig[item.mode].bg.replace('400/10', '500/5')}`}
                      >
                        {(() => {
                          const MIcon = modeConfig[item.mode].icon;
                          return (
                            <MIcon
                              className="w-3.5 h-3.5 text-foreground/50 dark:text-foreground/50 dark:text-foreground/50 dark:text-foreground/50 dark:text-foreground/30"
                            />
                          );
                        })()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-[11px] text-foreground tracking-tight uppercase leading-none">
                          {item.barcode}
                        </p>
                        {item.product && (
                          <p className="text-[8.5px] font-black text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/40 dark:text-white/20 mt-1.5 uppercase tracking-widest">{item.product}</p>
                        )}
                        {item.message && (
                          <p className="text-[8.5px] font-black text-rose-500 mt-1.5 uppercase tracking-widest">{item.message}</p>
                        )}
                        <p className="text-[7px] font-black text-foreground/30 dark:text-foreground/30 dark:text-foreground/30 dark:text-foreground/30 dark:text-foreground/10 uppercase tracking-[0.2em] mt-2">
                          {item.time.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 mt-1">
                      {item.status === 'processing' ? (
                        <div className="h-3.5 w-3.5 rounded-full border border-foreground/10 border-t-foreground animate-spin" />
                      ) : item.status === 'success' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

