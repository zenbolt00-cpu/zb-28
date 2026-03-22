"use client";

import { useEffect, useState } from "react";
import { Undo2, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type ReturnRequest = {
  id: string;
  order: { shopifyOrderId: string };
  customer: { name: string; email: string };
  product: { title: string };
  sku: string;
  reason: string;
  status: string;
  requestedAt: string;
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app we'd have a GET /api/admin/returns, but since Next.js allows hybrid, 
    // we'll mock the fetch here and assume it exists, or just simulate it for layout purposes.
    // For this build, let's just make it a UI shell since the API `/api/admin/returns/[id]` exists.
    const fetchReturns = async () => {
      try {
        const res = await fetch("/api/admin/returns");
        if (res.ok) {
          const data = await res.json();
          setReturns(data.returns || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReturns();
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/returns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setReturns(returns.map(r => r.id === id ? { ...r, status } : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
         <div className="space-y-1">
          <div className="px-2 py-0.5 bg-foreground/[0.03] rounded-md text-[8px] font-black text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/40 dark:text-white/30 uppercase tracking-[0.2em] w-fit mb-1">reversal protocol</div>
          <h1 className="text-xl font-black text-foreground uppercase tracking-tight mb-0.5 lowercase leading-none">
            Returns
          </h1>
          <p className="text-[10px] text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/40 dark:text-white/20 font-bold uppercase tracking-widest mt-1">
            Manage customer feedback loops and reversals.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
         {loading ? (
          <div className="bg-white/50 dark:bg-white/[0.02] border border-foreground/[0.05] rounded-xl p-12 text-center flex justify-center shadow-sm">
            <Loader2 className="w-6 h-6 animate-spin text-foreground/30 dark:text-foreground/30 dark:text-foreground/30 dark:text-foreground/30 dark:text-foreground/10" />
          </div>
        ) : returns.length === 0 ? (
           <div className="bg-white/50 dark:bg-white/[0.02] border border-foreground/[0.05] rounded-xl p-8 text-center shadow-sm">
            <Undo2 className="w-8 h-8 text-foreground/5 mx-auto mb-3" />
            <h3 className="text-[11px] font-black text-foreground uppercase tracking-tight lowercase">Protocol inactive</h3>
            <p className="text-[9px] text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20 font-black uppercase tracking-[0.2em] mt-1">No reversal nodes detected.</p>
          </div>
        ) : (
          returns.map(req => (
            <div key={req.id} className="bg-white/50 dark:bg-white/[0.02] border border-foreground/[0.05] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-all hover:bg-foreground/[0.01]">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-black text-foreground uppercase tracking-tight lowercase leading-none">Order #{req.order.shopifyOrderId}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border ${
                    req.status === 'requested' ? 'bg-amber-500/5 text-amber-500 border-amber-500/10' :
                    req.status === 'approved' ? 'bg-blue-500/5 text-blue-500 border-blue-500/10' :
                    req.status === 'rejected' ? 'bg-rose-500/5 text-rose-500 border-rose-500/10' :
                    'bg-emerald-500/5 text-emerald-500 border-emerald-500/10'
                  }`}>
                    {req.status}
                  </span>
                </div>
                <p className="text-[10px] font-black text-foreground/50 dark:text-foreground/30 dark:text-white/20 uppercase tracking-tight lowercase leading-none">{req.product.title} <span className="text-foreground/30 dark:text-foreground/30 dark:text-foreground/30 dark:text-foreground/30 dark:text-foreground/10 ml-1">sku: {req.sku || 'N/A'}</span></p>
                 <p className="text-[8px] font-black text-foreground/40 dark:text-foreground/20 dark:text-white/10 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/40 dark:text-white/30">{req.customer?.name}</span>
                  <div className="w-1 h-1 rounded-full bg-foreground/10" />
                  <span>{req.reason}</span>
                </p>
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
                    Authorize Reversal
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
