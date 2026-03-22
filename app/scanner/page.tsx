"use client";

import { useState } from 'react';
import { ScanLine, Package, ShoppingCart, Undo2, ArrowLeftRight, RotateCcw, ClipboardList, CheckCircle, XCircle, Wifi, WifiOff, Trash2 } from 'lucide-react';
import { ScannerComponent } from '@/components/ScannerComponent';

type ScanMode = 'stock_in' | 'order_out' | 'return_process' | 'exchange' | 'rto' | 'audit';

interface ScannedItem {
  barcode: string;
  time: Date;
  mode: ScanMode;
  status: 'processing' | 'success' | 'error';
  product?: string;
  message?: string;
}

interface PendingScan {
  barcode: string;
  productTitle: string;
  sku: string;
  stock: number;
  mode: ScanMode;
}

const modeConfig: Record<ScanMode, { label: string; icon: React.ComponentType<any>; color: string; bg: string; actionLabel: string }> = {
  stock_in: {
    label: 'Stock In',
    icon: Package,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    actionLabel: 'Receiving to Warehouse',
  },
  order_out: {
    label: 'Order Out',
    icon: ShoppingCart,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    actionLabel: 'Packing for Dispatch',
  },
  return_process: {
    label: 'Returns',
    icon: Undo2,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    actionLabel: 'Processing Return',
  },
  exchange: {
    label: 'Exchange',
    icon: ArrowLeftRight,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    actionLabel: 'Processing Exchange',
  },
  rto: {
    label: 'RTO',
    icon: RotateCcw,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    actionLabel: 'Return to Origin',
  },
  audit: {
    label: 'Audit',
    icon: ClipboardList,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    actionLabel: 'Auditing Stock',
  },
};

