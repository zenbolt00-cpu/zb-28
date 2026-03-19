"use client";

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { 
  ScanLine, 
  ArrowLeft, 
  RefreshCcw, 
  CheckCircle2, 
  AlertCircle,
  Package,
  Zap,
  Box,
  Truck,
  RotateCcw,
  ArrowRightLeft,
  XCircle,
  ClipboardList,
  Plus,
  Minus
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function InventoryScannerPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [status, setStatus] = useState<'idle' | 'confirm' | 'success' | 'error' | 'syncing'>('idle');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'STOCK_IN' | 'ORDER_OUT' | 'RETURN' | 'EXCHANGE' | 'RTO'>('STOCK_IN');
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const modes = [
    { id: 'STOCK_IN', label: 'Stock In', icon: Package, color: 'text-[#34C759]', bg: 'bg-[#34C759]/10' },
    { id: 'ORDER_OUT', label: 'Order Out', icon: Truck, color: 'text-[#007AFF]', bg: 'bg-[#007AFF]/10' },
    { id: 'RETURN', label: 'Return', icon: RotateCcw, color: 'text-[#FF9500]', bg: 'bg-[#FF9500]/10' },
    { id: 'EXCHANGE', label: 'Exchange', icon: ArrowRightLeft, color: 'text-[#AF52DE]', bg: 'bg-[#AF52DE]/10' },
    { id: 'RTO', label: 'RTO', icon: XCircle, color: 'text-[#FF3B30]', bg: 'bg-[#FF3B30]/10' },
  ];

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 280, height: 280 } },
        /* verbose= */ false
      );

      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Failed to clear scanner", e));
      }
    };
  }, [isScanning]);

  const onScanSuccess = async (decodedText: string) => {
    if (status === 'syncing' || status === 'confirm') return;
    
    setScanResult(decodedText);
    setIsScanning(false);
    setQuantity(1);
    setStatus('confirm');
  };

  const onScanFailure = (error: any) => {
    // Suppress noise
  };

  const handleSync = async () => {
    if (!scanResult) return;
    const code = scanResult;
    setStatus('syncing');
    setMessage('Synchronizing with Core Matrix...');
    
    try {
      const res = await fetch('/api/admin/inventory/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, mode, quantity })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || `Processed: ${data.productName || code}`);
        setRecentScans(prev => [{
          id: Date.now(),
          code,
          mode,
          productName: data.productName || 'Unknown',
          quantity,
          timestamp: new Date().toLocaleTimeString(),
          status: 'success'
        }, ...prev].slice(0, 5));
        
        try { new Audio('/success.mp3').play(); } catch(e){}
      } else {
        throw new Error(data.error || 'Sync Failed');
      }
    } catch (e: any) {
      setStatus('error');
      setMessage(e.message || 'Transmission Failed');
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setStatus('idle');
    setMessage('');
    setQuantity(1);
    setIsScanning(true);
  };

   return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="pb-20 max-w-6xl mx-auto"
    >
      {/* Siri Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-6 mb-8 lg:mb-12 relative z-10">
        <div className="space-y-1 lg:space-y-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground uppercase tracking-tighter leading-none">
            Logistics Scanner
          </h1>
          <p className="text-[9px] lg:text-[10px] text-foreground/40 font-bold uppercase tracking-[0.3em] max-w-xl">
            Advanced inventory reconciliation and substrate tracking.
          </p>
        </div>

        {/* Mode Selector - Siri Tab Style */}
        <div className="bg-foreground/5 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto hide-scrollbar border border-foreground/5 shadow-inner max-w-full backdrop-blur-xl">
          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`relative flex items-center gap-2.5 px-5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap z-10 overflow-hidden ${
                  isActive 
                    ? 'text-foreground dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]' 
                    : 'text-foreground/40 dark:text-white/40 hover:text-foreground/70 dark:hover:text-white/70 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {isActive && (
                   <motion.div 
                     layoutId="activeMode"
                     className="absolute inset-0 bg-white dark:bg-[#2C2C2E] rounded-xl -z-10"
                     transition={{ type: "spring", stiffness: 300, damping: 30 }}
                   />
                )}
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isActive ? m.bg : 'bg-transparent'}`}>
                  <Icon className={`w-3.5 h-3.5 ${isActive ? m.color : 'text-inherit opacity-60'}`} strokeWidth={2.5} />
                </div>
                <span className="relative z-10">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

       <div className="grid lg:grid-cols-5 gap-8">
        {/* Scanner Substrate */}
        <div className="lg:col-span-3 relative group">
          <div className="bg-foreground/[0.02] backdrop-blur-[60px] saturate-[200%] border border-foreground/10 rounded-[2rem] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] p-6 h-full relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent dark:from-white/5 pointer-events-none z-0" />
            
            <div className={`relative z-10 w-full h-[400px] md:h-full min-h-[400px] rounded-[1.5rem] overflow-hidden border border-black/5 dark:border-white/5 bg-black/5 dark:bg-black/20 ${isScanning ? 'shadow-inner' : ''}`}>
               <div id="reader" className="w-full h-full object-cover scan-region-highlight" style={{ border: 'none' }}></div>
               
               {isScanning && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                     <div className="w-64 h-64 border-2 border-[#007AFF]/50 rounded-2xl relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#007AFF] rounded-tl-2xl"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#007AFF] rounded-tr-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#007AFF] rounded-bl-2xl"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#007AFF] rounded-br-2xl"></div>
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-[#007AFF] animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_15px_#007AFF]"></div>
                     </div>
                  </div>
               )}

              {!isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-[#1C1C1E]/90 backdrop-blur-2xl z-20 p-8 text-center animate-in fade-in zoom-in-95 duration-300">
                  {status === 'confirm' ? (
                    <>
                      <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl bg-[#007AFF]/10 text-[#007AFF] shadow-[#007AFF]/20">
                         <ScanLine className="w-10 h-10" strokeWidth={2} />
                      </div>
                      <h3 className="text-[14px] font-black uppercase tracking-[0.2em] mb-2 text-foreground dark:text-white">Verify Submission</h3>
                      <p className="text-[12px] font-bold text-foreground/50 dark:text-white/50 mb-6 whitespace-pre-wrap max-w-[80%] mx-auto block break-all">{scanResult}</p>
                      
                      {/* Quantity Selector */}
                      <div className="flex items-center gap-4 mb-8 bg-black/5 dark:bg-white/5 p-2 rounded-[1.5rem] border border-black/5 dark:border-white/5 shadow-inner">
                        <button 
                          onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                          className="w-12 h-12 rounded-xl bg-white dark:bg-[#2C2C2E] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] text-foreground dark:text-white"
                        >
                          <Minus className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                        <div className="w-16 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-foreground dark:text-white tracking-tighter leading-none">{quantity}</span>
                          <span className="text-[8px] font-black text-foreground/40 dark:text-white/40 uppercase tracking-widest mt-1">Units</span>
                        </div>
                        <button 
                          onClick={() => setQuantity(quantity + 1)} 
                          className="w-12 h-12 rounded-xl bg-white dark:bg-[#2C2C2E] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] text-foreground dark:text-white"
                        >
                          <Plus className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                      </div>

                      <div className="flex gap-3">
                        <button 
                          onClick={resetScanner} 
                          className="px-6 py-4 rounded-2xl text-[12px] font-bold uppercase tracking-[0.1em] text-foreground/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground dark:hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSync} 
                          className="inline-flex items-center gap-2 px-8 py-4 bg-[#34C759] text-white rounded-2xl text-[12px] font-bold uppercase tracking-[0.15em] hover:scale-105 active:scale-95 transition-all shadow-[0_8px_24px_rgba(52,199,89,0.3)]"
                        >
                          <Zap className="w-4 h-4" strokeWidth={2.5} />
                          Confirm
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl ${
                         status === 'success' ? 'bg-[#34C759]/10 text-[#34C759] shadow-[#34C759]/20' : 
                         status === 'error' ? 'bg-[#FF3B30]/10 text-[#FF3B30] shadow-[#FF3B30]/20' : 
                         'bg-[#007AFF]/10 text-[#007AFF] shadow-[#007AFF]/20 animate-pulse'
                      }`}>
                         <Zap className="w-10 h-10" strokeWidth={2} />
                      </div>
                      <h3 className="text-[14px] font-black uppercase tracking-[0.2em] mb-2 text-foreground dark:text-white">
                        {status === 'success' ? 'Terminal State Achieved' : status === 'error' ? 'Transmission Failed' : 'Signal Decoded'}
                      </h3>
                      <p className="text-[12px] font-bold text-foreground/50 dark:text-white/50 mb-8 whitespace-pre-wrap max-w-[80%] mx-auto flex flex-col items-center">
                        <span className="text-[10px] uppercase tracking-widest opacity-60 mb-2 block">{scanResult}</span>
                        {message}
                      </p>
                      
                      {status !== 'syncing' && (
                        <button 
                          onClick={resetScanner}
                          className="inline-flex items-center gap-3 px-8 py-4 bg-foreground text-background dark:bg-white dark:text-black rounded-2xl text-[12px] font-bold uppercase tracking-[0.15em] hover:scale-105 active:scale-95 transition-all shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(255,255,255,0.4)]"
                        >
                          <RefreshCcw className="w-4 h-4" strokeWidth={2} />
                          Restart Link
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

         {/* Transmission Logistics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-foreground/[0.02] backdrop-blur-[60px] saturate-[200%] border border-foreground/10 rounded-[2rem] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] relative overflow-hidden h-full flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent dark:from-white/5 pointer-events-none z-0" />
            
            <div className="relative z-10 flex flex-col h-full">
               <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-foreground/40 dark:text-white/40 mb-6 flex items-center gap-2">
                  <ActivityLine /> Activity Feed
               </h2>
               
               {/* Status Module */}
               <AnimatePresence mode="wait">
                 <motion.div 
                   key={status + mode}
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className={`p-6 rounded-[1.5rem] flex items-start gap-5 border shadow-inner mb-8 ${
                     status === 'success' ? 'bg-[#34C759]/5 text-[#34C759] border-[#34C759]/20' :
                     status === 'error' ? 'bg-[#FF3B30]/5 text-[#FF3B30] border-[#FF3B30]/20' :
                     status === 'syncing' ? 'bg-[#007AFF]/5 text-[#007AFF] border-[#007AFF]/20' :
                     'bg-black/5 dark:bg-white/5 text-foreground/60 dark:text-white/60 border-black/5 dark:border-white/10'
                   }`}
                 >
                   <div className={`p-3 rounded-xl flex items-center justify-center ${
                        status === 'success' ? 'bg-[#34C759]/10' :
                        status === 'error' ? 'bg-[#FF3B30]/10' :
                        status === 'syncing' ? 'bg-[#007AFF]/10' :
                        'bg-black/5 dark:bg-white/10'
                   }`}>
                     {status === 'success' ? <CheckCircle2 className="w-6 h-6" strokeWidth={2.5} /> :
                      status === 'error' ? <AlertCircle className="w-6 h-6" strokeWidth={2.5} /> :
                      status === 'syncing' ? <RefreshCcw className="w-6 h-6 animate-spin" strokeWidth={2.5} /> :
                      <ScanLine className="w-6 h-6 opacity-60" strokeWidth={2.5} />}
                   </div>
                   
                   <div className="flex-1">
                     <div className="flex items-center justify-between mb-2">
                       <p className="text-[13px] font-black tracking-tight uppercase leading-none">
                         {status === 'idle' ? 'Standby' : status === 'syncing' ? 'Syncing Matrix' : status.toUpperCase()}
                       </p>
                       <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest leading-none bg-black/10 dark:bg-white/10 px-2.5 py-1 rounded-md">{mode.replace('_', ' ')}</span>
                     </div>
                     <p className="text-[12px] font-bold opacity-90 mb-3">{status === 'idle' ? `Awaiting ${mode.toLowerCase().replace('_', ' ')} signal` : message}</p>
                     <p className="text-[10px] font-medium opacity-60 uppercase tracking-wide leading-relaxed">
                       {status === 'idle' ? 'Align optical link with target matrix QR cluster.' : 
                        status === 'syncing' ? 'Injecting transaction into the distributed ledger...' :
                        status === 'success' ? 'Terminal state achieved. Valid block captured.' : 'Signal failure detected in transmission.'}
                     </p>
                   </div>
                 </motion.div>
               </AnimatePresence>

               {/* Recent Transactions List */}
                <div className="flex-1 overflow-y-auto pr-2 -mr-2 hide-scrollbar">
                  <div className="space-y-3">
                     <AnimatePresence initial={false}>
                       {recentScans.length > 0 ? recentScans.map((s) => (
                         <motion.div
                           key={s.id}
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/5 flex items-center justify-between group hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                         >
                           <div className="flex items-center gap-4 hidden sm:flex">
                              <div className={`w-10 h-10 rounded-xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/10 flex items-center justify-center shadow-inner`}>
                                 {(() => {
                                    const m = modes.find(mod => mod.id === s.mode);
                                    const Icon = m?.icon || Box;
                                    return <Icon className={`w-4 h-4 ${m?.color || 'text-foreground/40'}`} strokeWidth={2} />;
                                 })()}
                              </div>
                              <div>
                                 <p className="text-[12px] font-bold text-foreground dark:text-white capitalize tracking-tight leading-none mb-2 line-clamp-1">{s.productName}</p>
                                 <p className="text-[10px] font-semibold text-foreground/50 dark:text-white/50 uppercase tracking-widest leading-none font-mono">{s.code.substring(0, 16)}...</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <span className="text-[9px] font-black px-2.5 py-1.5 rounded-lg bg-black/10 dark:bg-white/10 text-foreground/70 dark:text-white/70 uppercase tracking-[0.15em]">{s.mode} {s.quantity > 1 ? `x${s.quantity}` : ''}</span>
                              <p className="text-[9px] font-bold text-foreground/40 dark:text-white/40 mt-2 uppercase tracking-widest">{s.timestamp}</p>
                           </div>
                         </motion.div>
                       )) : (
                         <div className="h-40 border border-dashed border-black/10 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center text-foreground/30 dark:text-white/30">
                            <ClipboardList className="w-8 h-8 mb-3 opacity-50" strokeWidth={1.5} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">No Signals Captured</span>
                         </div>
                       )}
                     </AnimatePresence>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ActivityLine() {
   return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity text-[#5E5CE6]"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>
   )
}
