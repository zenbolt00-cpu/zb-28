"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ScanLine,
  RefreshCw,
  Sparkles,
  Palette,
} from "lucide-react";
import { suggestFabricSku } from "@/lib/manufacturing/sku";
import { mfgFetch } from "@/lib/manufacturing/mfg-fetch";
import { formatDateTimeIST } from "@/lib/manufacturing/ist";
import { formatInr } from "@/lib/manufacturing/inr";

type Fabric = {
  id: string;
  sku: string;
  name: string;
  costPerMeter: number;
  weightValue: number;
  weightUnit: string;
  totalMeters: number;
  status: string;
  lowStockMetersThreshold?: number | null;
  updatedAt: string;
};

function n(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const x = parseFloat(String(v ?? ""));
  return Number.isFinite(x) ? x : 0;
}

export default function FabricInventoryPage() {
  const [allFabrics, setAllFabrics] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [toast, setToast] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [scanInput, setScanInput] = useState("");

  const [modal, setModal] = useState<"add" | "edit" | "scan" | null>(null);
  const [editing, setEditing] = useState<Fabric | null>(null);
  const [scanFabric, setScanFabric] = useState<Fabric | null>(null);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    costPerMeter: "",
    weightValue: "",
    weightUnit: "kg",
    totalMeters: "",
    status: "ACTIVE",
    lowStockMetersThreshold: "",
  });
  const [formErr, setFormErr] = useState<Record<string, string>>({});

  const show = (m: string, t: "ok" | "err" = "ok") => {
    setToast({ m, t });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mfgFetch("/api/admin/manufacturing/fabric");
      const data = await res.json();
      if (!Array.isArray(data)) {
        setAllFabrics([]);
        if (data?.error) show(String(data.error), "err");
        return;
      }
      setAllFabrics(
        data.map((f: Fabric) => ({
          ...f,
          costPerMeter: n(f.costPerMeter),
          weightValue: n(f.weightValue),
          totalMeters: n(f.totalMeters),
          lowStockMetersThreshold:
            f.lowStockMetersThreshold == null ? null : n(f.lowStockMetersThreshold),
        }))
      );
    } catch {
      show("Could not load fabrics", "err");
      setAllFabrics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return allFabrics;
    return allFabrics.filter(
      (f) =>
        f.name.toLowerCase().includes(s) || f.sku.toLowerCase().includes(s)
    );
  }, [allFabrics, q]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    // Add: SKU optional — server auto-generates when empty. Edit/scan: keep SKU.
    if (modal !== "add" && !form.sku.trim()) e.sku = "Required";
    const c = Number(form.costPerMeter);
    if (!Number.isFinite(c) || c < 0) e.costPerMeter = "Invalid";
    const w = Number(form.weightValue);
    if (!Number.isFinite(w) || w < 0) e.weightValue = "Invalid";
    const m = Number(form.totalMeters);
    if (!Number.isFinite(m) || m < 0) e.totalMeters = "Invalid";
    setFormErr(e);
    return Object.keys(e).length === 0;
  };

  const openAdd = () => {
    setForm({
      name: "",
      // Two-word default avoids "Fabric" → middle segment FAB colliding with FAB- prefix
      sku: suggestFabricSku("New fabric"),
      costPerMeter: "",
      weightValue: "",
      weightUnit: "kg",
      totalMeters: "",
      status: "ACTIVE",
      lowStockMetersThreshold: "",
    });
    setFormErr({});
    setModal("add");
  };

  const openEdit = (f: Fabric) => {
    setEditing(f);
    setForm({
      name: f.name,
      sku: f.sku,
      costPerMeter: String(n(f.costPerMeter)),
      weightValue: String(n(f.weightValue)),
      weightUnit: f.weightUnit === "g" ? "g" : "kg",
      totalMeters: String(n(f.totalMeters)),
      status: f.status,
      lowStockMetersThreshold:
        f.lowStockMetersThreshold != null ? String(f.lowStockMetersThreshold) : "",
    });
    setFormErr({});
    setModal("edit");
  };

  const genSku = () => {
    const base = form.name.trim() || "New fabric";
    let next = suggestFabricSku(base);
    const taken = new Set(allFabrics.map((f) => f.sku.toUpperCase()));
    for (let i = 0; i < 24 && taken.has(next.toUpperCase()); i++) {
      next = suggestFabricSku(base + i);
    }
    setForm((s) => ({ ...s, sku: next }));
  };

  const saveFabric = async (fromScan?: boolean) => {
    if (!fromScan && !validate()) return;
    const id = fromScan ? scanFabric?.id : editing?.id;
    const low =
      form.lowStockMetersThreshold.trim() === ""
        ? null
        : Number(form.lowStockMetersThreshold);
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      costPerMeter: Number(form.costPerMeter) || 0,
      weightValue: Number(form.weightValue) || 0,
      weightUnit: form.weightUnit,
      totalMeters: Number(form.totalMeters) || 0,
      status: form.status,
      lowStockMetersThreshold:
        low !== null && Number.isFinite(low) && low >= 0 ? low : null,
    };

    try {
      if (modal === "add") {
        const res = await mfgFetch("/api/admin/manufacturing/fabric", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const j = await res.json();
        if (!res.ok) {
          const msg = j.error || "Save failed";
          if (res.status === 409 && /sku/i.test(String(msg))) {
            throw new Error(
              `${msg} Tip: click Generate next to SKU (or clear SKU to let the server pick one).`
            );
          }
          throw new Error(msg);
        }
        show("Fabric saved to database");
      } else if (modal === "edit" && id) {
        const res = await mfgFetch(`/api/admin/manufacturing/fabric/${id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        const j = await res.json();
        if (!res.ok) {
          const msg = j.error || "Update failed";
          if (res.status === 409 && /sku/i.test(String(msg))) {
            throw new Error(`${msg} Use a different SKU or Generate.`);
          }
          throw new Error(msg);
        }
        show("Fabric updated");
      } else if (modal === "scan" && id) {
        const res = await mfgFetch(`/api/admin/manufacturing/fabric/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            costPerMeter: payload.costPerMeter,
            totalMeters: payload.totalMeters,
            weightValue: payload.weightValue,
            weightUnit: payload.weightUnit,
            source: "scan",
          }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Update failed");
        show("Scan update saved");
      }
      setModal(null);
      setScanFabric(null);
      setEditing(null);
      load();
    } catch (e: unknown) {
      show(e instanceof Error ? e.message : "Error", "err");
    }
  };

  const handleScanKey = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !scanInput.trim()) return;
    e.preventDefault();
    try {
      const res = await mfgFetch(
        `/api/admin/manufacturing/fabric/lookup?q=${encodeURIComponent(scanInput.trim())}`
      );
      if (!res.ok) {
        show("No fabric for this SKU / barcode", "err");
        return;
      }
      const raw = await res.json();
      const f: Fabric = {
        ...raw,
        costPerMeter: n(raw.costPerMeter),
        weightValue: n(raw.weightValue),
        totalMeters: n(raw.totalMeters),
      };
      setScanFabric(f);
      setForm({
        name: f.name,
        sku: f.sku,
        costPerMeter: String(f.costPerMeter),
        weightValue: String(f.weightValue),
        weightUnit: f.weightUnit === "g" ? "g" : "kg",
        totalMeters: String(f.totalMeters),
        status: f.status,
        lowStockMetersThreshold:
          f.lowStockMetersThreshold != null ? String(f.lowStockMetersThreshold) : "",
      });
      setModal("scan");
      setScanInput("");
    } catch {
      show("Lookup failed", "err");
    }
  };

  const remove = async (f: Fabric) => {
    if (!confirm(`Delete ${f.sku}?`)) return;
    try {
      const res = await mfgFetch(`/api/admin/manufacturing/fabric/${f.id}`, {
        method: "DELETE",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Delete failed");
      show("Fabric deleted");
      load();
    } catch (e: unknown) {
      show(e instanceof Error ? e.message : "Error", "err");
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-[1500px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-inter">Fabric Inventory</h1>
          <p className="text-sm text-foreground/55 mt-1 max-w-xl">
            Master fabric list — all changes persist to the database. Filter updates instantly on this
            page.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 self-start px-5 py-3 rounded-2xl bg-foreground text-background text-sm font-bold shadow-lg hover:opacity-95 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          Add New Fabric
        </button>
      </div>

      <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent p-5 shadow-[0_0_40px_-12px_rgba(16,185,129,0.35)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ScanLine className="w-5 h-5 text-emerald-500" />
          Scan / quick update
        </div>
        <p className="text-xs text-foreground/50 mt-2 mb-3">
          Type or scan SKU, press Enter — adjust weight, meters, and price, then save.
        </p>
        <input
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
          onKeyDown={handleScanKey}
          placeholder="Scan or type SKU…"
          className="w-full rounded-2xl border border-foreground/10 bg-background/80 px-4 py-3.5 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-shadow"
        />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or SKU (live filter)…"
          className="flex-1 min-w-[200px] max-w-md rounded-2xl border border-foreground/10 bg-foreground/[0.04] px-4 py-2.5 text-sm"
        />
        <button
          type="button"
          onClick={() => load()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-foreground/10 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="rounded-3xl border border-foreground/10 bg-foreground/[0.02] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[920px]">
            <thead className="bg-foreground/[0.06] text-foreground/45 uppercase tracking-wider text-[10px] font-bold border-b border-foreground/10">
              <tr>
                <th className="px-4 py-3.5 w-10" />
                <th className="px-4 py-3.5">Fabric</th>
                <th className="px-4 py-3.5 font-mono">SKU</th>
                <th className="px-4 py-3.5">₹ / m</th>
                <th className="px-4 py-3.5">Weight</th>
                <th className="px-4 py-3.5">Meters</th>
                <th className="px-4 py-3.5">Low stock (m)</th>
                <th className="px-4 py-3.5">Updated (IST)</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-foreground/40">
                    <Loader2 className="w-6 h-6 animate-spin inline mr-2" />
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-20 text-center">
                    <div className="max-w-sm mx-auto">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-foreground/10 flex items-center justify-center mb-4">
                        <Palette className="w-8 h-8 text-foreground/35" />
                      </div>
                      <p className="text-foreground/55 text-sm mb-4">
                        No fabrics yet, or nothing matches your search. Add cotton, silk, georgette, and
                        other rolls to get started.
                      </p>
                      <button
                        type="button"
                        onClick={openAdd}
                        className="px-5 py-2.5 rounded-xl bg-foreground text-background text-xs font-bold"
                      >
                        Add New Fabric
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((f) => (
                  <tr
                    key={f.id}
                    className="hover:bg-foreground/[0.04] transition-colors duration-200 group"
                  >
                    <td className="px-4 py-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/30 to-amber-400/20 border border-foreground/10 flex items-center justify-center">
                        <Palette className="w-4 h-4 text-foreground/50" />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">{f.name}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-emerald-600/90 dark:text-emerald-400">
                      {f.sku}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{formatInr(n(f.costPerMeter))}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {n(f.weightValue).toLocaleString("en-IN", { maximumFractionDigits: 3 })}{" "}
                      <span className="text-foreground/45">{f.weightUnit}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {n(f.totalMeters).toLocaleString("en-IN", { maximumFractionDigits: 2 })} m
                    </td>
                    <td className="px-4 py-3 text-foreground/50 tabular-nums">
                      {f.lowStockMetersThreshold != null ? f.lowStockMetersThreshold : "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground/50 whitespace-nowrap text-[11px]">
                      {formatDateTimeIST(f.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          f.status === "ACTIVE"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25"
                            : "bg-foreground/10 text-foreground/45 border border-foreground/10"
                        }`}
                      >
                        {f.status === "ACTIVE" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(f)}
                        className="p-2 rounded-xl hover:bg-foreground/10 text-foreground/60"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(f)}
                        className="p-2 rounded-xl hover:bg-red-500/10 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
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

      {(modal === "add" || modal === "edit" || modal === "scan") && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-foreground/10 glass shadow-2xl p-6 space-y-3 max-h-[92vh] overflow-y-auto">
            <h2 className="text-lg font-bold">
              {modal === "add" ? "Add fabric" : modal === "scan" ? "Quick update" : "Edit fabric"}
            </h2>
            {modal === "scan" && (
              <p className="text-sm text-foreground/55">
                {scanFabric?.name}{" "}
                <span className="font-mono text-xs">({scanFabric?.sku})</span>
              </p>
            )}
            {modal !== "scan" && (
              <>
                <div>
                  <label className="text-[11px] font-bold text-foreground/45">Fabric name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2.5 text-sm"
                  />
                  {formErr.name && <p className="text-red-500 text-[11px] mt-1">{formErr.name}</p>}
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-foreground/45">
                      {modal === "add" ? "SKU (optional — auto if empty)" : "SKU *"}
                    </label>
                    <button
                      type="button"
                      onClick={genSku}
                      className="text-[11px] font-semibold text-foreground/50 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Generate
                    </button>
                  </div>
                  <input
                    value={form.sku}
                    onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2.5 text-sm font-mono"
                  />
                  {formErr.sku && <p className="text-red-500 text-[11px] mt-1">{formErr.sku}</p>}
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-foreground/45">Cost / meter (₹) *</label>
                <input
                  type="number"
                  value={form.costPerMeter}
                  onChange={(e) => setForm((s) => ({ ...s, costPerMeter: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2.5 text-sm"
                />
                {formErr.costPerMeter && (
                  <p className="text-red-500 text-[11px] mt-1">{formErr.costPerMeter}</p>
                )}
              </div>
              <div>
                <label className="text-[11px] font-bold text-foreground/45">Total meters *</label>
                <input
                  type="number"
                  value={form.totalMeters}
                  onChange={(e) => setForm((s) => ({ ...s, totalMeters: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2.5 text-sm"
                />
                {formErr.totalMeters && (
                  <p className="text-red-500 text-[11px] mt-1">{formErr.totalMeters}</p>
                )}
              </div>
              <div>
                <label className="text-[11px] font-bold text-foreground/45">Total weight *</label>
                <input
                  type="number"
                  value={form.weightValue}
                  onChange={(e) => setForm((s) => ({ ...s, weightValue: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2.5 text-sm"
                />
                {formErr.weightValue && (
                  <p className="text-red-500 text-[11px] mt-1">{formErr.weightValue}</p>
                )}
              </div>
              <div>
                <label className="text-[11px] font-bold text-foreground/45">Unit</label>
                <select
                  value={form.weightUnit}
                  onChange={(e) => setForm((s) => ({ ...s, weightUnit: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2.5 text-sm"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                </select>
              </div>
            </div>
            {modal !== "scan" && (
              <>
                <div>
                  <label className="text-[11px] font-bold text-foreground/45">
                    Low stock alert (meters, optional)
                  </label>
                  <input
                    type="number"
                    value={form.lowStockMetersThreshold}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, lowStockMetersThreshold: e.target.value }))
                    }
                    placeholder="e.g. 10"
                    className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-foreground/45">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2.5 text-sm"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </>
            )}
            <div className="flex gap-2 justify-end pt-3 border-t border-foreground/10">
              <button
                type="button"
                onClick={() => {
                  setModal(null);
                  setScanFabric(null);
                  setEditing(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-foreground/10 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveFabric(modal === "scan")}
                className="px-4 py-2.5 rounded-xl bg-foreground text-background text-xs font-bold"
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
