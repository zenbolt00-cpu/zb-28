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
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="pb-20 space-y-10 relative z-10"
    >
      {/* Vibrant Orb Backgrounds */}
      <div className="absolute -right-24 -top-24 w-96 h-96 bg-foreground/5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -left-24 top-1/2 w-72 h-72 bg-foreground/5 blur-3xl rounded-full pointer-events-none" />

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

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 px-4 pt-4 mb-12 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-2 lg:mb-6">
            <div className="w-14 h-14 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground/50 dark:text-foreground/30 border border-foreground/5 shadow-2xl">
              <Palette className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground uppercase tracking-tighter leading-none">
                Fabric
              </h1>
              <p className="text-[11px] text-foreground/50 dark:text-foreground/30 font-bold uppercase tracking-[0.4em] mt-2">
                Inventory Spectrum
              </p>
            </div>
          </div>
          <p className="text-[11px] lg:text-[12px] text-foreground/70 tracking-wide max-w-xl font-medium leading-relaxed">
             Manage your fabric spectrum — {allFabrics.length} nodes. Real-time stock levels, cost per meter, and automated low-stock warnings.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-3 px-6 py-3 bg-background dark:bg-white/[0.03] border border-foreground/[0.08] text-foreground rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-foreground/[0.02] disabled:opacity-50 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={2.5} />
            Refresh
          </button>

          <button
            onClick={openAdd}
            className="flex items-center gap-3 px-8 py-3 bg-foreground text-background rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-foreground/20"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Add New Fabric
          </button>
        </div>
      </div>

       <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.8 }}
        className="glass-card rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-8 flex flex-col gap-6"
      >
        <div className="bg-background border border-foreground/10 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col gap-3">
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600/80 dark:text-emerald-500/80">
              <ScanLine className="w-4 h-4" />
              Scan / Quick Update
            </div>
            <p className="text-[11px] text-foreground/50 max-w-md leading-relaxed">
              Refinery input: Type or scan SKU, press Enter — adjust weight, meters, and price.
            </p>
            <input
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={handleScanKey}
              placeholder="SCAN SPECTRUM SKU…"
              className="w-full max-w-lg bg-background border border-foreground/20 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/40 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="relative w-full max-w-md">
           <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search spectrum nodes…"
            className="w-full bg-background border border-foreground/10 rounded-xl pl-10 pr-4 py-3 text-[12px] font-medium text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-foreground/30 transition-all shadow-sm"
          />
        </div>

        <div className="w-full rounded-2xl border border-foreground/10 overflow-hidden bg-background shadow-sm mt-2">
          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-foreground/[0.02] border-b border-foreground/10 text-[10px] uppercase font-bold text-foreground/50 tracking-widest">
                <tr>
                  <th className="px-5 py-4 w-10">Icon</th>
                  <th className="px-5 py-4">Fabric</th>
                  <th className="px-5 py-4">SKU</th>
                  <th className="px-5 py-4">₹ / m</th>
                  <th className="px-5 py-4">Weight</th>
                  <th className="px-5 py-4">Meters</th>
                  <th className="px-5 py-4">Low Stock</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-foreground/40">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Loading</span>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-foreground/5 flex items-center justify-center mb-4">
                        <Palette className="w-8 h-8 text-foreground/20" />
                      </div>
                      <p className="text-[13px] font-bold text-foreground/60">No fabrics found</p>
                      <p className="text-[11px] text-foreground/40 mt-1 max-w-xs mx-auto">Add cotton, silk, georgette, and other rolls to get started.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((f) => (
                    <tr
                      key={f.id}
                      className="hover:bg-foreground/[0.02] transition-colors duration-200 group"
                    >
                      <td className="px-5 py-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-amber-400/10 border border-foreground/5 flex items-center justify-center">
                          <Palette className="w-4 h-4 text-foreground/40" />
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-[13px] text-foreground">{f.name}</td>
                      <td className="px-5 py-4 font-mono text-[11px] text-emerald-600/90 dark:text-emerald-400 font-medium">
                        {f.sku}
                      </td>
                      <td className="px-5 py-4 font-bold text-[13px]">{formatInr(n(f.costPerMeter))}</td>
                      <td className="px-5 py-4 text-[13px] font-medium">
                        {n(f.weightValue).toLocaleString("en-IN", { maximumFractionDigits: 3 })}{" "}
                        <span className="text-foreground/40 text-[11px] font-bold">{f.weightUnit}</span>
                      </td>
                      <td className="px-5 py-4 text-[13px] font-bold">
                        {n(f.totalMeters).toLocaleString("en-IN", { maximumFractionDigits: 2 })} m
                      </td>
                      <td className="px-5 py-4 text-foreground/50 text-[11px] font-medium">
                        {f.lowStockMetersThreshold != null ? f.lowStockMetersThreshold : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                            f.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-foreground/5 text-foreground/40"
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(f)}
                            className="p-2 bg-foreground/5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/10 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(f)}
                            className="p-2 bg-red-500/5 rounded-lg text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </motion.div>

      <AnimatePresence>
        {(modal === "add" || modal === "edit" || modal === "scan") && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 lg:p-6 bg-background/80 backdrop-blur-md">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="w-full max-w-lg glass rounded-[2rem] border border-foreground/10 shadow-2xl p-6 lg:p-8 flex flex-col gap-6 max-h-[92vh] overflow-y-auto"
            >
              <div>
                <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground">
                  {modal === "add" ? "New Node Entry" : modal === "scan" ? "Quick Refinery Update" : "Node Modification"}
                </h2>
                <p className="text-[12px] text-foreground/60 mt-1 tracking-wide">
                  {modal === "add" ? "Registering a new fabric spectrum node." : modal === "scan" ? `Updating spectrum: ${scanFabric?.sku}` : `Modifying node: ${editing?.sku}`}
                </p>
              </div>

              {modal === "scan" && (
                <div className="px-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl">
                  <p className="text-[12px] font-bold text-foreground tracking-wide">
                    {scanFabric?.name}
                  </p>
                </div>
              )}

              <div className="space-y-5">
                {modal !== "scan" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 ml-1">Fabric name *</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                        className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground/30 shadow-sm"
                      />
                      {formErr.name && <p className="text-rose-500 text-[10px] font-bold mt-1 uppercase tracking-widest ml-1">{formErr.name}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60">
                          {modal === "add" ? "SKU (Auto)" : "SKU *"}
                        </label>
                        <button
                          type="button"
                          onClick={genSku}
                          className="text-[9px] font-bold text-foreground/40 hover:text-foreground uppercase tracking-widest flex items-center gap-1 transition-colors"
                        >
                          <Sparkles className="w-3 h-3" /> Re-Generate
                        </button>
                      </div>
                      <input
                        value={form.sku}
                        onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))}
                        className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-mono text-foreground focus:outline-none focus:border-foreground/30 shadow-sm uppercase"
                      />
                      {formErr.sku && <p className="text-rose-500 text-[10px] font-bold mt-1 uppercase tracking-widest ml-1">{formErr.sku}</p>}
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2 gap-4 lg:gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 ml-1">Cost / m (₹) *</label>
                    <input
                      type="number"
                      value={form.costPerMeter}
                      onChange={(e) => setForm((s) => ({ ...s, costPerMeter: e.target.value }))}
                      className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground/30 shadow-sm"
                    />
                    {formErr.costPerMeter && (
                      <p className="text-rose-500 text-[10px] font-bold mt-1 uppercase tracking-widest ml-1">{formErr.costPerMeter}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 ml-1">Total m *</label>
                    <input
                      type="number"
                      value={form.totalMeters}
                      onChange={(e) => setForm((s) => ({ ...s, totalMeters: e.target.value }))}
                      className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground/30 shadow-sm"
                    />
                    {formErr.totalMeters && (
                      <p className="text-rose-500 text-[10px] font-bold mt-1 uppercase tracking-widest ml-1">{formErr.totalMeters}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 ml-1">Weight *</label>
                    <input
                      type="number"
                      value={form.weightValue}
                      onChange={(e) => setForm((s) => ({ ...s, weightValue: e.target.value }))}
                      className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground/30 shadow-sm"
                    />
                    {formErr.weightValue && (
                      <p className="text-rose-500 text-[10px] font-bold mt-1 uppercase tracking-widest ml-1">{formErr.weightValue}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 ml-1">Unit</label>
                    <select
                      value={form.weightUnit}
                      onChange={(e) => setForm((s) => ({ ...s, weightUnit: e.target.value }))}
                      className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground/30 shadow-sm appearance-none"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                </div>
                {modal !== "scan" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 ml-1">
                        Low stock alert (m)
                      </label>
                      <input
                        type="number"
                        value={form.lowStockMetersThreshold}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, lowStockMetersThreshold: e.target.value }))
                        }
                        placeholder="Optional"
                        className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground/30 shadow-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 ml-1">Status</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
                        className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground/30 shadow-sm appearance-none"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-foreground/5">
                <button
                  type="button"
                  onClick={() => {
                    setModal(null);
                    setScanFabric(null);
                    setEditing(null);
                  }}
                  className="flex-1 px-4 py-3 bg-background border border-foreground/10 rounded-xl text-[11px] font-bold text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => saveFabric(modal === "scan")}
                  className="flex-[2] flex items-center justify-center px-4 py-3 bg-foreground text-background rounded-xl text-[11px] font-bold uppercase tracking-[0.1em] hover:opacity-90 transition-all shadow-lg shadow-foreground/10"
                >
                  Save Node
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
