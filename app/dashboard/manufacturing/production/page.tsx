"use client";

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Loader2, Plus, RefreshCw, LayoutGrid, Table2, ChevronDown, ChevronUp } from "lucide-react";
import { mfgFetch } from "@/lib/manufacturing/mfg-fetch";
import { formatDateTimeIST } from "@/lib/manufacturing/ist";
import { formatInr } from "@/lib/manufacturing/inr";
import {
  MFG_STAGE_LABEL,
  MFG_STAGE_BADGE_CLASS,
  MFG_STAGE_EMOJI,
  MFG_STAGE_KEYS,
} from "@/lib/manufacturing/constants";
import { BatchDrawer } from "../_components/BatchDrawer";

type FabricOpt = { id: string; sku: string; name: string; costPerMeter: number };

type BatchRow = {
  id: string;
  batchCode: string;
  productName: string;
  quantity: number;
  currentStage: string;
  isSampleDone: boolean;
  isCuttingDone: boolean;
  isPrintingDone: boolean;
  isEmbroideryDone: boolean;
  isWashingDone: boolean;
  washCostTotal?: number;
  totalCostSoFar?: number;
  updatedAt: string;
  fabric: FabricOpt | null;
  notes?: string | null;
};

type ActionKey =
  | "START_CUTTING"
  | "SEND_WASH"
  | "RETURN_WASH"
  | "SEND_PRINTING"
  | "RETURN_PRINTING"
  | "SEND_EMBROIDERY"
  | "RETURN_EMBROIDERY"
  | "MARK_SAMPLE"
  | "QC_PASS"
  | "QC_REJECT";

const emptyActionForm = {
  quantity: "",
  pricePerUnit: "",
  travel: "",
  vendor: "",
  dateDispatched: "",
  dateReturned: "",
  notes: "",
  damageLoss: "",
  designRef: "",
  washTotalCost: "",
  totalCharges: "",
  remarks: "",
};

type ActionFormState = typeof emptyActionForm;

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const x = parseFloat(String(v ?? ""));
  return Number.isFinite(x) ? x : 0;
}

function actionsForBatch(batch: BatchRow): { key: ActionKey; label: string }[] {
  const { currentStage, isSampleDone, isCuttingDone, isPrintingDone, isEmbroideryDone, isWashingDone } = batch;

  // 1. If Sample is NOT done, and we haven't started cutting, show Sample options
  if (!isSampleDone && !isCuttingDone && currentStage === "READY_FOR_PRODUCTION") {
    return [
      { key: "MARK_SAMPLE", label: "Mark as Sample" },
      { key: "START_CUTTING", label: "Start Production (Cutting)" },
    ];
  }

  if (currentStage === "SENT_SAMPLE") {
    return [
      { key: "QC_PASS", label: "Sample QC Pass (Approve for Production)" },
      { key: "QC_REJECT", label: "Sample QC Reject" },
    ];
  }

  // 2. Production Flow
  switch (currentStage) {
    case "READY_FOR_PRODUCTION":
      return [{ key: "START_CUTTING", label: "Start Cutting" }];

    case "IN_PRODUCTION_CUTTING":
      return [
        { key: "SEND_PRINTING", label: "Send to Printing" },
        { key: "SEND_EMBROIDERY", label: "Send to Embroidery" },
        { key: "SEND_WASH", label: "Send to Wash" },
        { key: "QC_PASS", label: "Final QC Pass" },
        { key: "QC_REJECT", label: "Final QC Reject" },
      ];

    case "SENT_PRINTING":
      return [{ key: "RETURN_PRINTING", label: "Returned from Printing" }];

    case "SENT_EMBROIDERY":
      return [{ key: "RETURN_EMBROIDERY", label: "Returned from Embroidery" }];

    case "SENT_WASH":
      return [{ key: "RETURN_WASH", label: "Returned from Wash" }];

    case "RETURNED_COMBINED":
      const actions: { key: ActionKey; label: string }[] = [];
      if (!isPrintingDone) actions.push({ key: "SEND_PRINTING", label: "Send to Printing" });
      if (!isEmbroideryDone) actions.push({ key: "SEND_EMBROIDERY", label: "Send to Embroidery" });
      if (!isWashingDone) actions.push({ key: "SEND_WASH", label: "Send to Wash" });
      
      actions.push({ key: "QC_PASS", label: "Final QC Pass" });
      actions.push({ key: "QC_REJECT", label: "Final QC Reject" });
      return actions;

    case "QC_PASSED":
    case "REJECTED_REWORK":
      return []; // Completed or locked for rework

    default:
      return [];
  }
}

