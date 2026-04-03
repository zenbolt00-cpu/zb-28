"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, RefreshCw, AlertTriangle, Search, Filter, CalendarDays, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { mfgFetch } from "@/lib/manufacturing/mfg-fetch";
import { formatDateTimeIST } from "@/lib/manufacturing/ist";
import { formatInr } from "@/lib/manufacturing/inr";

type Fabric = {
  id: string;
  sku: string;
  name: string;
  costPerMeter: number;
  weightUnit?: string;
  lowStockMetersThreshold?: number | null;
};

type Movement = {
  id: string;
  fabricId: string;
  occurredAt: string;
  type: string;
  quantity: number;
  quantityUnit: string;
  rateAtMovement: number;
  totalValue: number;
  remarks: string | null;
  createdByName: string;
  correctsMovementId: string | null;
  productionBatchId: string | null;
  balanceMetersAfter: number | null;
  balanceWeightAfter: number | null;
  fabric: Fabric;
};

type Batch = { id: string; batchCode: string; productName: string };

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const x = parseFloat(String(v ?? ""));
  return Number.isFinite(x) ? x : 0;
}

function runningBalanceLabel(m: Movement): string {
  const parts: string[] = [];
  if (m.balanceMetersAfter != null) {
    parts.push(`${num(m.balanceMetersAfter).toLocaleString("en-IN", { maximumFractionDigits: 2 })} m`);
  }
  if (m.balanceWeightAfter != null) {
    const u = m.fabric.weightUnit === "g" ? "g" : "kg";
    parts.push(`${num(m.balanceWeightAfter).toLocaleString("en-IN", { maximumFractionDigits: 3 })} ${u}`);
  }
  return parts.join(" · ") || "—";
}

function lowThreshold(f: Fabric): number {
  const t = f.lowStockMetersThreshold;
  if (t != null && Number.isFinite(t) && t > 0) return t;
  return 10;
}