export default function ScannerPage() {
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [activeTab, setActiveTab] = useState<ScanMode>('stock_in');
  const [isConnected, setIsConnected] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);

  const [pendingScan, setPendingScan] = useState<PendingScan | null>(null);
  const [quantityInput, setQuantityInput] = useState<string>('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScan = async (data: string) => {
    if (data === lastScan) return;
    setLastScan(data);
    setTimeout(() => setLastScan(null), 1500);

    // Initial item placeholder
    const newItem: ScannedItem = {
      barcode: data,
      time: new Date(),
      mode: activeTab,
      status: 'processing',
    };

    setScannedItems((prev) => [newItem, ...prev]);

    try {
      // 1. Audit mode first to fetch info without actually pushing inventory to Shopify
      const res = await fetch('/api/scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: data,
          mode: 'audit',
        }),
      });

      const payload = await res.json();

      if (!res.ok || !payload.success) {
        const message = payload.error || 'Scan failed';
        setScannedItems((prev) =>
          prev.map((item, idx) =>
            idx === 0 ? { ...item, status: 'error', message } : item,
          ),
        );
        return;
      }

      // 2. We successfully got product info. Transition the log item to waiting and show the modal
      setScannedItems((prev) =>
        prev.map((item, idx) =>
          idx === 0 ? { ...item, status: 'processing', message: 'Waiting for quantity input...' } : item,
        ),
      );

      setPendingScan({
        barcode: data,
        productTitle: payload.product?.title || payload.product?.sku || 'Matched Product',
        sku: payload.product?.sku || '',
        stock: payload.inventory?.stockQuantity || 0,
        mode: activeTab,
      });
      setQuantityInput('1');
    } catch (err) {
      setScannedItems((prev) =>
        prev.map((item, idx) =>
          idx === 0
            ? { ...item, status: 'error', message: 'Network error while fetching product data' }
            : item,
        ),
      );
    }
  };

  const submitQuantity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingScan) return;
    
    const qty = parseInt(quantityInput, 10);
    if (isNaN(qty) || qty < 1) return;

    setIsSubmitting(true);

    try {
      // 3. Actually submit the inventory update
      const res = await fetch('/api/scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: pendingScan.barcode,
          mode: pendingScan.mode,
          quantity: qty,
        }),
      });

      const payload = await res.json();

      if (!res.ok || !payload.success) {
        setScannedItems((prev) =>
          prev.map((item, idx) =>
            idx === 0 ? { ...item, status: 'error', message: payload.error || 'Adjustment failed' } : item,
          ),
        );
      } else {
        const productTitle = payload.product?.title || payload.product?.sku || 'Matched product';
        const stock = payload.inventory && typeof payload.inventory.stockQuantity === 'number'
          ? `Stock: ${payload.inventory.stockQuantity}`
          : undefined;
        const beforeAfter = payload.inventory?.beforeStock !== undefined
          ? `(${payload.inventory.beforeStock} → ${payload.inventory.stockQuantity})`
          : '';

        setScannedItems((prev) =>
          prev.map((item, idx) =>
            idx === 0
              ? {
                  ...item,
                  status: 'success',
                  product: stock ? `${productTitle} — ${stock} ${beforeAfter}` : productTitle,
                  message: undefined,
                }
              : item,
          ),
        );
      }
    } catch (err) {
      setScannedItems((prev) =>
        prev.map((item, idx) =>
          idx === 0 ? { ...item, status: 'error', message: 'Network error while committing scan' } : item,
        ),
      );
    } finally {
      setIsSubmitting(false);
      setPendingScan(null);
    }
  };

  const clearAll = () => setScannedItems([]);

  const config = modeConfig[activeTab];
  const Icon = config.icon;

  return (
    <div className="min-h-screen p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Warehouse Scanner</h1>
          <p className="text-gray-400 text-sm mt-0.5">Scan barcodes to process inventory actions.</p>
        </div>
        <div className="flex items-center gap-2 glass-card px-3 py-2 rounded-xl w-fit">
          {isConnected ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
          <span className={`text-xs font-medium ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
            {isConnected ? 'Scanner Ready' : 'Scanner Disconnected'}
          </span>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(modeConfig) as ScanMode[]).map(mode => {
          const m = modeConfig[mode];
          const MIcon = m.icon;
          const isActive = activeTab === mode;
          return (
            <button
              key={mode}
              onClick={() => setActiveTab(mode)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                isActive
                  ? `${m.bg} ${m.color} border-white/10 ring-1 ring-white/10 shadow-lg`
                  : 'text-gray-400 border-white/5 hover:text-white hover:bg-white/5 bg-transparent'
              }`}
            >
              <MIcon className="w-4 h-4" />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        {/* Scanner Component */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card rounded-2xl p-6">
            <div className={`flex items-center gap-3 mb-6 px-4 py-3 rounded-xl ${config.bg}`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Active Mode</p>
                <p className={`text-sm font-semibold ${config.color}`}>{config.actionLabel}</p>
              </div>
            </div>
            <ScannerComponent 
              onScan={handleScan} 
              onConnectionChange={setIsConnected}
              scannerType={activeTab} 
            />
          </div>

          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Stats</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{scannedItems.length}</p>
                <p className="text-xs text-gray-400 mt-0.5">Scanned</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-emerald-400">
                  {scannedItems.filter(i => i.status === 'success').length}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Success</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-red-400">
                  {scannedItems.filter(i => i.status === 'error').length}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Failed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scan Log */}
        <div className="lg:col-span-3 glass-card rounded-2xl overflow-hidden flex flex-col max-h-[700px]">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-white">Scan Log</h3>
              <span className="ml-1 bg-white/10 text-gray-300 text-xs px-2 py-0.5 rounded-full">{scannedItems.length}</span>
            </div>
            {scannedItems.length > 0 && (
              <button onClick={clearAll} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {scannedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-gray-600 p-8">
                <ScanLine className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium text-gray-400">No scans yet</p>
                <p className="text-xs text-gray-600 mt-1">Scan or type a barcode to get started</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {scannedItems.map((item, index) => (
                  <li key={index} className="px-5 py-4 flex items-start justify-between gap-3 hover:bg-white/2 transition-colors group">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`mt-0.5 flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center ${modeConfig[item.mode].bg}`}>
                        {(() => { const MIcon = modeConfig[item.mode].icon; return <MIcon className={`w-3.5 h-3.5 ${modeConfig[item.mode].color}`} />; })()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold text-white tracking-wide truncate">
                          {item.barcode}
                        </p>
                        {item.product && (
                          <p className="text-xs text-gray-400 mt-0.5">{item.product}</p>
                        )}
                        {item.message && (
                          <p className="text-xs text-red-400 mt-0.5">{item.message}</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-medium uppercase tracking-wider ${modeConfig[item.mode].color}`}>
                            {modeConfig[item.mode].label}
                          </span>
                          <span className="text-xs text-gray-600">{item.time.toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {item.status === 'processing' ? (
                        <div className="h-4 w-4 rounded-full border-2 border-gray-500 border-t-transparent animate-spin" />
                      ) : item.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      {/* Quantity Confirmation Modal Overlay */}
      {pendingScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => {
                setPendingScan(null);
                setScannedItems((prev) =>
                  prev.map((item, idx) =>
                    idx === 0 ? { ...item, status: 'error', message: 'Cancelled manually' } : item,
                  ),
                );
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-1">Confirm Quantity</h2>
            <p className="text-sm text-gray-400 mb-6">Review item details before committing changes.</p>

            <div className="space-y-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Product Match</p>
                <p className="text-sm font-semibold text-white">{pendingScan.productTitle}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 font-mono">
                  <span>SKU: <span className="text-white">{pendingScan.sku || 'N/A'}</span></span>
                  <span className="text-gray-600">•</span>
                  <span>BC: <span className="text-white">{pendingScan.barcode}</span></span>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-4">
                <span className="text-sm text-gray-400 font-medium tracking-wide">Current Location Stock</span>
                <span className="text-lg font-bold text-white">{pendingScan.stock}</span>
              </div>
            </div>

            <form onSubmit={submitQuantity} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wide">
                  Quantity for <span className={config.color}>{config.label}</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  autoFocus
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-black hover:bg-gray-200 py-3.5 rounded-xl text-sm font-bold tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Confirm ${config.label}`
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
