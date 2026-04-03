"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, RefreshCw, AlertTriangle } from "lucide-react";
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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1500px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div className="space-y-1">
          <div className="px-2 py-0.5 bg-foreground/[0.03] rounded-md text-[7px] font-normal text-foreground/50 uppercase tracking-[0.3em] w-fit tracking-widest">manufacturing hub</div>
          <h1 className="text-lg font-normal text-foreground uppercase tracking-[0.2em] mb-0.5 leading-none mt-1 font-inter">
            Fabric Movement
          </h1>
          <p className="text-[9px] text-foreground/40 font-normal uppercase tracking-[0.2em] mt-1">
            Immutable ledger — corrections add new rows. Balances shown in IST. Low stock highlights when nodes fall below thresholds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
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
            className="flex items-center gap-2 px-5 py-2.5 bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-foreground/[0.05] rounded-md text-[8px] font-normal uppercase tracking-[0.2em] text-foreground/80 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            ADD MOVEMENT
          </button>
          <button
            type="button"
            onClick={() => loadMovements()}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-foreground/[0.05] rounded-md text-[8px] font-normal uppercase tracking-[0.2em] text-foreground/80 dark:text-foreground/60 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} strokeWidth={1.5} />
            REFRESH
          </button>
        </div>
      </div>

      <div className="bg-white/50 dark:bg-white/[0.01] backdrop-blur-3xl rounded-[1rem] p-3 border border-foreground/[0.02] shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
        <input
          placeholder="SEARCH SPECTRUM…"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          className="bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em]"
        />
        <select
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
          className="bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em]"
        >
          <option value="">ALL TYPES</option>
          <option value="IN">IN</option>
          <option value="OUT">OUT</option>
          <option value="ADJUSTMENT">CORRECTION</option>
        </select>
        <select
          value={filters.fabricId}
          onChange={(e) => setFilters((f) => ({ ...f, fabricId: e.target.value }))}
          className="bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em]"
        >
          <option value="">ALL FABRICS</option>
          {fabrics.map((f) => (
            <option key={f.id} value={f.id}>
              {f.sku}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={filters.from}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          className="bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all"
        />
        <input
          type="datetime-local"
          value={filters.to}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          className="bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all"
        />
        <button
          type="button"
          onClick={() => loadMovements()}
          className="bg-foreground text-background rounded-md px-3 py-2 text-[8px] font-normal uppercase tracking-[0.3em] hover:opacity-90 transition-all"
        >
          APPLY FILTERS
        </button>
      </div>

      <div className="bg-white/50 dark:bg-white/[0.01] backdrop-blur-3xl rounded-[1rem] border border-foreground/[0.02] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] min-w-[1040px]">
            <thead className="bg-foreground/[0.02] text-foreground/30 uppercase tracking-[0.2em] text-[8px] font-normal border-b border-foreground/[0.03]">
              <tr>
                <th className="px-3 py-4">When (IST)</th>
                <th className="px-3 py-4">Fabric</th>
                <th className="px-3 py-4">Type</th>
                <th className="px-3 py-4">Qty</th>
                <th className="px-3 py-4">Rate</th>
                <th className="px-3 py-4">Value</th>
                <th className="px-3 py-4">Notes</th>
                <th className="px-3 py-4">By</th>
                <th className="px-3 py-4">Balance</th>
                <th className="px-3 py-4 text-right">Fix</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-14 text-center text-foreground/40">
                    <Loader2 className="w-6 h-6 animate-spin inline" />
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-14 text-center text-foreground/45">
                    No rows — add a movement or widen filters.
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
                      className={`border-b border-foreground/[0.06] hover:bg-foreground/[0.03] transition-colors ${borderL}`}
                    >
                      <td className="px-3 py-2.5 whitespace-nowrap text-foreground/70">
                        {formatDateTimeIST(m.occurredAt)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-mono text-[10px] text-foreground/45">{m.fabric.sku}</div>
                        <div className="font-medium text-foreground">{m.fabric.name}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[7px] font-normal uppercase tracking-[0.2em] ${
                            m.type === "IN"
                              ? "bg-emerald-500/[0.08] text-emerald-500/60 border border-emerald-500/[0.08]"
                              : m.type === "OUT"
                                ? "bg-rose-500/[0.08] text-rose-500/60 border border-rose-500/[0.08]"
                                : "bg-amber-500/[0.08] text-amber-500/60 border border-amber-500/[0.08]"
                          }`}
                        >
                          {typeLabel(m.type)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {num(m.quantity)} {m.quantityUnit}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">{formatInr(num(m.rateAtMovement))}</td>
                      <td className="px-3 py-2.5 tabular-nums font-medium">
                        {formatInr(num(m.totalValue))}
                      </td>
                      <td className="px-3 py-2.5 text-foreground/50 max-w-[160px] truncate">
                        {m.remarks || "—"}
                      </td>
                      <td className="px-3 py-2.5 text-foreground/55">{m.createdByName}</td>
                      <td
                        className={`px-3 py-2.5 tabular-nums text-[10px] ${
                          warn ? "text-amber-600 dark:text-amber-300 font-bold" : "text-foreground/75"
                        }`}
                      >
                        {runningBalanceLabel(m)}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {m.type !== "ADJUSTMENT" ? (
                          <button
                            type="button"
                            onClick={() => openCorrect(m)}
                            className="p-1 px-2.5 bg-foreground/[0.02] border border-foreground/[0.05] rounded-md text-[7px] font-normal uppercase tracking-[0.2em] text-foreground/40 hover:text-foreground/80 transition-all"
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

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl ${
            toast.t === "ok" ? "bg-foreground text-background" : "bg-red-600 text-white"
          }`}
        >
          {toast.m}
        </div>
      )}

      {(modal === "add" || modal === "correct") && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white/90 dark:bg-black/80 backdrop-blur-2xl rounded-[1rem] border border-foreground/[0.05] shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="space-y-1">
              <h2 className="text-[11px] font-normal text-foreground uppercase tracking-[0.2em] leading-none">
                {modal === "correct" ? "NODE CORRECTION ENTRY" : "NEW MOVEMENT REGISTRATION"}
              </h2>
              <p className="text-[9px] text-foreground/40 uppercase tracking-[0.2em]">
                {modal === "correct" ? `CORRECTING SPECTRUM NODE: ${correctTarget?.fabric.sku}` : "RECORDING FABRIC TRANSITION IN SPECTRUM."}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Fabric node *</label>
                <select
                  value={form.fabricId}
                  onChange={(e) => onFabricPick(e.target.value)}
                  disabled={modal === "correct"}
                  className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em] appearance-none disabled:opacity-60"
                >
                  <option value="">SELECT NODE…</option>
                  {fabrics.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.sku} — {f.name}
                    </option>
                  ))}
                </select>
                {formErr.fabricId && <p className="text-rose-500 text-[7px] mt-1 uppercase tracking-widest">{formErr.fabricId}</p>}
              </div>

              {modal === "add" && (
                <div className="space-y-1.5">
                  <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Transition Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as "IN" | "OUT" }))}
                    className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em] appearance-none"
                  >
                    <option value="IN">IN (INBOUND)</option>
                    <option value="OUT">OUT (OUTBOUND)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Quantity *</label>
                  <input
                    type="number"
                    step="any"
                    value={form.quantity}
                    onChange={(e) => setForm((s) => ({ ...s, quantity: e.target.value }))}
                    className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all"
                  />
                  {formErr.quantity && (
                    <p className="text-rose-500 text-[7px] mt-1 uppercase tracking-widest">{formErr.quantity}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Unit</label>
                  <select
                    value={form.quantityUnit}
                    onChange={(e) => setForm((s) => ({ ...s, quantityUnit: e.target.value }))}
                    className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em] appearance-none"
                  >
                    <option value="m">m</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Rate (₹) *</label>
                <input
                  type="number"
                  value={form.rateAtMovement}
                  onChange={(e) => setForm((s) => ({ ...s, rateAtMovement: e.target.value }))}
                  className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all"
                />
                {formErr.rateAtMovement && (
                  <p className="text-rose-500 text-[7px] mt-1 uppercase tracking-widest">{formErr.rateAtMovement}</p>
                )}
              </div>

              <div className="rounded-md border border-foreground/[0.05] bg-foreground/[0.02] px-3 py-2 flex justify-between items-center group">
                <span className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em]">valuation preview</span>
                <span className="text-[11px] font-normal tabular-nums text-foreground">
                  {formatInr(modal === "correct" ? Math.abs(num(form.quantity)) * num(form.rateAtMovement) : previewTotal)}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Date/time override</label>
                <input
                  type="datetime-local"
                  value={form.occurredAt}
                  onChange={(e) => setForm((s) => ({ ...s, occurredAt: e.target.value }))}
                  className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Production Batch Link</label>
                <select
                  value={form.productionBatchId}
                  onChange={(e) => setForm((s) => ({ ...s, productionBatchId: e.target.value }))}
                  className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em] appearance-none"
                >
                  <option value="">NONE (STRAY MOVEMENT)</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchCode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Remarks / Metadata</label>
                <textarea
                  value={form.remarks}
                  onChange={(e) => setForm((s) => ({ ...s, remarks: e.target.value }))}
                  rows={2}
                  className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em]"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-6 border-t border-foreground/[0.05]">
              <button
                type="button"
                onClick={() => {
                  setModal(null);
                  setCorrectTarget(null);
                }}
                className="px-5 py-2 rounded-md text-[8px] font-normal uppercase tracking-[0.2em] text-foreground/40 hover:text-foreground/60 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitMovement}
                className="px-8 py-2 bg-foreground text-background rounded-md text-[8px] font-normal uppercase tracking-[0.3em] shadow-lg shadow-foreground/5 hover:opacity-90 transition-all"
              >
                RECORD TRANSITION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