export default function FabricMovementPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ t: "ok" | "err"; m: string } | null>(null);

  const [filters, setFilters] = useState({
    q: "",
    type: "",
    fabricId: "",
    from: "",
    to: "",
  });

  const [modal, setModal] = useState<"add" | "correct" | null>(null);
  const [correctTarget, setCorrectTarget] = useState<Movement | null>(null);

  const [form, setForm] = useState({
    fabricId: "",
    type: "IN" as "IN" | "OUT",
    quantity: "",
    quantityUnit: "m",
    rateAtMovement: "",
    occurredAt: "",
    remarks: "",
    productionBatchId: "",
  });
  const [formErr, setFormErr] = useState<Record<string, string>>({});

  const show = (m: string, t: "ok" | "err" = "ok") => {
    setToast({ m, t });
    setTimeout(() => setToast(null), 4000);
  };

  const loadFabrics = useCallback(async () => {
    const res = await mfgFetch("/api/admin/manufacturing/fabric");
    const data = await res.json();
    setFabrics(
      Array.isArray(data)
        ? data.map((f: Fabric) => ({ ...f, costPerMeter: num(f.costPerMeter) }))
        : []
    );
  }, []);

  const loadBatches = useCallback(async () => {
    const res = await mfgFetch("/api/admin/manufacturing/batches");
    const data = await res.json();
    setBatches(Array.isArray(data) ? data : []);
  }, []);

  const loadMovements = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/manufacturing/movements", window.location.origin);
      if (filters.q.trim()) url.searchParams.set("q", filters.q.trim());
      if (filters.type) url.searchParams.set("type", filters.type);
      if (filters.fabricId) url.searchParams.set("fabricId", filters.fabricId);
      if (filters.from) url.searchParams.set("from", new Date(filters.from).toISOString());
      if (filters.to) url.searchParams.set("to", new Date(filters.to).toISOString());
      const res = await mfgFetch(url.toString());
      const data = await res.json();
      setMovements(Array.isArray(data) ? data : []);
    } catch {
      show("Could not load ledger", "err");
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, [filters.q, filters.type, filters.fabricId, filters.from, filters.to]);

  useEffect(() => {
    loadFabrics();
    loadBatches();
  }, [loadFabrics, loadBatches]);

  useEffect(() => {
    const t = setTimeout(loadMovements, 260);
    return () => clearTimeout(t);
  }, [loadMovements]);

  const activeFilters = useMemo(() => {
    const p: string[] = [];
    if (filters.type) p.push(filters.type);
    if (filters.fabricId) p.push("Fabric");
    if (filters.from || filters.to) p.push("Dates");
    if (filters.q.trim()) p.push("Search");
    return p;
  }, [filters]);

  const onFabricPick = (id: string) => {
    const f = fabrics.find((x) => x.id === id);
    setForm((s) => ({
      ...s,
      fabricId: id,
      rateAtMovement: f ? String(num(f.costPerMeter)) : s.rateAtMovement,
    }));
  };

  const previewTotal = useMemo(() => {
    const qty = Math.abs(num(form.quantity));
    const rate = num(form.rateAtMovement);
    if (!qty || !rate) return 0;
    return Math.round(qty * rate * 100) / 100;
  }, [form.quantity, form.rateAtMovement]);

  const submitMovement = async () => {
    const e: Record<string, string> = {};
    if (!form.fabricId) e.fabricId = "Select fabric";
    if (!form.quantity.trim()) e.quantity = "Required";
    const r = num(form.rateAtMovement);
    if (!Number.isFinite(r) || r < 0) e.rateAtMovement = "Invalid rate";
    setFormErr(e);
    if (Object.keys(e).length) return;

    try {
      const res = await mfgFetch("/api/admin/manufacturing/movements", {
        method: "POST",
        body: JSON.stringify({
          fabricId: form.fabricId,
          type: modal === "correct" ? "ADJUSTMENT" : form.type,
          quantity: Number(form.quantity),
          quantityUnit: form.quantityUnit,
          rateAtMovement: r,
          occurredAt: form.occurredAt ? new Date(form.occurredAt).toISOString() : undefined,
          remarks: form.remarks || undefined,
          productionBatchId: form.productionBatchId || undefined,
          correctsMovementId: modal === "correct" ? correctTarget?.id : undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      show(modal === "correct" ? "Correction saved (append-only)" : "Movement saved");
      setModal(null);
      setCorrectTarget(null);
      setForm({
        fabricId: "",
        type: "IN",
        quantity: "",
        quantityUnit: "m",
        rateAtMovement: "",
        occurredAt: "",
        remarks: "",
        productionBatchId: "",
      });
      setFormErr({});
      loadMovements();
      loadFabrics();
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : "Error", "err");
    }
  };

  const openCorrect = (m: Movement) => {
    setCorrectTarget(m);
    setForm({
      fabricId: m.fabricId,
      type: "IN",
      quantity: "",
      quantityUnit: (m.quantityUnit as "m" | "kg" | "g") || "m",
      rateAtMovement: String(num(m.rateAtMovement)),
      occurredAt: "",
      remarks: `Correction (ref ${m.id.slice(0, 8)}).`,
      productionBatchId: m.productionBatchId || "",
    });
    setFormErr({});
    setModal("correct");
  };

  const typeLabel = (t: string) => {
    if (t === "IN") return "IN";
    if (t === "OUT") return "OUT";
    if (t === "ADJUSTMENT") return "Correction";
    return t;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="pb-20 space-y-6 lg:space-y-8 relative z-10"
    >
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-8 left-1/2 z-[200] max-w-[90vw] w-max px-4 py-3 rounded-[1rem] text-[12px] font-bold shadow-2xl flex items-center justify-center gap-2 border backdrop-blur-xl ${
              toast.t === "ok" 
                ? "bg-background/90 text-foreground border-foreground/10" 
                : "bg-rose-500 text-white border-rose-500/20"
            }`}
          >
            {toast.t === "ok" && <Check className="w-4 h-4 text-emerald-500" />}
            {toast.m}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 relative z-10">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground uppercase tracking-tighter leading-none">
            Fabric Movement
          </h1>
          <p className="text-[11px] lg:text-[12px] text-foreground/70 tracking-wide max-w-xl">
             Immutable ledger — corrections add new rows. Balances shown in IST. Alerts for low stock levels.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadMovements}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-background border border-foreground/[0.05] text-foreground rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-foreground/[0.02] disabled:opacity-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
             onClick={() => {
              setModal("add");
              setForm({
                fabricId: "",
                type: "IN",
                quantity: "",
                quantityUnit: "m",
                rateAtMovement: "",
                occurredAt: "",
                remarks: "",
                productionBatchId: "",
              });
              setFormErr({});
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-foreground/10"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Movement
          </button>
        </div>
      </div>

       <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.8 }}
        className="glass-card rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-8 flex flex-col gap-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              placeholder="Search..."
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              className="w-full bg-background border border-foreground/10 rounded-xl pl-10 pr-4 py-3 text-[12px] font-medium text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-foreground/30 transition-all shadow-sm"
            />
          </div>
          <div className="relative">
             <Filter className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
            <select
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
              className="w-full bg-background border border-foreground/10 rounded-xl pl-10 pr-4 py-3 text-[12px] font-medium text-foreground focus:outline-none focus:border-foreground/30 transition-all shadow-sm appearance-none"
            >
              <option value="">All Types</option>
              <option value="IN">In</option>
              <option value="OUT">Out</option>
              <option value="ADJUSTMENT">Correction</option>
            </select>
          </div>
          <div className="relative xl:col-span-2">
            <Filter className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
            <select
              value={filters.fabricId}
              onChange={(e) => setFilters((f) => ({ ...f, fabricId: e.target.value }))}
              className="w-full bg-background border border-foreground/10 rounded-xl pl-10 pr-4 py-3 text-[12px] font-medium text-foreground focus:outline-none focus:border-foreground/30 transition-all shadow-sm appearance-none"
            >
              <option value="">All Fabrics</option>
              {fabrics.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.sku} — {f.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <CalendarDays className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              type="datetime-local"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              className="w-full bg-background border border-foreground/10 rounded-xl pl-10 pr-4 py-3 text-[12px] font-medium text-foreground focus:outline-none focus:border-foreground/30 transition-all shadow-sm"
            />
          </div>
          <div className="relative">
             <CalendarDays className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              type="datetime-local"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              className="w-full bg-background border border-foreground/10 rounded-xl pl-10 pr-4 py-3 text-[12px] font-medium text-foreground focus:outline-none focus:border-foreground/30 transition-all shadow-sm"
            />
          </div>
        </div>
        
        {activeFilters.length > 0 && (
           <div className="flex justify-end">
             <button
              type="button"
              onClick={() => loadMovements()}
              className="px-5 py-2.5 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-[0.1em] hover:opacity-90 transition-all shadow-sm"
            >
              Apply Filters
            </button>
           </div>
        )}

        <div className="w-full rounded-2xl border border-foreground/10 overflow-hidden bg-background shadow-sm">
          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-foreground/[0.02] border-b border-foreground/10 text-[10px] uppercase font-bold text-foreground/50 tracking-widest">
                <tr>
                  <th className="px-5 py-4">When (IST)</th>
                  <th className="px-5 py-4">Fabric</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Qty</th>
                  <th className="px-5 py-4">Rate</th>
                  <th className="px-5 py-4">Value</th>
                  <th className="px-5 py-4">Notes</th>
                  <th className="px-5 py-4">By</th>
                  <th className="px-5 py-4">Balance</th>
                  <th className="px-5 py-4 text-right">Fix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-foreground/40">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Loading</span>
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-16 text-center">
                       <p className="text-[13px] font-bold text-foreground/60">No movements found</p>
                       <p className="text-[11px] text-foreground/40 mt-1">Try widening your filters or add a new movement.</p>
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const meters = num(m.balanceMetersAfter);
                    const warn =
                      m.balanceMetersAfter != null &&
                      meters < lowThreshold(m.fabric);
                    const borderL =
                      m.type === "IN"
                        ? "border-l-4 border-l-emerald-500/70"
                        : m.type === "OUT"
                          ? "border-l-4 border-l-red-500/70"
                          : "border-l-4 border-l-amber-500/60";
                    return (
                      <tr
                        key={m.id}
                        className={`hover:bg-foreground/[0.02] transition-colors duration-200 group ${borderL}`}
                      >
                        <td className="px-5 py-4 text-[12px] font-medium text-foreground/70">
                          {formatDateTimeIST(m.occurredAt)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-mono text-[11px] font-medium text-emerald-600 dark:text-emerald-400">{m.fabric.sku}</div>
                          <div className="font-bold text-[13px] text-foreground">{m.fabric.name}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                              m.type === "IN"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : m.type === "OUT"
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {typeLabel(m.type)}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-bold text-[13px]">
                          {num(m.quantity)} <span className="text-foreground/50">{m.quantityUnit}</span>
                        </td>
                        <td className="px-5 py-4 font-bold text-[13px]">{formatInr(num(m.rateAtMovement))}</td>
                        <td className="px-5 py-4 font-bold text-[13px] text-foreground">
                          {formatInr(num(m.totalValue))}
                        </td>
                        <td className="px-5 py-4 text-foreground/60 text-[12px] font-medium max-w-[160px] truncate">
                          {m.remarks || "—"}
                        </td>
                        <td className="px-5 py-4 text-[12px] font-medium text-foreground/60">{m.createdByName}</td>
                        <td
                          className={`px-5 py-4 font-bold text-[12px] ${
                            warn ? "text-amber-600 dark:text-amber-400 flex items-center gap-1" : "text-foreground/70"
                          }`}
                        >
                          {warn && <AlertTriangle className="w-3.5 h-3.5" />}
                          {runningBalanceLabel(m)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {m.type !== "ADJUSTMENT" ? (
                            <button
                              type="button"
                              onClick={() => openCorrect(m)}
                              className="px-3 py-1.5 bg-foreground/5 rounded-lg text-[9px] font-bold uppercase tracking-wider text-foreground/50 hover:text-foreground hover:bg-foreground/10 transition-colors"
                            >
                              Correct
                            </button>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {(modal === "add" || modal === "correct") && (
          <div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center p-4 lg:p-6 bg-background/80 backdrop-blur-md">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="w-full max-w-md glass rounded-[2rem] border border-foreground/10 shadow-2xl p-6 lg:p-8 flex flex-col gap-6 max-h-[92vh] overflow-y-auto"
            >
              <div>
                <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground">
                  {modal === "correct" ? "Node Correction Entry" : "New Movement"}
                </h2>
                <p className="text-[12px] text-foreground/60 mt-1 tracking-wide">
                  {modal === "correct" ? `Correcting spectrum node: ${correctTarget?.fabric.sku}` : "Recording fabric transition."}
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 ml-1">Fabric node *</label>
                  <select
                    value={form.fabricId}
                    onChange={(e) => onFabricPick(e.target.value)}
                    disabled={modal === "correct"}
                    className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground/30 shadow-sm appearance-none disabled:opacity-50"
                  >
                    <option value="">Select Fabric...</option>
                    {fabrics.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.sku} — {f.name}
                      </option>
                    ))}
                  </select>
                  {formErr.fabricId && <p className="text-rose-500 text-[10px] font-bold mt-1 uppercase tracking-widest ml-1">{formErr.fabricId}</p>}
                </div>

                {modal === "add" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 ml-1">Transition Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as "IN" | "OUT" }))}
                      className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground/30 shadow-sm appearance-none"
                    >
                      <option value="IN">In (Inbound)</option>
                      <option value="OUT">Out (Outbound)</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 ml-1">Quantity *</label>
                    <input
                      type="number"
                      step="any"
                      value={form.quantity}
                      onChange={(e) => setForm((s) => ({ ...s, quantity: e.target.value }))}
                      className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground/30 shadow-sm"
                    />
                    {formErr.quantity && (
                      <p className="text-rose-500 text-[10px] font-bold mt-1 uppercase tracking-widest ml-1">{formErr.quantity}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 ml-1">Unit</label>
                    <select
                      value={form.quantityUnit}
                      onChange={(e) => setForm((s) => ({ ...s, quantityUnit: e.target.value }))}
                      className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground/30 shadow-sm appearance-none"
                    >
                      <option value="m">m</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 ml-1">Rate (₹) *</label>
                  <input
                    type="number"
                    value={form.rateAtMovement}
                    onChange={(e) => setForm((s) => ({ ...s, rateAtMovement: e.target.value }))}
                    className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground/30 shadow-sm"
                  />
                  {formErr.rateAtMovement && (
                    <p className="text-rose-500 text-[10px] font-bold mt-1 uppercase tracking-widest ml-1">{formErr.rateAtMovement}</p>
                  )}
                </div>

                <div className="rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3 flex justify-between items-center group">
                  <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Valuation preview</span>
                  <span className="text-[14px] font-bold text-foreground">
                    {formatInr(modal === "correct" ? Math.abs(num(form.quantity)) * num(form.rateAtMovement) : previewTotal)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 ml-1">Date/time override</label>
                  <input
                    type="datetime-local"
                    value={form.occurredAt}
                    onChange={(e) => setForm((s) => ({ ...s, occurredAt: e.target.value }))}
                    className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground/30 shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 ml-1">Production Batch Link</label>
                  <select
                    value={form.productionBatchId}
                    onChange={(e) => setForm((s) => ({ ...s, productionBatchId: e.target.value }))}
                    className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground/30 shadow-sm appearance-none"
                  >
                    <option value="">None (Stray movement)</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.batchCode}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 ml-1">Remarks / Metadata</label>
                  <textarea
                    value={form.remarks}
                    onChange={(e) => setForm((s) => ({ ...s, remarks: e.target.value }))}
                    rows={2}
                    className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground/30 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-foreground/5">
                <button
                  type="button"
                  onClick={() => {
                    setModal(null);
                    setCorrectTarget(null);
                  }}
                  className="flex-1 px-4 py-3 bg-background border border-foreground/10 rounded-xl text-[11px] font-bold text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitMovement}
                  className="flex-[2] flex items-center justify-center px-4 py-3 bg-foreground text-background rounded-xl text-[11px] font-bold uppercase tracking-[0.1em] hover:opacity-90 transition-all shadow-lg shadow-foreground/10"
                >
                  Record Transition
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
