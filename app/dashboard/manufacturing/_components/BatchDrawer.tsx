"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Loader2, Plus, Info, ListTree, History, MessageSquare, PlusCircle, Check, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { mfgFetch } from "@/lib/manufacturing/mfg-fetch";
import { formatDateTimeIST } from "@/lib/manufacturing/ist";
import { formatInr } from "@/lib/manufacturing/inr";
import { MFG_STAGE_LABEL } from "@/lib/manufacturing/constants";

type DetailPayload = {
  batch: {
    id: string;
    batchCode: string;
    productName: string;
    quantity: number;
    currentStage: string;
    washCostTotal: number;
    notes: string | null;
    estimatedCostPerUnit: number | null;
    fabric: { sku: string; name: string } | null;
    createdAt: string;
    updatedAt: string;
  };
  timeline: {
    id: string;
    action: string;
    fromStage: string | null;
    toStage: string | null;
    costAmount: number;
    payload: unknown;
    createdByName: string;
    createdAt: string;
  }[];
  breakdown: {
    fabricCost: number;
    washCost: number;
    washCostPerUnit: number;
    printingCost: number;
    embroideryCost: number;
    travelLogistics: number;
    miscellaneous: number;
    totalCost: number;
    costPerUnit: number;
  };
  batchNotes: { id: string; content: string; createdByName: string; createdAt: string }[];
};

