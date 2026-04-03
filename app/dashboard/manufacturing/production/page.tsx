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
  isStitchingDone: boolean;
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
  | "SEND_STITCHING"
  | "RETURN_STITCHING"
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
  const { currentStage, isSampleDone, isCuttingDone, isStitchingDone, isPrintingDone, isEmbroideryDone, isWashingDone } = batch;

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
        { key: "SEND_STITCHING", label: "Send to Stitching" },
        { key: "SEND_PRINTING", label: "Send to Printing" },
        { key: "SEND_EMBROIDERY", label: "Send to Embroidery" },
        { key: "SEND_WASH", label: "Send to Wash" },
        { key: "QC_PASS", label: "Final QC Pass" },
        { key: "QC_REJECT", label: "Final QC Reject" },
      ];

    case "IN_PRODUCTION_STITCHING":
      return [
        { key: "RETURN_STITCHING", label: "Returned from Stitching" },
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
      if (!isStitchingDone) actions.push({ key: "SEND_STITCHING", label: "Send to Stitching" });
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
      ["SEND_WASH", "SEND_PRINTING", "SEND_EMBROIDERY", "SEND_STITCHING", "RETURN_WASH", "RETURN_PRINTING", "RETURN_EMBROIDERY", "RETURN_STITCHING", "MARK_SAMPLE"].includes(a) &&
      !act.quantity.trim()
    ) {
      e.quantity = "Required";
    }
    if (["SEND_WASH", "SEND_PRINTING", "SEND_EMBROIDERY", "SEND_STITCHING"].includes(a) && !act.pricePerUnit.trim()) {
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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1500px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div className="space-y-1">
          <div className="px-2 py-0.5 bg-foreground/[0.03] rounded-md text-[7px] font-normal text-foreground/50 uppercase tracking-[0.3em] w-fit tracking-widest">manufacturing hub</div>
          <h1 className="text-lg font-normal text-foreground uppercase tracking-[0.2em] mb-0.5 leading-none mt-1 font-inter">
            Production Tracker
          </h1>
          <p className="text-[9px] text-foreground/40 font-normal uppercase tracking-[0.2em] mt-1">
            Real-time pipeline monitoring — {batches.length} active batches. Transitions are recorded in the immutable spectrum ledger.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadBatches()}
            className="flex items-center gap-2 px-5 py-2.5 bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-foreground/[0.05] rounded-md text-[8px] font-normal uppercase tracking-[0.2em] text-foreground/80 dark:text-foreground/60 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} strokeWidth={1.5} />
            REFRESH
          </button>
        </div>
      </div>

      {/* Stage Pipeline */}
      <div className="bg-white/50 dark:bg-white/[0.01] backdrop-blur-3xl rounded-[1rem] p-1 border border-foreground/[0.02] shadow-sm">
        <div className="flex overflow-x-auto scrollbar-hide py-1 px-1 gap-1">
          {MFG_STAGE_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setFilterStage((s) => (s === key ? null : key))}
              className={`px-4 py-2 rounded-md text-[7px] font-normal uppercase tracking-[0.3em] whitespace-nowrap transition-all duration-300 border ${
                filterStage === key
                  ? "bg-foreground text-background border-foreground shadow-lg shadow-foreground/5"
                  : "text-foreground/40 border-transparent hover:bg-foreground/[0.03] hover:text-foreground/60"
              }`}
            >
              <span className="mr-1.5">{MFG_STAGE_EMOJI[key]}</span>
              {MFG_STAGE_LABEL[key]}
            </button>
          ))}
        </div>
      </div>

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
        <div className="w-full rounded-3xl border border-foreground/10 overflow-hidden bg-foreground/[0.02]">
          <div className="overflow-x-auto w-full custom-scrollbar">
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
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {batches.map((b) => {
            const ex = expanded[b.id];
            const ed = expandData[b.id] as { breakdown?: Record<string, number> } | null;
            const pct = progressPct(b.currentStage);
            return (
              <div
                key={b.id}
                className="group bg-white/50 dark:bg-white/[0.01] backdrop-blur-3xl rounded-[1rem] border border-foreground/[0.05] shadow-sm hover:border-foreground/10 transition-all duration-500 overflow-hidden flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => openDrawer(b.id)}
                  className="w-full text-left p-5 pb-3 focus:outline-none"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1">
                      <div className="text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em]">Node ID</div>
                      <div className="font-mono text-[10px] text-foreground/50">{b.batchCode}</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[7px] font-normal uppercase tracking-[0.2em] ${
                        MFG_STAGE_BADGE_CLASS[b.currentStage] || "bg-foreground/5 text-foreground/40 border border-foreground/10"
                      }`}
                    >
                      {MFG_STAGE_EMOJI[b.currentStage]} {MFG_STAGE_LABEL[b.currentStage]}
                    </span>
                  </div>
                  <h3 className="text-[13px] font-normal text-foreground uppercase tracking-[0.05em] mt-4 leading-tight font-inter">
                    {b.productName}
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="space-y-1">
                      <div className="text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em]">Units</div>
                      <div className="text-[10px] font-normal text-foreground/70 tabular-nums">{b.quantity}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em]">Valuation</div>
                      <div className="text-[10px] font-normal text-foreground/70 tabular-nums">{formatInr(num(b.totalCostSoFar))}</div>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em]">Wash Pool</div>
                      <div className="text-[10px] font-normal text-foreground/70 tabular-nums">{formatInr(num(b.washCostTotal))}</div>
                    </div>
                  </div>

                  {b.fabric && (
                    <div className="mt-4 pt-3 border-t border-foreground/[0.03] space-y-1">
                      <div className="text-[7px] font-normal text-foreground/20 uppercase tracking-[0.3em]">Primary Spectrum Node</div>
                      <div className="text-[9px] text-foreground/40 font-mono tracking-wider">
                        {b.fabric.sku} // {b.fabric.name}
                      </div>
                    </div>
                  )}
                </button>

                <div className="px-5 pb-2">
                  <div className="h-[1.5px] rounded-full bg-foreground/[0.03] overflow-hidden">
                    <div
                      className="h-full bg-foreground/40 transition-all duration-1000 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[7px] font-normal text-foreground/20 uppercase tracking-[0.3em]">Pipeline Progress</span>
                    <span className="text-[8px] font-normal text-foreground/40 tabular-nums tracking-widest">{pct}%</span>
                  </div>
                </div>

                <div className="px-5 pb-5 flex flex-wrap gap-1.5 mt-2">
                  {actionsForBatch(b).map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAction(b, key);
                      }}
                      className="px-3 py-1.5 bg-foreground text-background border border-foreground rounded-md text-[7px] font-normal uppercase tracking-[0.2em] transition-all hover:bg-foreground/90 whitespace-nowrap"
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(b.id);
                    }}
                    className="px-3 py-1.5 bg-foreground/[0.03] border border-foreground/[0.05] rounded-md text-[7px] font-normal uppercase tracking-[0.2em] text-foreground/40 hover:text-foreground/80 transition-all flex items-center gap-1 whitespace-nowrap"
                  >
                    {ex ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Breakdown
                  </button>
                </div>

                {ex && (
                  <div className="border-t border-foreground/[0.05] px-5 py-4 bg-foreground/[0.01] animate-in fade-in slide-in-from-top-2">
                    {expandLoad[b.id] ? (
                      <div className="py-2 flex justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-foreground/10" strokeWidth={1} />
                      </div>
                    ) : ed?.breakdown ? (
                      <BreakdownMini b={ed.breakdown as Record<string, number>} />
                    ) : (
                      <p className="text-[9px] text-foreground/20 uppercase tracking-widest text-center">No metadata found.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New batch modal */}
      {newOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-white/90 dark:bg-black/80 backdrop-blur-2xl rounded-[1rem] border border-foreground/[0.05] shadow-2xl p-6 space-y-6 max-h-[92vh] overflow-y-auto font-inter">
            <div className="space-y-1">
              <h2 className="text-[11px] font-normal text-foreground uppercase tracking-[0.2em] leading-none">INITIATE NEW SPECTRUM BATCH</h2>
              <p className="text-[9px] text-foreground/40 uppercase tracking-[0.2em]">Batch ID auto-generates linked to current date timeline.</p>
            </div>
            
            <div className="space-y-4">
              <Field
                label="Style / product nomenclature *"
                value={nb.productName}
                onChange={(v) => setNb((s) => ({ ...s, productName: v }))}
                error={nbErr.productName}
              />
              <Field
                label="Unit Quantity (NODES) *"
                type="number"
                value={nb.quantity}
                onChange={(v) => setNb((s) => ({ ...s, quantity: v }))}
                error={nbErr.quantity}
              />
              <div className="space-y-1.5">
                <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Spectrum Node association</label>
                <select
                  value={nb.fabricId}
                  onChange={(e) => setNb((s) => ({ ...s, fabricId: e.target.value }))}
                  className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em] appearance-none"
                >
                  <option value="">NONE (NULL-ASSOCIATION)</option>
                  {fabrics.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.sku} — {f.name}
                    </option>
                  ))}
                </select>
              </div>
              {nb.fabricId ? (
                <Field
                  label="Fabric spectrum meters (logs OUT) *"
                  type="number"
                  value={nb.fabricMeters}
                  onChange={(v) => setNb((s) => ({ ...s, fabricMeters: v }))}
                  error={nbErr.fabricMeters}
                />
              ) : null}
              <div className="space-y-1.5">
                <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Initial Entry Stage</label>
                <select
                  value={nb.currentStage}
                  onChange={(e) => setNb((s) => ({ ...s, currentStage: e.target.value }))}
                  className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em] appearance-none font-inter"
                >
                  {MFG_STAGE_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {MFG_STAGE_LABEL[k]}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label="Internal Audit Notes"
                textarea
                value={nb.notes}
                onChange={(v) => setNb((s) => ({ ...s, notes: v }))}
              />
              <Field
                label="Projected nodes cpu (₹, optional)"
                type="number"
                value={nb.estCpu}
                onChange={(v) => setNb((s) => ({ ...s, estCpu: v }))}
              />
            </div>

            <div className="flex gap-2 justify-end pt-6 border-t border-foreground/[0.05]">
              <button
                type="button"
                onClick={() => setNewOpen(false)}
                className="px-5 py-2 rounded-md text-[8px] font-normal uppercase tracking-[0.2em] text-foreground/40 hover:text-foreground/60 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createBatch}
                className="px-8 py-2 bg-foreground text-background rounded-md text-[8px] font-normal uppercase tracking-[0.3em] shadow-lg shadow-foreground/5 hover:opacity-90 transition-all"
              >
                INITIATE BATCH
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action modal */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white/90 dark:bg-black/80 backdrop-blur-2xl rounded-[1rem] border border-foreground/[0.05] shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto font-inter">
            <div className="space-y-1">
              <h2 className="text-[11px] font-normal text-foreground uppercase tracking-[0.2em] leading-none">{modal.action.replace(/_/g, " ")}</h2>
              <p className="text-[9px] text-foreground/40 uppercase tracking-[0.2em]">RECORDING TRANSITION FOR NODE: {modal.batch.batchCode}</p>
            </div>
            
            <div className="space-y-4">
              <ActionFields 
                action={modal.action} 
                act={act} 
                setAct={setAct} 
                actErr={actErr} 
                vendors={vendors}
              />
            </div>

            <div className="flex gap-2 justify-end pt-6 border-t border-foreground/[0.05]">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-5 py-2 rounded-md text-[8px] font-normal uppercase tracking-[0.2em] text-foreground/40 hover:text-foreground/60 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAction}
                className="px-8 py-2 bg-foreground text-background rounded-md text-[8px] font-normal uppercase tracking-[0.3em] shadow-lg shadow-foreground/5 hover:opacity-90 transition-all"
              >
                RECORD SYNC
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
    <div className="space-y-1.5">
      <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em]"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all font-inter"
        />
      )}
      {error && <p className="text-rose-500 text-[7px] mt-1 uppercase tracking-widest">{error}</p>}
    </div>
  );
}

function BreakdownMini({ b }: { b: Record<string, number> }) {
  const rows: [string, string][] = [
    ["Fabric Node", "fabricCost"],
    ["Wash Ref", "washCost"],
    ["Wash / Unit", "washCostPerUnit"],
    ["Print Nodes", "printingCost"],
    ["Embroidery Nodes", "embroideryCost"],
    ["Logistics Pool", "travelLogistics"],
    ["Metadata Misc", "miscellaneous"],
    ["Net Valuation", "totalCost"],
    ["Nodes CPU", "costPerUnit"],
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-x-8 gap-y-3">
        {rows.map(([label, key]) => (
          <div key={key} className="flex flex-col gap-1">
            <span className="text-[7px] font-normal text-foreground/20 uppercase tracking-[0.3em] font-inter">{label}</span>
            <span className="text-[10px] tabular-nums font-normal text-foreground/70">{formatInr(Number(b[key] ?? 0))}</span>
          </div>
        ))}
      </div>
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
    <div key={String(k)} className="space-y-1.5">
      <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">{label}</label>
      {k === "vendor" ? (
        <select
          value={act[k]}
          onChange={(e) => setAct((s) => ({ ...s, [k]: e.target.value }))}
          className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em] appearance-none"
        >
          <option value="">SELECT NODE…</option>
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
          className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em]"
        />
      ) : (
        <input
          type={type}
          value={act[k]}
          onChange={(e) => setAct((s) => ({ ...s, [k]: e.target.value }))}
          className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all"
        />
      )}
      {actErr[k as string] && (
        <p className="text-rose-500 text-[7px] mt-1 uppercase tracking-widest">{actErr[k as string]}</p>
      )}
    </div>
  );

  if (action === "START_CUTTING") {
    return <p className="text-[9px] text-foreground/40 uppercase tracking-[0.2em] leading-relaxed">System acknowledgment: confirming move to cutting spectrum. Immutable log entry initialized.</p>;
  }

  if (action === "SEND_STITCHING") {
    return (
      <>
        {f("quantity", "Transition Node Qty *", "number")}
        {f("pricePerUnit", "Unit Node CPU (₹) *", "number")}
        {f("travel", "Transition Logistics (₹)", "number")}
        {f("vendor", "Artisan / Node Provider")}
        {f("dateDispatched", "Transition Date", "date")}
        {f("notes", "Technical Metadata", "text", true)}
      </>
    );
  }

  if (action === "RETURN_STITCHING") {
    return (
      <>
        {f("quantity", "Nodes Returned *", "number")}
        {f("damageLoss", "Spectrum Loss count", "number")}
        {f("dateReturned", "Return Date", "date")}
        {f("notes", "Technical Metadata", "text", true)}
      </>
    );
  }

  if (action === "SEND_WASH") {
    return (
      <>
        {f("quantity", "Transition Qty *", "number")}
        {f("pricePerUnit", "Wash CPU per unit (₹) *", "number")}
        {f("travel", "Transition Logistics (₹)", "number")}
        {f("vendor", "Refinery / laundry node")}
        {f("dateDispatched", "Departure Timeline", "date")}
        {f("notes", "Technical Metadata", "text", true)}
      </>
    );
  }
  if (action === "RETURN_WASH") {
    return (
      <>
        {f("quantity", "Refinery Nodes returned *", "number")}
        {f("damageLoss", "Spectrum Loss count", "number")}
        {f("dateReturned", "Arrival Timeline", "date")}
        {f("washTotalCost", "Net Refinery Charges (₹) *", "number")}
        {f("notes", "Technical Metadata", "text", true)}
      </>
    );
  }
  if (action === "SEND_PRINTING") {
    return (
      <>
        {f("quantity", "Transition Qty *", "number")}
        {f("pricePerUnit", "Printing CPU per node (₹) *", "number")}
        {f("travel", "Transition Logistics (₹)", "number")}
        {f("vendor", "Node Provider")}
        {f("designRef", "Spectrum Design Ref")}
        {f("dateDispatched", "Departure Timeline", "date")}
        {f("notes", "Technical Metadata", "text", true)}
      </>
    );
  }
  if (action === "RETURN_PRINTING" || action === "RETURN_EMBROIDERY") {
    return (
      <>
        {f("quantity", "Nodes returned *", "number")}
        {f("damageLoss", "Spectrum Loss Nodes", "number")}
        {f("dateReturned", "Arrival Timeline", "date")}
        {f("totalCharges", "Net Node Charges (₹)", "number")}
        {f("notes", "Technical Metadata", "text", true)}
      </>
    );
  }
  if (action === "SEND_EMBROIDERY") {
    return (
      <>
        {f("quantity", "Transition Qty *", "number")}
        {f("pricePerUnit", "Embroidery CPU (₹) *", "number")}
        {f("travel", "Transition Logistics (₹)", "number")}
        {f("vendor", "Artisan Node")}
        {f("dateDispatched", "Departure Timeline", "date")}
        {f("notes", "Technical Metadata", "text", true)}
      </>
    );
  }
  if (action === "MARK_SAMPLE") {
    return (
      <>
        {f("quantity", "Transition Node Qty *", "number")}
        {f("notes", "Technical Metadata", "text", true)}
      </>
    );
  }
  if (action === "QC_PASS" || action === "QC_REJECT") {
    return (
      <>
        {f("quantity", "Audit Node Qty (optional)", "number")}
        {f("remarks", "Audit Rationale", "text", true)}
      </>
    );
  }
  return null;
}

