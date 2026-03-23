"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Loader2, Plus } from "lucide-react";
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
      <button
        type="button"
        className="fixed inset-0 z-[120] bg-background/70 backdrop-blur-sm"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside
        className="fixed right-0 top-0 z-[130] h-full w-full max-w-lg border-l border-foreground/10 glass shadow-2xl flex flex-col bg-background/95"
        role="dialog"
        aria-modal
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-foreground/10">
          <h2 className="text-sm font-semibold text-foreground font-inter">Batch detail</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-foreground/10 text-foreground/70"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 custom-scrollbar">
          {loading && !data ? (
            <div className="flex justify-center py-20 text-foreground/40">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : err && !data ? (
            <p className="text-red-500 text-sm">{err}</p>
          ) : b ? (
            <>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-foreground/45 font-mono">
                  {b.batchCode}
                </p>
                <p className="text-lg font-bold text-foreground mt-1">{b.productName}</p>
                <p className="text-xs text-foreground/55 mt-2">
                  Qty {b.quantity} ·{" "}
                  <span className="text-foreground/80">
                    {MFG_STAGE_LABEL[b.currentStage] || b.currentStage}
                  </span>
                </p>
                {b.fabric && (
                  <p className="text-xs text-foreground/55 mt-1">
                    Fabric: <span className="font-mono">{b.fabric.sku}</span> {b.fabric.name}
                  </p>
                )}
                <p className="text-xs text-foreground/40 mt-2">
                  Updated {formatDateTimeIST(b.updatedAt)} IST
                </p>
              </div>

              {data && (
                <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4 space-y-2">
                  <h3 className="text-[11px] font-bold uppercase text-foreground/40">
                    Cost breakdown
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-foreground/50">Fabric</span>
                    <span className="text-right tabular-nums">{formatInr(data.breakdown.fabricCost)}</span>
                    <span className="text-foreground/50">Wash</span>
                    <span className="text-right tabular-nums">
                      {formatInr(data.breakdown.washCost)} ({formatInr(data.breakdown.washCostPerUnit)}
                      /u)
                    </span>
                    <span className="text-foreground/50">Printing</span>
                    <span className="text-right tabular-nums">
                      {formatInr(data.breakdown.printingCost)}
                    </span>
                    <span className="text-foreground/50">Embroidery</span>
                    <span className="text-right tabular-nums">
                      {formatInr(data.breakdown.embroideryCost)}
                    </span>
                    <span className="text-foreground/50">Travel</span>
                    <span className="text-right tabular-nums">
                      {formatInr(data.breakdown.travelLogistics)}
                    </span>
                    <span className="text-foreground/50">Misc</span>
                    <span className="text-right tabular-nums">
                      {formatInr(data.breakdown.miscellaneous)}
                    </span>
                    <span className="text-foreground font-semibold">Total</span>
                    <span className="text-right tabular-nums font-bold text-amber-600 dark:text-amber-300">
                      {formatInr(data.breakdown.totalCost)}
                    </span>
                    <span className="text-foreground/50">Per unit</span>
                    <span className="text-right tabular-nums">{formatInr(data.breakdown.costPerUnit)}</span>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-[11px] font-bold uppercase text-foreground/40 mb-2">Timeline</h3>
                <ul className="space-y-3 border-l border-foreground/15 pl-3 ml-1">
                  {data?.timeline.map((t) => (
                    <li key={t.id} className="text-xs">
                      <p className="text-foreground/85 font-medium">{t.action}</p>
                      <p className="text-foreground/45">
                        {formatDateTimeIST(t.createdAt)} IST · {t.createdByName}
                      </p>
                      {t.costAmount > 0 && (
                        <p className="text-amber-600 dark:text-amber-300/90 tabular-nums">
                          {formatInr(t.costAmount)}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase text-foreground/40 mb-2">Notes</h3>
                <ul className="space-y-2 mb-3">
                  {data?.batchNotes.map((n) => (
                    <li
                      key={n.id}
                      className="text-xs rounded-xl bg-foreground/[0.04] p-2 border border-foreground/10"
                    >
                      <p className="text-foreground/85">{n.content}</p>
                      <p className="text-foreground/40 mt-1">
                        {n.createdByName} · {formatDateTimeIST(n.createdAt)} IST
                      </p>
                    </li>
                  ))}
                </ul>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note…"
                  rows={2}
                  className="w-full rounded-xl bg-foreground/[0.04] border border-foreground/10 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={saveNote}
                  className="mt-2 inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-foreground text-background text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add note
                </button>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase text-foreground/40 mb-2">
                  Add misc charge
                </h3>
                <input
                  type="number"
                  placeholder="Amount ₹"
                  value={miscAmount}
                  onChange={(e) => setMiscAmount(e.target.value)}
                  className="w-full rounded-xl bg-foreground/[0.04] border border-foreground/10 px-3 py-2 text-sm mb-2"
                />
                <select
                  value={miscType}
                  onChange={(e) => setMiscType(e.target.value)}
                  className="w-full rounded-xl bg-foreground/[0.04] border border-foreground/10 px-3 py-2 text-sm mb-2"
                >
                  <option value="PACKAGING">Packaging</option>
                  <option value="COURIER">Courier</option>
                  <option value="LABOUR">Labour</option>
                  <option value="OTHER">Other</option>
                </select>
                <input
                  placeholder="Description"
                  value={miscDesc}
                  onChange={(e) => setMiscDesc(e.target.value)}
                  className="w-full rounded-xl bg-foreground/[0.04] border border-foreground/10 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={saveMisc}
                  className="mt-2 w-full py-2.5 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/25 text-xs font-semibold"
                >
                  Save misc expense
                </button>
              </div>

              {err && data && <p className="text-red-500 text-xs">{err}</p>}
            </>
          ) : null}
        </div>
      </aside>
      {toast && (
        <div className="fixed bottom-6 right-6 z-[140] px-4 py-2 rounded-xl bg-foreground text-background text-xs font-medium shadow-xl">
          {toast}
        </div>
      )}
    </>
  );
}