export function BatchDrawer({
  batchId,
  open,
  onClose,
  onSaved,
}: {
  batchId: string | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [data, setData] = useState<DetailPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [miscAmount, setMiscAmount] = useState("");
  const [miscDesc, setMiscDesc] = useState("");
  const [miscType, setMiscType] = useState("OTHER");
  const [toast, setToast] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await mfgFetch(`/api/admin/manufacturing/batches/${batchId}/detail`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to load");
      setData(j);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    if (open && batchId) load();
  }, [open, batchId, load]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const saveNote = async () => {
    if (!batchId || !note.trim()) {
      setErr("Enter a note");
      return;
    }
    setErr(null);
    try {
      const res = await mfgFetch(`/api/admin/manufacturing/batches/${batchId}/notes`, {
        method: "POST",
        body: JSON.stringify({ content: note.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      showToast("Note saved");
      setNote("");
      load();
      onSaved();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  };

  const saveMisc = async () => {
    if (!batchId) return;
    const amt = Number(miscAmount);
    if (!miscDesc.trim() || Number.isNaN(amt)) {
      setErr("Misc amount and description required");
      return;
    }
    setErr(null);
    try {
      const res = await mfgFetch("/api/admin/manufacturing/misc", {
        method: "POST",
        body: JSON.stringify({
          batchId,
          amount: amt,
          description: miscDesc.trim(),
          expenseType: miscType,
          expenseDate: new Date().toISOString(),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      showToast("Misc expense added");
      setMiscAmount("");
      setMiscDesc("");
      load();
      onSaved();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  };

  if (!open) return null;

  const b = data?.batch;

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] bg-background/40 backdrop-blur-md"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 z-[130] h-full w-full max-w-lg border-l border-foreground/10 bg-background/80 backdrop-blur-2xl shadow-2xl flex flex-col"
              role="dialog"
              aria-modal
            >
              <div className="flex items-center justify-between px-8 py-6 border-b border-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center border border-foreground/5">
                    <Info className="w-4 h-4 text-foreground/40" />
                  </div>
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.4em] text-foreground/40">Batch Perspective</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 rounded-full hover:bg-foreground/5 flex items-center justify-center text-foreground/40 hover:text-foreground transition-all active:scale-95 border border-transparent hover:border-foreground/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 custom-scrollbar relative">
                {loading && !data ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-foreground/20" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Harvesting data</span>
                  </div>
                ) : err && !data ? (
                  <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-rose-500 text-[12px] font-bold text-center">
                    {err}
                  </div>
                ) : b ? (
                  <>
                    <div className="relative group">
                      <div className="font-mono text-[10px] font-bold text-foreground/30 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-foreground/20" /> {b.batchCode}
                      </div>
                      <h1 className="text-3xl font-bold text-foreground tracking-tighter leading-none mb-4 uppercase">
                        {b.productName}
                      </h1>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-foreground/5 bg-foreground/[0.03] text-foreground/60`}>
                          {b.quantity} UNITS
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-foreground/5 bg-foreground/[0.03] text-foreground/60`}>
                          {MFG_STAGE_LABEL[b.currentStage] || b.currentStage}
                        </div>
                      </div>

                      {b.fabric && (
                        <div className="mt-6 flex items-center gap-3 p-4 rounded-2xl bg-foreground/[0.02] border border-foreground/5 group-hover:bg-foreground/[0.03] transition-all">
                           <div className="w-10 h-10 rounded-xl bg-background border border-foreground/5 flex items-center justify-center shadow-sm">
                             <Package className="w-4.5 h-4.5 text-foreground/40" />
                           </div>
                           <div>
                             <div className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest leading-none mb-1">Fabric Association</div>
                             <div className="text-[13px] font-bold text-foreground/80"><span className="font-mono">{b.fabric.sku}</span> · {b.fabric.name}</div>
                           </div>
                        </div>
                      )}
                      
                      <div className="text-[10px] font-bold text-foreground/20 mt-4 uppercase tracking-widest">
                        Updated {formatDateTimeIST(b.updatedAt)} IST
                      </div>
                    </div>

                    {data && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ListTree className="w-3.5 h-3.5 text-foreground/30" />
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/30">Refinery Breakdown</h3>
                        </div>
                        <div className="rounded-[2rem] border border-foreground/5 bg-foreground/[0.02] p-8 space-y-4">
                          <div className="grid grid-cols-2 gap-y-4 text-[13px]">
                            <span className="text-foreground/40 font-medium tracking-tight">Fabric Capital</span>
                            <span className="text-right font-bold tabular-nums text-foreground/80">{formatInr(data.breakdown.fabricCost)}</span>
                            
                            <span className="text-foreground/40 font-medium tracking-tight">Refinery Wash</span>
                            <div className="text-right">
                              <div className="font-bold tabular-nums text-foreground/80">{formatInr(data.breakdown.washCost)}</div>
                              <div className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest">({formatInr(data.breakdown.washCostPerUnit)}/u)</div>
                            </div>
                            
                            <span className="text-foreground/40 font-medium tracking-tight">Spectrum Printing</span>
                            <span className="text-right font-bold tabular-nums text-foreground/80">{formatInr(data.breakdown.printingCost)}</span>
                            
                            <span className="text-foreground/40 font-medium tracking-tight">Artisan Embroidery</span>
                            <span className="text-right font-bold tabular-nums text-foreground/80">{formatInr(data.breakdown.embroideryCost)}</span>
                            
                            <span className="text-foreground/40 font-medium tracking-tight">Logistics Pool</span>
                            <span className="text-right font-bold tabular-nums text-foreground/80">{formatInr(data.breakdown.travelLogistics)}</span>
                            
                            <span className="text-foreground/40 font-medium tracking-tight">Metadata Misc</span>
                            <span className="text-right font-bold tabular-nums text-foreground/80">{formatInr(data.breakdown.miscellaneous)}</span>
                            
                            <div className="col-span-2 my-2 border-t border-foreground/5" />
                            
                            <span className="text-foreground font-bold tracking-tighter uppercase">Net Valuation</span>
                            <span className="text-right tabular-nums font-bold text-[20px] text-foreground flex items-center justify-end gap-1">
                              {formatInr(data.breakdown.totalCost)}
                            </span>
                            
                            <span className="text-foreground/40 font-bold uppercase tracking-widest text-[9px]">Nodes CPU</span>
                            <span className="text-right tabular-nums font-bold text-foreground/60">{formatInr(data.breakdown.costPerUnit)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <History className="w-3.5 h-3.5 text-foreground/30" />
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/30">Immutable Timeline</h3>
                      </div>
                      <div className="relative pl-6 border-l border-foreground/5 space-y-8">
                        {data?.timeline.map((t) => (
                          <div key={t.id} className="relative group/time">
                            <div className="absolute -left-[29px] top-1 w-2.5 h-2.5 rounded-full bg-background border border-foreground/20 group-hover/time:bg-foreground transition-all duration-500" />
                            <p className="text-[13px] font-bold text-foreground/80 tracking-tight mb-1">{t.action}</p>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-foreground/30 uppercase tracking-widest">
                              <span>{formatDateTimeIST(t.createdAt).split(',')[0]}</span>
                              <span>·</span>
                              <span>{t.createdByName}</span>
                            </div>
                            {t.costAmount > 0 && (
                              <div className="mt-2 text-[12px] font-bold text-foreground/60 tabular-nums">
                                + {formatInr(t.costAmount)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-foreground/30" />
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/30">Technical Notes</h3>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {data?.batchNotes.map((n) => (
                          <div
                            key={n.id}
                            className="text-[12px] rounded-2xl bg-foreground/[0.02] p-4 border border-foreground/5 relative group/note overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 to-transparent opacity-0 group-hover/note:opacity-100 transition-opacity pointer-events-none" />
                            <p className="text-foreground/80 font-medium leading-relaxed relative z-10">{n.content}</p>
                            <div className="text-[9px] font-bold text-foreground/30 mt-3 uppercase tracking-widest relative z-10">
                              {n.createdByName} · {formatDateTimeIST(n.createdAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 space-y-3">
                         <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Enter spectrum metadata..."
                          rows={3}
                          className="w-full rounded-2xl bg-foreground/[0.03] border border-foreground/5 px-5 py-4 text-sm focus:outline-none focus:border-foreground/20 transition-all placeholder:text-foreground/20"
                        />
                        <button
                          type="button"
                          onClick={saveNote}
                          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-foreground text-background text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-foreground/10"
                        >
                          <PlusCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
                          Commit Note
                        </button>
                      </div>
                    </div>

                    <div className="pt-10 border-t border-foreground/5 space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <PlusCircle className="w-3.5 h-3.5 text-foreground/30" />
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/30">Inbound Misc Charge</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="Principal Amount ₹"
                            value={miscAmount}
                            onChange={(e) => setMiscAmount(e.target.value)}
                            className="w-full rounded-2xl bg-foreground/[0.03] border border-foreground/5 px-5 py-4 text-sm focus:outline-none focus:border-foreground/20 transition-all"
                          />
                        </div>
                        <select
                          value={miscType}
                          onChange={(e) => setMiscType(e.target.value)}
                          className="w-full rounded-2xl bg-foreground/[0.03] border border-foreground/5 px-5 py-4 text-sm focus:outline-none focus:border-foreground/20 transition-all appearance-none"
                        >
                          <option value="PACKAGING">Packaging</option>
                          <option value="COURIER">Courier</option>
                          <option value="LABOUR">Labour</option>
                          <option value="OTHER">Other Type</option>
                        </select>
                        <input
                          placeholder="Rationale"
                          value={miscDesc}
                          onChange={(e) => setMiscDesc(e.target.value)}
                          className="w-full rounded-2xl bg-foreground/[0.03] border border-foreground/5 px-5 py-4 text-sm focus:outline-none focus:border-foreground/20 transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={saveMisc}
                        className="w-full py-4 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/10 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-amber-500 hover:text-white transition-all shadow-lg shadow-amber-500/10"
                      >
                        Confirm Misc Expense
                      </button>
                    </div>

                    {err && data && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest text-center">{err}</p>}
                  </>
                ) : null}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div 
             initial={{ opacity: 0, y: 20, x: '-50%' }}
             animate={{ opacity: 1, y: 0, x: '-50%' }}
             exit={{ opacity: 0, y: 20, x: '-50%' }}
             className="fixed bottom-10 left-1/2 z-[140] px-6 py-3 rounded-2xl bg-foreground text-background text-[11px] font-bold uppercase tracking-widest shadow-2xl flex items-center gap-3 border border-background/10"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
