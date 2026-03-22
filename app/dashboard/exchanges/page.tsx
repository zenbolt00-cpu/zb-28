"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type ExchangeRequest = {
  id: string;
  order: { shopifyOrderId: string };
  originalProduct: { title: string };
  newProduct: { title: string };
  status: string;
  priceDifference: number;
};

export default function ExchangesPage() {
  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExchanges = async () => {
      try {
        const res = await fetch("/api/admin/exchanges"); // Mock or to be built
        if (res.ok) {
          const data = await res.json();
          setExchanges(data.exchanges || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExchanges();
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/exchanges/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setExchanges(exchanges.map(e => e.id === id ? { ...e, status } : e));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
         <div className="space-y-1">
          <div className="px-2 py-0.5 bg-foreground/[0.03] rounded-md text-[8px] font-black text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/40 dark:text-white/30 uppercase tracking-[0.2em] w-fit mb-1">swap protocol</div>
          <h1 className="text-xl font-black text-foreground uppercase tracking-tight mb-0.5 lowercase leading-none">
            Exchanges
          </h1>
          <p className="text-[10px] text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/40 dark:text-white/20 font-bold uppercase tracking-widest mt-1">
            Manage size shifts and variant migrations.
          </p>
        </div>
      </div>
     <div className="grid grid-cols-1 gap-3">
        {loading ? (
          <div className="bg-white/50 dark:bg-white/[0.02] border border-foreground/[0.05] rounded-xl p-12 text-center flex justify-center shadow-sm">
            <Loader2 className="w-6 h-6 animate-spin text-foreground/30 dark:text-foreground/30 dark:text-foreground/30 dark:text-foreground/30 dark:text-foreground/10" />
          </div>
        ) : exchanges.length === 0 ? (
           <div className="bg-white/50 dark:bg-white/[0.02] border border-foreground/[0.05] rounded-xl p-8 text-center shadow-sm">
            <ArrowLeftRight className="w-8 h-8 text-foreground/5 mx-auto mb-3" />
            <h3 className="text-[11px] font-black text-foreground uppercase tracking-tight lowercase">Swap relay silent</h3>
            <p className="text-[9px] text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20 font-black uppercase tracking-[0.2em] mt-1">No migration nodes detected.</p>
          </div>
        ) : (
           exchanges.map(req => (
            <div key={req.id} className="bg-white/50 dark:bg-white/[0.02] border border-foreground/[0.05] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-all hover:bg-foreground/[0.01]">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-black text-foreground uppercase tracking-tight lowercase leading-none">Order #{req.order.shopifyOrderId}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border ${
                    req.status === 'requested' ? 'bg-amber-500/5 text-amber-500 border-amber-500/10' :
                    req.status === 'approved' ? 'bg-blue-500/5 text-blue-500 border-blue-500/10' :
                    req.status === 'payment_pending' ? 'bg-orange-500/5 text-orange-500 border-orange-500/10' :
                    req.status === 'rejected' ? 'bg-rose-500/5 text-rose-500 border-rose-500/10' :
                    'bg-emerald-500/5 text-emerald-500 border-emerald-500/10'
                  }`}>
                    {req.status}
                  </span>
                </div>
                
                 <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-tight mt-1">
                  <div className="text-foreground/40 dark:text-foreground/20 dark:text-white/10">
                    <span className="block text-[6px] tracking-[0.2em] mb-1 opacity-40">Source</span>
                    <span className="line-through decoration-foreground/10 lowercase">{req.originalProduct.title}</span>
                  </div>
                  <ArrowLeftRight className="w-3 h-3 text-foreground/30 dark:text-foreground/30 dark:text-foreground/30 dark:text-foreground/30 dark:text-foreground/10 mx-1" />
                  <div className="text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/40 dark:text-white/30">
                    <span className="block text-[6px] tracking-[0.2em] mb-1 opacity-40 text-emerald-500/50">Target Migration</span>
                    <span className="text-emerald-500/40 lowercase">{req.newProduct.title}</span>
                  </div>
                </div>
                
                {req.priceDifference > 0 && (
                  <p className="text-amber-500/50 text-[8px] font-black uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/40 animate-pulse" />
                    Delta Payment required: ₹{req.priceDifference}
                  </p>
                )}
              </div>

               {req.status === 'requested' && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleStatusUpdate(req.id, 'rejected')}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg text-rose-500 hover:bg-rose-500/5 border border-rose-500/10 text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                  >
                    Deny
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(req.id, 'approved')}
                    className="flex items-center gap-2 px-6 py-2 bg-foreground text-background rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-foreground/5"
                  >
                    Authorize Swap
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
