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
  Search,
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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1500px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div className="space-y-1">
          <div className="px-2 py-0.5 bg-foreground/[0.03] rounded-md text-[7px] font-normal text-foreground/50 uppercase tracking-[0.3em] w-fit tracking-widest">manufacturing hub</div>
          <h1 className="text-lg font-normal text-foreground uppercase tracking-[0.2em] mb-0.5 leading-none mt-1 font-inter">
            Fabric Inventory
          </h1>
          <p className="text-[9px] text-foreground/40 font-normal uppercase tracking-[0.2em] mt-1">
            Manage your fabric spectrum — {allFabrics.length} nodes. All changes persist to the database.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-foreground/[0.05] rounded-md text-[8px] font-normal uppercase tracking-[0.2em] text-foreground/80 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
          ADD NEW FABRIC
        </button>
      </div>

      <div className="bg-white/50 dark:bg-white/[0.01] backdrop-blur-3xl rounded-[1rem] p-4 border border-foreground/[0.02] shadow-sm">
        <div className="flex items-center gap-2 text-[8px] font-normal uppercase tracking-[0.3em] text-foreground/60">
          <ScanLine className="w-3.5 h-3.5 text-emerald-500/60" strokeWidth={1.5} />
          Scan / quick update
        </div>
        <p className="text-[8px] text-foreground/30 mt-1.5 mb-3 uppercase tracking-[0.2em]">
          Refinery input: Type or scan SKU, press Enter — adjust weight, meters, and price.
        </p>
        <input
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
          onKeyDown={handleScanKey}
          placeholder="SCAN SPECTRUM SKU…"
          className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-4 py-2 text-[10px] font-normal text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em]"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/20" strokeWidth={1.5} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="SEARCH SPECTRUM NODES…"
            className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md pl-9 pr-4 py-2 text-[10px] font-normal text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em]"
          />
        </div>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-foreground/[0.05] rounded-md text-[8px] font-normal uppercase tracking-[0.2em] text-foreground/80 dark:text-foreground/60 transition-all active:scale-95"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} strokeWidth={1.5} />
          REFRESH
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
                        className={`inline-flex px-2 py-0.5 rounded-md text-[7px] font-normal uppercase tracking-[0.2em] ${
                          f.status === "ACTIVE"
                            ? "bg-emerald-500/[0.08] text-emerald-500/60 border border-emerald-500/[0.08]"
                            : "bg-foreground/[0.04] text-foreground/30 border border-foreground/[0.05]"
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(f)}
                          className="p-1.5 bg-foreground/[0.01] border border-foreground/[0.02] rounded-md transition-all text-foreground/20 hover:text-foreground/60"
                        >
                          <Pencil className="w-3 h-3" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(f)}
                          className="p-1.5 bg-red-500/[0.01] border border-red-500/[0.05] rounded-md transition-all text-red-500/30 hover:text-red-500/60"
                        >
                          <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                        </button>
                      </div>
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
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-white/90 dark:bg-black/80 backdrop-blur-2xl rounded-[1rem] border border-foreground/[0.05] shadow-2xl p-6 space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="space-y-1">
              <h2 className="text-[11px] font-normal text-foreground uppercase tracking-[0.2em] leading-none">
                {modal === "add" ? "NEW NODE ENTRY" : modal === "scan" ? "QUICK REFINERY UPDATE" : "NODE MODIFICATION"}
              </h2>
              <p className="text-[9px] text-foreground/40 uppercase tracking-[0.2em]">
                {modal === "add" ? "Registering a new fabric spectrum node." : modal === "scan" ? `UPDATING SPECTRUM: ${scanFabric?.sku}` : `MODIFYING NODE: ${editing?.sku}`}
              </p>
            </div>

            {modal === "scan" && (
              <div className="px-3 py-2 bg-foreground/[0.02] border border-foreground/[0.03] rounded-md">
                <p className="text-[10px] font-normal text-foreground uppercase tracking-[0.1em]">
                  {scanFabric?.name}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {modal !== "scan" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Fabric name *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                      className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em]"
                    />
                    {formErr.name && <p className="text-rose-500 text-[7px] mt-1 uppercase tracking-widest">{formErr.name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em]">
                        {modal === "add" ? "SKU (AUTO-GENERATE IF EMPTY)" : "SKU *"}
                      </label>
                      <button
                        type="button"
                        onClick={genSku}
                        className="text-[7px] font-normal text-foreground/40 hover:text-foreground/80 uppercase tracking-widest flex items-center gap-1 transition-colors"
                      >
                        <Sparkles className="w-2.5 h-2.5" /> RE-GENERATE
                      </button>
                    </div>
                    <input
                      value={form.sku}
                      onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))}
                      className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all font-mono uppercase tracking-[0.1em]"
                    />
                    {formErr.sku && <p className="text-rose-500 text-[7px] mt-1 uppercase tracking-widest">{formErr.sku}</p>}
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Cost / meter (₹) *</label>
                  <input
                    type="number"
                    value={form.costPerMeter}
                    onChange={(e) => setForm((s) => ({ ...s, costPerMeter: e.target.value }))}
                    className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all"
                  />
                  {formErr.costPerMeter && (
                    <p className="text-rose-500 text-[7px] mt-1 uppercase tracking-widest">{formErr.costPerMeter}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Total meters *</label>
                  <input
                    type="number"
                    value={form.totalMeters}
                    onChange={(e) => setForm((s) => ({ ...s, totalMeters: e.target.value }))}
                    className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all"
                  />
                  {formErr.totalMeters && (
                    <p className="text-rose-500 text-[7px] mt-1 uppercase tracking-widest">{formErr.totalMeters}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Total weight *</label>
                  <input
                    type="number"
                    value={form.weightValue}
                    onChange={(e) => setForm((s) => ({ ...s, weightValue: e.target.value }))}
                    className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all"
                  />
                  {formErr.weightValue && (
                    <p className="text-rose-500 text-[7px] mt-1 uppercase tracking-widest">{formErr.weightValue}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Unit</label>
                  <select
                    value={form.weightUnit}
                    onChange={(e) => setForm((s) => ({ ...s, weightUnit: e.target.value }))}
                    className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em] appearance-none"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                  </select>
                </div>
              </div>
              {modal !== "scan" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">
                      Low stock alert (meters, optional)
                    </label>
                    <input
                      type="number"
                      value={form.lowStockMetersThreshold}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, lowStockMetersThreshold: e.target.value }))
                      }
                      placeholder="THRESHOLD"
                      className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
                      className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em] appearance-none"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-6 border-t border-foreground/[0.05]">
              <button
                type="button"
                onClick={() => {
                  setModal(null);
                  setScanFabric(null);
                  setEditing(null);
                }}
                className="px-5 py-2 rounded-md text-[8px] font-normal uppercase tracking-[0.2em] text-foreground/40 hover:text-foreground/60 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveFabric(modal === "scan")}
                className="px-8 py-2 bg-foreground text-background rounded-md text-[8px] font-normal uppercase tracking-[0.3em] shadow-lg shadow-foreground/5 hover:opacity-90 transition-all"
              >
                SAVE NODE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
