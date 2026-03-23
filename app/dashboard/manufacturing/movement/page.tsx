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
    <div className="space-y-6 pb-12 max-w-[1500px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-inter">Fabric Movement</h1>
        <p className="text-sm text-foreground/55 mt-1 max-w-2xl">
          Immutable ledger — corrections add new rows. Balances shown in IST. Low stock highlights when
          meters fall below each fabric&apos;s threshold (default 10 m).
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
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
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-foreground text-background text-sm font-bold"
        >
          <Plus className="w-4 h-4" />
          Add movement
        </button>
        <button
          type="button"
          onClick={() => loadMovements()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-foreground/10 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeFilters.map((p) => (
              <span
                key={p}
                className="px-2.5 py-1 rounded-full bg-foreground/10 border border-foreground/10 text-[10px] font-bold text-foreground/60"
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-foreground/10 bg-foreground/[0.02] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <input
          placeholder="Search fabric / SKU…"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          className="rounded-xl border border-foreground/10 bg-background/50 px-3 py-2.5 text-sm"
        />
        <select
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
          className="rounded-xl border border-foreground/10 bg-background/50 px-3 py-2.5 text-sm"
        >
          <option value="">All types</option>
          <option value="IN">IN</option>
          <option value="OUT">OUT</option>
          <option value="ADJUSTMENT">Correction</option>
        </select>
        <select
          value={filters.fabricId}
          onChange={(e) => setFilters((f) => ({ ...f, fabricId: e.target.value }))}
          className="rounded-xl border border-foreground/10 bg-background/50 px-3 py-2.5 text-sm"
        >
          <option value="">All fabrics</option>
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
          className="rounded-xl border border-foreground/10 bg-background/50 px-3 py-2.5 text-sm"
        />
        <input
          type="datetime-local"
          value={filters.to}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          className="rounded-xl border border-foreground/10 bg-background/50 px-3 py-2.5 text-sm"
        />
        <button
          type="button"
          onClick={() => loadMovements()}
          className="rounded-xl border border-foreground/10 px-3 py-2.5 text-sm font-semibold hover:bg-foreground/5"
        >
          Apply
        </button>
      </div>

      <div className="rounded-3xl border border-foreground/10 overflow-hidden shadow-lg bg-foreground/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] min-w-[1040px]">
            <thead className="bg-foreground/[0.06] text-foreground/45 uppercase text-[10px] font-bold border-b border-foreground/10">
              <tr>
                <th className="px-3 py-3">When (IST)</th>
                <th className="px-3 py-3">Fabric</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Qty</th>
                <th className="px-3 py-3">Rate</th>
                <th className="px-3 py-3">Value</th>
                <th className="px-3 py-3">Notes</th>
                <th className="px-3 py-3">By</th>
                <th className="px-3 py-3">Balance</th>
                <th className="px-3 py-3 text-right">Fix</th>
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
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.type === "IN"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : m.type === "OUT"
                                ? "bg-red-500/15 text-red-700 dark:text-red-300"
                                : "bg-amber-500/15 text-amber-800 dark:text-amber-200"
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
                            className="text-[10px] font-bold text-foreground/45 hover:text-foreground inline-flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3 h-3" />
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
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-foreground/10 glass p-6 space-y-3 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold">{modal === "correct" ? "Correction entry" : "Add movement"}</h2>
            <div>
              <label className="text-[11px] font-bold text-foreground/45">Fabric *</label>
              <select
                value={form.fabricId}
                onChange={(e) => onFabricPick(e.target.value)}
                disabled={modal === "correct"}
                className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2.5 text-sm disabled:opacity-60"
              >
                <option value="">Select…</option>
                {fabrics.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.sku} — {f.name}
                  </option>
                ))}
              </select>
              {formErr.fabricId && <p className="text-red-500 text-[11px] mt-1">{formErr.fabricId}</p>}
            </div>
            {modal === "add" && (
              <div>
                <label className="text-[11px] font-bold text-foreground/45">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as "IN" | "OUT" }))}
                  className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2.5 text-sm"
                >
                  <option value="IN">IN</option>
                  <option value="OUT">OUT</option>
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-foreground/45">Quantity *</label>
                <input
                  type="number"
                  step="any"
                  value={form.quantity}
                  onChange={(e) => setForm((s) => ({ ...s, quantity: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2.5 text-sm"
                />
                {formErr.quantity && (
                  <p className="text-red-500 text-[11px] mt-1">{formErr.quantity}</p>
                )}
              </div>
              <div>
                <label className="text-[11px] font-bold text-foreground/45">Unit</label>
                <select
                  value={form.quantityUnit}
                  onChange={(e) => setForm((s) => ({ ...s, quantityUnit: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2.5 text-sm"
                >
                  <option value="m">m</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-foreground/45">Rate (₹) *</label>
              <input
                type="number"
                value={form.rateAtMovement}
                onChange={(e) => setForm((s) => ({ ...s, rateAtMovement: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2.5 text-sm"
              />
              {formErr.rateAtMovement && (
                <p className="text-red-500 text-[11px] mt-1">{formErr.rateAtMovement}</p>
              )}
            </div>
            <div className="rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2 flex justify-between text-sm">
              <span className="text-foreground/45">Total value</span>
              <span className="font-bold tabular-nums">
                {formatInr(modal === "correct" ? Math.abs(num(form.quantity)) * num(form.rateAtMovement) : previewTotal)}
              </span>
            </div>
            <div>
              <label className="text-[11px] font-bold text-foreground/45">Date/time</label>
              <input
                type="datetime-local"
                value={form.occurredAt}
                onChange={(e) => setForm((s) => ({ ...s, occurredAt: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-foreground/45">Batch link (optional)</label>
              <select
                value={form.productionBatchId}
                onChange={(e) => setForm((s) => ({ ...s, productionBatchId: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2.5 text-sm"
              >
                <option value="">None</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchCode}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-foreground/45">Remarks</label>
              <textarea
                value={form.remarks}
                onChange={(e) => setForm((s) => ({ ...s, remarks: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2.5 text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setModal(null);
                  setCorrectTarget(null);
                }}
                className="px-4 py-2 rounded-xl border border-foreground/10 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitMovement}
                className="px-4 py-2 rounded-xl bg-foreground text-background text-xs font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