function stageProgressIndex(stage: string): number {
  const i = MFG_STAGE_KEYS.indexOf(stage as (typeof MFG_STAGE_KEYS)[number]);
  if (i >= 0) return i;
  return 0;
}

export default function ProductionTrackerPage() {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [fabrics, setFabrics] = useState<FabricOpt[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string; category: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [q, setQ] = useState("");
  const [filterStage, setFilterStage] = useState<string | null>(null);
  const [view, setView] = useState<"card" | "table">("card");

  const [newOpen, setNewOpen] = useState(false);
  const [nb, setNb] = useState({
    productName: "",
    quantity: "",
    fabricId: "",
    fabricMeters: "",
    notes: "",
    estCpu: "",
    currentStage: "READY_FOR_PRODUCTION",
  });
  const [nbErr, setNbErr] = useState<Record<string, string>>({});

  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [modal, setModal] = useState<{ batch: BatchRow; action: ActionKey } | null>(null);
  const [act, setAct] = useState<ActionFormState>({ ...emptyActionForm });
  const [actErr, setActErr] = useState<Record<string, string>>({});

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expandData, setExpandData] = useState<Record<string, { breakdown: unknown } | null>>({});
  const [expandLoad, setExpandLoad] = useState<Record<string, boolean>>({});

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadFabrics = useCallback(async () => {
    const res = await mfgFetch("/api/admin/manufacturing/fabric");
    const data = await res.json();
    setFabrics(
      Array.isArray(data)
        ? data.map((f: FabricOpt) => ({
            ...f,
            costPerMeter: num(f.costPerMeter),
          }))
        : []
    );
  }, []);

  const loadVendors = useCallback(async () => {
    try {
      const res = await mfgFetch("/api/admin/manufacturing/vendors");
      const data = await res.json();
      if (Array.isArray(data)) setVendors(data);
    } catch {}
  }, []);

  const loadBatches = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/manufacturing/batches", window.location.origin);
      if (q.trim()) url.searchParams.set("q", q.trim());
      if (filterStage) url.searchParams.set("stage", filterStage);
      const res = await mfgFetch(url.toString());
      const data = await res.json();
      if (!Array.isArray(data)) {
        setBatches([]);
        if (data?.error) showToast(String(data.error), "err");
        return;
      }
      setBatches(
        data.map((b: BatchRow) => ({
          ...b,
          quantity: num(b.quantity),
          washCostTotal: num(b.washCostTotal),
          totalCostSoFar: num(b.totalCostSoFar),
        }))
      );
    } catch {
      showToast("Could not load batches", "err");
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [q, filterStage]);

  useEffect(() => {
    loadFabrics();
    loadVendors();
  }, [loadFabrics, loadVendors]);

  useEffect(() => {
    const t = setTimeout(loadBatches, 280);
    return () => clearTimeout(t);
  }, [loadBatches]);

  const toggleExpand = async (id: string) => {
    const next = !expanded[id];
    setExpanded((e) => ({ ...e, [id]: next }));
    if (next && !expandData[id]) {
      setExpandLoad((l) => ({ ...l, [id]: true }));
      try {
        const res = await mfgFetch(`/api/admin/manufacturing/batches/${id}/detail`);
        const j = await res.json();
        if (res.ok) setExpandData((d) => ({ ...d, [id]: j }));
      } finally {
        setExpandLoad((l) => ({ ...l, [id]: false }));
      }
    }
  };

  const createBatch = async () => {
    const err: Record<string, string> = {};
    if (!nb.productName.trim()) err.productName = "Required";
    const qty = Number(nb.quantity);
    if (!Number.isFinite(qty) || qty <= 0) err.quantity = "Enter a positive quantity";
    const meters = Number(nb.fabricMeters);
    if (nb.fabricId && (!Number.isFinite(meters) || meters < 0)) err.fabricMeters = "Invalid meters";
    if (Object.keys(err).length) {
      setNbErr(err);
      return;
    }
    setNbErr({});
    try {
      const res = await mfgFetch("/api/admin/manufacturing/batches", {
        method: "POST",
        body: JSON.stringify({
          productName: nb.productName.trim(),
          quantity: qty,
          fabricId: nb.fabricId || null,
          fabricMetersConsumed: nb.fabricId ? meters : 0,
          notes: nb.notes.trim() || null,
          estimatedCostPerUnit: nb.estCpu ? Number(nb.estCpu) : null,
          currentStage: nb.currentStage,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      showToast("Batch created and saved");
      setNewOpen(false);
      setNb({
        productName: "",
        quantity: "",
        fabricId: "",
        fabricMeters: "",
        notes: "",
        estCpu: "",
        currentStage: "READY_FOR_PRODUCTION",
      });
      loadBatches();
      loadFabrics();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error", "err");
    }
  };

  const openAction = (batch: BatchRow, action: ActionKey) => {
    setModal({ batch, action });
    setAct({ ...emptyActionForm });
    setActErr({});
  };

  const validateAction = (): boolean => {
    if (!modal) return false;
    const e: Record<string, string> = {};
    const a = modal.action;
    if (
      ["SEND_WASH", "SEND_PRINTING", "SEND_EMBROIDERY", "RETURN_WASH", "RETURN_PRINTING", "RETURN_EMBROIDERY", "MARK_SAMPLE"].includes(a) &&
      !act.quantity.trim()
    ) {
      e.quantity = "Required";
    }
    if (["SEND_WASH", "SEND_PRINTING", "SEND_EMBROIDERY"].includes(a) && !act.pricePerUnit.trim()) {
      e.pricePerUnit = "Required";
    }
    if (["RETURN_WASH"].includes(a) && !act.washTotalCost.trim()) {
      e.washTotalCost = "Enter total wash charges";
    }
    setActErr(e);
    return Object.keys(e).length === 0;
  };

  const submitAction = async () => {
    if (!modal || !validateAction()) return;
    const body: Record<string, unknown> = {
      action: modal.action,
      quantity: act.quantity ? Number(act.quantity) : undefined,
      pricePerUnit: act.pricePerUnit ? Number(act.pricePerUnit) : undefined,
      travel: act.travel ? Number(act.travel) : undefined,
      travelExpense: act.travel ? Number(act.travel) : undefined,
      vendor: act.vendor || undefined,
      vendorName: act.vendor || undefined,
      artisanName: act.vendor || undefined,
      dateDispatched: act.dateDispatched || undefined,
      dateReturned: act.dateReturned || undefined,
      notes: act.notes || undefined,
      damageLoss: act.damageLoss ? Number(act.damageLoss) : undefined,
      designRef: act.designRef || undefined,
      washTotalCost: act.washTotalCost ? Number(act.washTotalCost) : undefined,
      remarks: act.remarks || undefined,
      costAmount: act.totalCharges ? Number(act.totalCharges) : undefined,
    };
    try {
      const res = await mfgFetch(`/api/admin/manufacturing/batches/${modal.batch.id}/action`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      showToast("Saved — stage updated");
      setModal(null);
      loadBatches();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error", "err");
    }
  };

  const openDrawer = (id: string) => {
    setDrawerId(id);
    setDrawerOpen(true);
  };

  const pipelineClick = (key: string) => {
    setFilterStage((s) => (s === key ? null : key));
  };

  const progressPct = (stage: string) => {
    const idx = stageProgressIndex(stage);
    return Math.round(((idx + 1) / MFG_STAGE_KEYS.length) * 100);
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-12 pt-4 lg:pt-10 max-w-[1500px] mx-auto">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground uppercase tracking-tighter leading-none">
            Production Tracker
          </h1>
          <p className="text-sm text-foreground/55 mt-1 max-w-2xl">
            Internal batches, fabric consumption, and stage costs — all persisted to the database.
            Tap a pipeline stage to filter the board.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-2xl border border-foreground/10 p-1 bg-foreground/[0.03]">
            <button
              type="button"
              onClick={() => setView("card")}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                view === "card" ? "bg-foreground text-background" : "text-foreground/60"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                view === "table" ? "bg-foreground text-background" : "text-foreground/60"
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              Table
            </button>
          </div>
          <button
            type="button"
            onClick={() => loadBatches()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-foreground/10 text-xs font-semibold hover:bg-foreground/5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-foreground text-background text-xs font-bold shadow-lg"
          >
            <Plus className="w-4 h-4" />
            New batch
          </button>
        </div>
      </header>

      {/* Pipeline filter */}
      <section className="rounded-3xl border border-foreground/10 bg-foreground/[0.02] p-4 shadow-inner">
        <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-3">
          Stage pipeline (click to filter)
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {MFG_STAGE_KEYS.map((key) => {
            const active = filterStage === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => pipelineClick(key)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl border text-left transition-all ${
                  active
                    ? "border-foreground/25 bg-foreground/10 shadow-md"
                    : "border-foreground/10 bg-background/40 hover:border-foreground/15"
                }`}
              >
                <span className="text-lg">{MFG_STAGE_EMOJI[key]}</span>
                <span className="text-[10px] font-semibold text-foreground/80 max-w-[120px] leading-tight">
                  {MFG_STAGE_LABEL[key]}
                </span>
              </button>
            );
          })}
        </div>
        {filterStage && (
          <button
            type="button"
            onClick={() => setFilterStage(null)}
            className="mt-3 text-[11px] font-semibold text-foreground/50 hover:text-foreground"
          >
            Clear stage filter
          </button>
        )}
      </section>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search batch ID or style…"
        className="w-full max-w-md rounded-2xl border border-foreground/10 bg-foreground/[0.04] px-4 py-3 text-sm focus:ring-2 focus:ring-foreground/15 outline-none transition-shadow"
      />

      {loading && batches.length === 0 ? (
        <div className="py-24 flex justify-center text-foreground/40">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      ) : batches.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-foreground/15 bg-foreground/[0.02] py-20 px-6 text-center">
          <p className="text-foreground/50 text-sm max-w-md mx-auto">
            No batches match. Create a new batch with style, quantity, optional fabric consumption
            (logs fabric OUT automatically), and starting stage.
          </p>
        </div>
      ) : view === "table" ? (
        <div className="rounded-3xl border border-foreground/10 overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[800px]">
            <thead className="bg-foreground/[0.05] text-foreground/45 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Style</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Fabric</th>
                <th className="px-4 py-3">Cost so far</th>
                <th className="px-4 py-3">Updated (IST)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-foreground/[0.02]">
                  <td className="px-4 py-3 font-mono text-[11px]">{b.batchCode}</td>
                  <td className="px-4 py-3 font-medium">{b.productName}</td>
                  <td className="px-4 py-3">{b.quantity}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-lg border text-[10px] font-bold ${
                        MFG_STAGE_BADGE_CLASS[b.currentStage] || ""
                      }`}
                    >
                      {MFG_STAGE_LABEL[b.currentStage] || b.currentStage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground/60">
                    {b.fabric ? (
                      <span className="font-mono text-[10px]">{b.fabric.sku}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{formatInr(num(b.totalCostSoFar))}</td>
                  <td className="px-4 py-3 text-foreground/50 whitespace-nowrap">
                    {formatDateTimeIST(b.updatedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openDrawer(b.id)}
                      className="text-[11px] font-bold text-foreground/60 hover:text-foreground mr-2"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {batches.map((b) => {
            const ex = expanded[b.id];
            const ed = expandData[b.id] as { breakdown?: Record<string, number> } | null;
            const pct = progressPct(b.currentStage);
            return (
              <article
                key={b.id}
                className="rounded-3xl border border-foreground/10 bg-gradient-to-b from-foreground/[0.04] to-transparent shadow-lg hover:shadow-xl hover:border-foreground/15 transition-all duration-300 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => openDrawer(b.id)}
                  className="w-full text-left p-5 pb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 rounded-t-3xl"
                >
                  <div className="flex justify-between gap-3">
                    <p className="font-mono text-[11px] text-foreground/45">{b.batchCode}</p>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border ${
                        MFG_STAGE_BADGE_CLASS[b.currentStage] || ""
                      }`}
                    >
                      {MFG_STAGE_EMOJI[b.currentStage]} {MFG_STAGE_LABEL[b.currentStage]}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mt-2">{b.productName}</h3>
                  <div className="flex flex-wrap gap-2 mt-3 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-foreground/10 font-semibold tabular-nums">
                      Qty {b.quantity}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-foreground/10 tabular-nums">
                      Cost {formatInr(num(b.totalCostSoFar))}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-foreground/10 text-foreground/60">
                      Wash run {formatInr(num(b.washCostTotal))}
                    </span>
                  </div>
                  {b.fabric && (
                    <p className="text-[11px] text-foreground/50 mt-2">
                      Fabric <span className="font-mono text-foreground/70">{b.fabric.sku}</span>{" "}
                      {b.fabric.name}
                    </p>
                  )}
                  <p className="text-[11px] text-foreground/40 mt-2">
                    {formatDateTimeIST(b.updatedAt)} IST
                  </p>
                </button>

                <div className="px-5 pb-2">
                  <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500/70 to-amber-400/80 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-foreground/35 mt-1">Stage progress</p>
                </div>

                <div className="px-5 pb-4 flex flex-wrap gap-2">
                  {actionsForBatch(b).map(({ key, label }: { key: ActionKey; label: string }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => openAction(b, key)}
                      className="px-3 py-2 rounded-xl border border-foreground/10 bg-background/50 text-[11px] font-bold hover:bg-foreground/8"
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => toggleExpand(b.id)}
                    className="px-3 py-2 rounded-xl border border-foreground/10 text-[11px] font-semibold text-foreground/55 flex items-center gap-1"
                  >
                    {ex ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    Cost breakdown
                  </button>
                </div>

                {ex && (
                  <div className="border-t border-foreground/10 px-5 py-4 bg-foreground/[0.02] text-xs">
                    {expandLoad[b.id] ? (
                      <Loader2 className="w-5 h-5 animate-spin text-foreground/40" />
                    ) : ed?.breakdown ? (
                      <BreakdownMini b={ed.breakdown as Record<string, number>} />
                    ) : (
                      <p className="text-foreground/40">No breakdown loaded.</p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* New batch modal */}
      {newOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-foreground/10 glass shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <h2 className="text-lg font-bold">New production batch</h2>
            <p className="text-xs text-foreground/50">
              Batch ID is auto-generated as <span className="font-mono">BCH-YYYYMMDD-XXXX</span> (IST
              date). Optional fabric meters create an immediate fabric OUT movement linked to this batch.
            </p>
            <Field
              label="Style / product description *"
              value={nb.productName}
              onChange={(v) => setNb((s) => ({ ...s, productName: v }))}
              error={nbErr.productName}
            />
            <Field
              label="Quantity (units) *"
              type="number"
              value={nb.quantity}
              onChange={(v) => setNb((s) => ({ ...s, quantity: v }))}
              error={nbErr.quantity}
            />
            <div>
              <label className="text-[11px] font-semibold text-foreground/50">Fabric used (optional)</label>
              <select
                value={nb.fabricId}
                onChange={(e) => setNb((s) => ({ ...s, fabricId: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2.5 text-sm"
              >
                <option value="">None</option>
                {fabrics.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.sku} — {f.name}
                  </option>
                ))}
              </select>
            </div>
            {nb.fabricId ? (
              <Field
                label="Fabric meters consumed (logs OUT) *"
                type="number"
                value={nb.fabricMeters}
                onChange={(v) => setNb((s) => ({ ...s, fabricMeters: v }))}
                error={nbErr.fabricMeters}
              />
            ) : null}
            <div>
              <label className="text-[11px] font-semibold text-foreground/50">Starting stage</label>
              <select
                value={nb.currentStage}
                onChange={(e) => setNb((s) => ({ ...s, currentStage: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2.5 text-sm"
              >
                {MFG_STAGE_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {MFG_STAGE_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Notes"
              textarea
              value={nb.notes}
              onChange={(v) => setNb((s) => ({ ...s, notes: v }))}
            />
            <Field
              label="Estimated cost per unit (₹, optional)"
              type="number"
              value={nb.estCpu}
              onChange={(v) => setNb((s) => ({ ...s, estCpu: v }))}
            />
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setNewOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-foreground/10 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createBatch}
                className="px-4 py-2.5 rounded-xl bg-foreground text-background text-xs font-bold"
              >
                Create batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action modal */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-foreground/10 glass p-6 space-y-3 max-h-[90vh] overflow-y-auto">
            {modal && (
              <>
                <h2 className="text-lg font-bold">{modal.action.replace(/_/g, " ")}</h2>
                <p className="text-[11px] font-mono text-foreground/45">{modal.batch.batchCode}</p>
                <ActionFields 
                  action={modal.action} 
                  act={act} 
                  setAct={setAct} 
                  actErr={actErr} 
                  vendors={vendors}
                />
              </>
            )}
            <div className="flex gap-2 justify-end pt-3 border-t border-foreground/10">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-4 py-2 rounded-xl border border-foreground/10 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAction}
                className="px-4 py-2 rounded-xl bg-foreground text-background text-xs font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <BatchDrawer
        batchId={drawerId}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerId(null);
        }}
        onSaved={() => loadBatches()}
      />

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl ${
            toast?.type === "ok"
              ? "bg-foreground text-background"
              : "bg-red-600 text-white"
          }`}
        >
          {toast?.msg}
        </div>
      )}
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  textarea?: boolean;
  error?: string;
}) {
  const { label, value, onChange, type = "text", textarea, error } = props;
  return (
    <div>
      <label className="text-[11px] font-semibold text-foreground/50">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2 text-sm"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2 text-sm"
        />
      )}
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function BreakdownMini({ b }: { b: Record<string, number> }) {
  const rows: [string, keyof typeof b][] = [
    ["Fabric", "fabricCost"],
    ["Wash", "washCost"],
    ["Wash / unit", "washCostPerUnit"],
    ["Printing", "printingCost"],
    ["Embroidery", "embroideryCost"],
    ["Travel", "travelLogistics"],
    ["Misc", "miscellaneous"],
    ["Total", "totalCost"],
    ["Per unit", "costPerUnit"],
  ];
  return (
    <div className="space-y-1.5">
      {rows.map(([label, key]) => (
        <div key={key} className="flex justify-between gap-4 text-[11px]">
          <span className="text-foreground/45">{label}</span>
          <span className="tabular-nums font-medium">{formatInr(Number(b[key] ?? 0))}</span>
        </div>
      ))}
    </div>
  );
}

function ActionFields({
  action,
  act,
  setAct,
  actErr,
  vendors,
}: {
  action: ActionKey;
  act: ActionFormState;
  setAct: Dispatch<SetStateAction<ActionFormState>>;
  actErr: Record<string, string>;
  vendors: { id: string; name: string; category: string }[];
}) {
  const f = (k: keyof ActionFormState, label: string, type = "text", ta?: boolean) => (
    <div key={String(k)}>
      <label className="text-[11px] font-semibold text-foreground/50">{label}</label>
      {k === "vendor" ? (
        <select
          value={act[k]}
          onChange={(e) => setAct((s) => ({ ...s, [k]: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2.5 text-sm appearance-none"
        >
          <option value="">Select Vendor</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.name}>
              {v.name} ({v.category})
            </option>
          ))}
        </select>
      ) : ta ? (
        <textarea
          value={act[k]}
          onChange={(e) => setAct((s) => ({ ...s, [k]: e.target.value }))}
          rows={2}
          className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2 text-sm"
        />
      ) : (
        <input
          type={type}
          value={act[k]}
          onChange={(e) => setAct((s) => ({ ...s, [k]: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2 text-sm"
        />
      )}
      {actErr[k as string] && (
        <p className="text-[11px] text-red-500 mt-1">{actErr[k as string]}</p>
      )}
    </div>
  );

  if (action === "START_CUTTING") {
    return <p className="text-sm text-foreground/55">Confirm move to cutting. Log entry is created.</p>;
  }
  if (action === "SEND_WASH") {
    return (
      <>
        {f("quantity", "Quantity *", "number")}
        {f("pricePerUnit", "Washing price per unit (₹) *", "number")}
        {f("travel", "Travel / logistics (₹)", "number")}
        {f("vendor", "Vendor / laundry")}
        {f("dateDispatched", "Dispatch date", "date")}
        {f("notes", "Notes", "text", true)}
      </>
    );
  }
  if (action === "RETURN_WASH") {
    return (
      <>
        {f("quantity", "Quantity returned *", "number")}
        {f("damageLoss", "Damage / loss count", "number")}
        {f("dateReturned", "Date returned", "date")}
        {f("washTotalCost", "Total wash charges (₹) *", "number")}
        {f("notes", "Notes", "text", true)}
      </>
    );
  }
  if (action === "SEND_PRINTING") {
    return (
      <>
        {f("quantity", "Quantity *", "number")}
        {f("pricePerUnit", "Printing cost per unit (₹) *", "number")}
        {f("travel", "Travel expense (₹)", "number")}
        {f("vendor", "Vendor name")}
        {f("designRef", "Design reference")}
        {f("dateDispatched", "Dispatch date", "date")}
        {f("notes", "Notes", "text", true)}
      </>
    );
  }
  if (action === "RETURN_PRINTING" || action === "RETURN_EMBROIDERY") {
    return (
      <>
        {f("quantity", "Quantity returned *", "number")}
        {f("damageLoss", "Damage / loss", "number")}
        {f("dateReturned", "Date returned", "date")}
        {f("totalCharges", "Total charges (₹)", "number")}
        {f("notes", "Notes", "text", true)}
      </>
    );
  }
  if (action === "SEND_EMBROIDERY") {
    return (
      <>
        {f("quantity", "Quantity *", "number")}
        {f("pricePerUnit", "Embroidery cost per unit (₹) *", "number")}
        {f("travel", "Travel expense (₹)", "number")}
        {f("vendor", "Artisan / vendor")}
        {f("dateDispatched", "Dispatch date", "date")}
        {f("notes", "Notes", "text", true)}
      </>
    );
  }
  if (action === "MARK_SAMPLE") {
    return (
      <>
        {f("quantity", "Quantity *", "number")}
        {f("notes", "Notes", "text", true)}
      </>
    );
  }
  if (action === "QC_PASS" || action === "QC_REJECT") {
    return (
      <>
        {f("quantity", "Quantity (optional)", "number")}
        {f("remarks", "Remarks / reason", "text", true)}
      </>
    );
  }
  return null;
}
