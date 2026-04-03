"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Plus, RefreshCw, Download, TrendingDown, TrendingUp } from "lucide-react";
import { MFG_STAGE_LABEL } from "@/lib/manufacturing/constants";
import { mfgFetch } from "@/lib/manufacturing/mfg-fetch";
import { formatDateTimeIST } from "@/lib/manufacturing/ist";
import { formatInr } from "@/lib/manufacturing/inr";

/** Highlight cost/unit column when above this (₹) — adjust for your margin targets */
const COST_PER_UNIT_WARN_THRESHOLD = 2500;

const MISC_EXPENSE_TYPES = [
  { value: "OTHER", label: "Other" },
  { value: "PACKAGING", label: "Packaging" },
  { value: "COURIER", label: "Courier / logistics" },
  { value: "LABOUR", label: "Labour" },
  { value: "OVERHEAD", label: "Overhead" },
] as const;

type Summary = {
  totalWashSpend: number;
  totalPrintingSpend: number;
  totalEmbroiderySpend: number;
  totalTravelLogistics: number;
  totalFabricAttributed: number;
  totalMiscellaneous: number;
  grandTotalManufacturing: number;
};

type LedgerBatch = {
  batchId: string;
  batchCode: string;
  productName: string;
  quantity: number;
  currentStage: string;
  fabricCost: number;
  washCost: number;
  washCostPerUnit?: number;
  printingCost: number;
  embroideryCost: number;
  travelLogistics: number;
  miscellaneous: number;
  totalCost: number;
  costPerUnit: number;
};

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const x = parseFloat(String(v ?? ""));
  return Number.isFinite(x) ? x : 0;
}

type TrendDeltas = Partial<Record<keyof Summary, number>>;

function DeltaBadge({ delta }: { delta: number | undefined }) {
  if (delta === undefined || !Number.isFinite(delta) || Math.abs(delta) < 0.01) {
    return <span className="text-[10px] text-foreground/35 font-medium">—</span>;
  }
  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums ${
        up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
      }`}
    >
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {formatInr(Math.abs(delta), { maximumFractionDigits: 0 })}
    </span>
  );
}

export default function CostLedgerPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trendDeltas, setTrendDeltas] = useState<TrendDeltas | null>(null);
  const prevSummaryRef = useRef<Summary | null>(null);

  const [batches, setBatches] = useState<LedgerBatch[]>([]);
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ t: "ok" | "err"; m: string } | null>(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [batchId, setBatchId] = useState("");
  const [stage, setStage] = useState("");

  const [batchOptions, setBatchOptions] = useState<{ id: string; batchCode: string }[]>([]);

  const [miscOpen, setMiscOpen] = useState(false);
  const [miscBatch, setMiscBatch] = useState("");
  const [miscExpenseType, setMiscExpenseType] = useState("OTHER");
  const [miscAmount, setMiscAmount] = useState("");
  const [miscDesc, setMiscDesc] = useState("");
  const [miscDate, setMiscDate] = useState("");
  const [miscErr, setMiscErr] = useState<Record<string, string>>({});

  const showToast = (m: string, t: "ok" | "err" = "ok") => {
    setToast({ m, t });
    setTimeout(() => setToast(null), 4000);
  };

  const loadBatches = useCallback(async () => {
    try {
      const res = await mfgFetch("/api/admin/manufacturing/batches");
      const data = await res.json();
      if (!Array.isArray(data)) {
        setBatchOptions([]);
        return;
      }
      setBatchOptions(
        data.map((b: { id: string; batchCode: string }) => ({ id: b.id, batchCode: b.batchCode }))
      );
    } catch {
      setBatchOptions([]);
    }
  }, []);

  const loadLedger = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/manufacturing/cost-ledger", window.location.origin);
      if (from) url.searchParams.set("from", new Date(from).toISOString());
      if (to) url.searchParams.set("to", new Date(to).toISOString());
      if (batchId) url.searchParams.set("batchId", batchId);
      if (stage) url.searchParams.set("stage", stage);
      const res = await mfgFetch(url.toString());
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const raw = data.summary || {};
      const newSummary: Summary = {
        totalWashSpend: num(raw.totalWashSpend),
        totalPrintingSpend: num(raw.totalPrintingSpend),
        totalEmbroiderySpend: num(raw.totalEmbroiderySpend),
        totalTravelLogistics: num(raw.totalTravelLogistics),
        totalFabricAttributed: num(raw.totalFabricAttributed),
        totalMiscellaneous: num(raw.totalMiscellaneous),
        grandTotalManufacturing: num(raw.grandTotalManufacturing),
      };

      const prev = prevSummaryRef.current;
      prevSummaryRef.current = newSummary;
      if (prev) {
        const keys: (keyof Summary)[] = [
          "totalWashSpend",
          "totalPrintingSpend",
          "totalEmbroiderySpend",
          "totalTravelLogistics",
          "totalFabricAttributed",
          "totalMiscellaneous",
          "grandTotalManufacturing",
        ];
        const d: TrendDeltas = {};
        for (const k of keys) d[k] = newSummary[k] - prev[k];
        setTrendDeltas(d);
      } else {
        setTrendDeltas(null);
      }

      setSummary(newSummary);
      setBatches(
        Array.isArray(data.batches)
          ? data.batches.map((b: LedgerBatch) => ({
              ...b,
              fabricCost: num(b.fabricCost),
              washCost: num(b.washCost),
              washCostPerUnit: num(b.washCostPerUnit),
              printingCost: num(b.printingCost),
              embroideryCost: num(b.embroideryCost),
              travelLogistics: num(b.travelLogistics),
              miscellaneous: num(b.miscellaneous),
              totalCost: num(b.totalCost),
              costPerUnit: num(b.costPerUnit),
              quantity: num(b.quantity),
            }))
          : []
      );
      setRange(data.range || null);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Failed to load", "err");
      setSummary(null);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [from, to, batchId, stage]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const saveMisc = async () => {
    const e: Record<string, string> = {};
    const amt = num(miscAmount);
    if (!miscDesc.trim()) e.description = "Description required";
    if (!Number.isFinite(amt) || amt <= 0) e.amount = "Enter a valid amount";
    setMiscErr(e);
    if (Object.keys(e).length) return;

    try {
      const d = miscDate ? new Date(miscDate) : new Date();
      const res = await mfgFetch("/api/admin/manufacturing/misc", {
        method: "POST",
        body: JSON.stringify({
          batchId: miscBatch.trim() || undefined,
          expenseType: miscExpenseType,
          amount: amt,
          description: miscDesc.trim(),
          expenseDate: d.toISOString(),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      showToast("Miscellaneous expense saved");
      setMiscOpen(false);
      setMiscBatch("");
      setMiscExpenseType("OTHER");
      setMiscAmount("");
      setMiscDesc("");
      setMiscDate("");
      setMiscErr({});
      loadLedger();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error", "err");
    }
  };

  const exportCsv = () => {
    const headers = [
      "Batch code",
      "Style",
      "Qty",
      "Stage",
      "Fabric",
      "Wash",
      "Wash/unit",
      "Printing",
      "Embroidery",
      "Travel",
      "Misc",
      "Total",
      "Cost/unit",
    ];
    const rows = batches.map((b) => [
      b.batchCode,
      b.productName.replace(/"/g, '""'),
      String(b.quantity),
      MFG_STAGE_LABEL[b.currentStage] || b.currentStage,
      b.fabricCost.toFixed(2),
      b.washCost.toFixed(2),
      num(b.washCostPerUnit).toFixed(2),
      b.printingCost.toFixed(2),
      b.embroideryCost.toFixed(2),
      b.travelLogistics.toFixed(2),
      b.miscellaneous.toFixed(2),
      b.totalCost.toFixed(2),
      b.costPerUnit.toFixed(2),
    ]);
    const esc = (c: string) => `"${c}"`;
    const body = [headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
    const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cost-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("CSV downloaded");
  };

  const cards: {
    key: keyof Summary;
    label: string;
    highlight?: boolean;
  }[] = summary
    ? [
        { key: "totalFabricAttributed", label: "Fabric (attributed)" },
        { key: "totalWashSpend", label: "Total wash" },
        { key: "totalPrintingSpend", label: "Printing" },
        { key: "totalEmbroiderySpend", label: "Embroidery" },
        { key: "totalTravelLogistics", label: "Travel / logistics" },
        { key: "totalMiscellaneous", label: "Miscellaneous" },
        { key: "grandTotalManufacturing", label: "Grand total", highlight: true },
      ]
    : [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1500px] mx-auto pb-12 pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div className="space-y-1">
          <div className="px-2 py-0.5 bg-foreground/[0.03] rounded-md text-[7px] font-normal text-foreground/50 uppercase tracking-[0.3em] w-fit tracking-widest font-inter">manufacturing hub</div>
          <h1 className="text-lg font-normal text-foreground uppercase tracking-[0.2em] mb-0.5 leading-none mt-1 font-inter">
            Cost & Valuation Ledger
          </h1>
          <p className="text-[9px] text-foreground/40 font-normal uppercase tracking-[0.2em] mt-1">
            Spectrum Financial Audit — Real-time cost attribution across all node stages.
          </p>
          {range && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em]">Audit Window</span>
              <span className="text-[8px] font-normal text-foreground/60 tabular-nums uppercase tracking-tighter">
                {formatDateTimeIST(range.from).split(',')[0]} → {formatDateTimeIST(range.to).split(',')[0]}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadLedger()}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-foreground/[0.05] rounded-md text-[8px] font-normal uppercase tracking-[0.2em] text-foreground/80 dark:text-foreground/60 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} strokeWidth={1.5} />
            REFRESH
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={batches.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-foreground/[0.05] rounded-md text-[8px] font-normal uppercase tracking-[0.2em] text-foreground/80 dark:text-foreground/60 transition-all active:scale-95 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
            EXPORT SPECTRUM
          </button>
          <button
            type="button"
            onClick={() => {
              setMiscOpen(true);
              setMiscErr({});
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background border border-foreground rounded-md text-[8px] font-normal uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-foreground/5"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            RECORD MISC
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {loading && !summary ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
             <Loader2 className="w-8 h-8 animate-spin text-foreground/20" strokeWidth={1} />
             <p className="text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em]">Synching Ledger nodes…</p>
          </div>
        ) : (
          cards.map((c) => (
            <div
              key={c.key}
              className={`bg-white/50 dark:bg-white/[0.01] backdrop-blur-3xl rounded-[1rem] p-4 border transition-all duration-500 shadow-sm flex flex-col justify-between group ${
                c.highlight
                  ? "border-foreground/20 ring-1 ring-foreground/5 bg-foreground/[0.01]"
                  : "border-foreground/[0.05] hover:border-foreground/10"
              }`}
            >
              <div className="space-y-1">
                <div className="text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em] leading-none group-hover:text-foreground/50 transition-colors">
                  {c.label}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-[15px] font-normal text-foreground tabular-nums tracking-tight font-inter">
                    {summary ? formatInr(summary[c.key]) : "₹ 0.00"}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <DeltaBadge delta={trendDeltas?.[c.key]} />
                <span className="text-[6px] font-normal text-foreground/10 uppercase tracking-[0.2em]">Delta-Ref</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Filters */}
      <div className="bg-white/50 dark:bg-white/[0.01] backdrop-blur-3xl rounded-[1rem] p-4 border border-foreground/[0.05] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em]">Query Filters</div>
          <p className="text-[8px] text-foreground/20 uppercase tracking-[0.1em]">
            Default: Current calendar node (IST window)
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all font-inter"
          />
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all font-inter"
          />
          <select
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em] appearance-none"
          >
            <option value="">ALL SPECTRUM BATCHES</option>
            {batchOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batchCode}
              </option>
            ))}
          </select>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em] appearance-none"
          >
            <option value="">ALL NODE STAGES</option>
            {Object.entries(MFG_STAGE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v.toUpperCase()}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => loadLedger()}
            className="bg-foreground text-background rounded-md px-3 py-2 text-[8px] font-normal uppercase tracking-[0.2em] shadow-lg shadow-foreground/5 hover:opacity-90 transition-all"
          >
            APPLY SPECTRUM FILTER
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white/50 dark:bg-white/[0.01] backdrop-blur-3xl rounded-[1rem] border border-foreground/[0.05] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] font-inter min-w-[1100px]">
            <thead className="bg-foreground/[0.02] border-b border-foreground/[0.05]">
              <tr>
                <th className="px-4 py-4 text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em]">Batch / Style</th>
                <th className="px-4 py-4 text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em]">Stage</th>
                <th className="px-4 py-4 text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em]">Fabric</th>
                <th className="px-4 py-4 text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em]">Wash</th>
                <th className="px-4 py-4 text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em]">Wash/U</th>
                <th className="px-4 py-4 text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em]">Print</th>
                <th className="px-4 py-4 text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em]">Emb.</th>
                <th className="px-4 py-4 text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em]">Travel</th>
                <th className="px-4 py-4 text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em]">Misc</th>
                <th className="px-4 py-4 text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em]">Total</th>
                <th className="px-4 py-4 text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em]">₹ / Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/[0.02]">
              {loading && batches.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center">
                    <Loader2 className="w-6 h-6 animate-spin inline text-foreground/10" strokeWidth={1} />
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center text-foreground/30 text-[9px] uppercase tracking-[0.2em]">
                    No spectrum data matched the current query.
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.batchId} className="hover:bg-foreground/[0.01] transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-normal text-foreground/40 text-[8px] uppercase tracking-wider tabular-nums">{b.batchCode}</div>
                      <div className="font-normal text-foreground uppercase tracking-tight text-[11px] mt-1">{b.productName}</div>
                      <div className="text-[7px] text-foreground/30 uppercase tracking-[0.2em] mt-1">Nodes: {b.quantity}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[9px] font-normal text-foreground/60 uppercase tracking-[0.1em]">
                        {MFG_STAGE_LABEL[b.currentStage] || b.currentStage}
                      </span>
                    </td>
                    <td className="px-4 py-4 tabular-nums text-foreground/70">{formatInr(b.fabricCost)}</td>
                    <td className="px-4 py-4 tabular-nums text-foreground/70">{formatInr(b.washCost)}</td>
                    <td className="px-4 py-4 tabular-nums text-foreground/40">{formatInr(num(b.washCostPerUnit))}</td>
                    <td className="px-4 py-4 tabular-nums text-foreground/70">{formatInr(b.printingCost)}</td>
                    <td className="px-4 py-4 tabular-nums text-foreground/70">{formatInr(b.embroideryCost)}</td>
                    <td className="px-4 py-4 tabular-nums text-foreground/70">{formatInr(b.travelLogistics)}</td>
                    <td className="px-4 py-4 tabular-nums text-foreground/70">{formatInr(b.miscellaneous)}</td>
                    <td className="px-4 py-4 tabular-nums font-normal text-foreground underline decoration-foreground/5 decoration-dotted underline-offset-4">{formatInr(b.totalCost)}</td>
                    <td className="px-4 py-4 tabular-nums">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-normal ${
                          b.costPerUnit > COST_PER_UNIT_WARN_THRESHOLD
                            ? "bg-rose-500/5 text-rose-500"
                            : "text-foreground/80"
                        }`}>
                        {formatInr(b.costPerUnit)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Misc Expense Modal */}
      {miscOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white/90 dark:bg-black/80 backdrop-blur-2xl rounded-[1rem] border border-foreground/[0.05] shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto font-inter">
            <div className="space-y-1">
              <h2 className="text-[11px] font-normal text-foreground uppercase tracking-[0.2em] leading-none">RECORD MISCELLANEOUS EXPENSE</h2>
              <p className="text-[9px] text-foreground/40 uppercase tracking-[0.2em]">Batch linkage is optional; unallocated units roll into period net valuation.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Spectrum Batch Linkage</label>
                <select
                  value={miscBatch}
                  onChange={(e) => setMiscBatch(e.target.value)}
                  className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em] appearance-none"
                >
                  <option value="">UNALLOCATED (NULL-LINK)</option>
                  {batchOptions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchCode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Expense Protocol</label>
                <select
                  value={miscExpenseType}
                  onChange={(e) => setMiscExpenseType(e.target.value)}
                  className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em] appearance-none"
                >
                  {MISC_EXPENSE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Valuation Amount (₹) *</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={miscAmount}
                  onChange={(e) => setMiscAmount(e.target.value)}
                  className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all tabular-nums font-inter"
                />
                {miscErr.amount && <p className="text-rose-500 text-[7px] mt-1 uppercase tracking-widest">{miscErr.amount}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Technical Description *</label>
                <input
                  value={miscDesc}
                  onChange={(e) => setMiscDesc(e.target.value)}
                  placeholder="E.G. PACKAGING, COURIER, LABOUR"
                  className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em]"
                />
                {miscErr.description && (
                  <p className="text-rose-500 text-[7px] mt-1 uppercase tracking-widest">{miscErr.description}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Log Date</label>
                <input
                  type="date"
                  value={miscDate}
                  onChange={(e) => setMiscDate(e.target.value)}
                  className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all font-inter"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-6 border-t border-foreground/[0.05]">
              <button
                type="button"
                onClick={() => setMiscOpen(false)}
                className="px-5 py-2 rounded-md text-[8px] font-normal uppercase tracking-[0.2em] text-foreground/40 hover:text-foreground/60 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveMisc}
                className="px-8 py-2 bg-foreground text-background rounded-md text-[8px] font-normal uppercase tracking-[0.3em] shadow-lg shadow-foreground/5 hover:opacity-90 transition-all"
              >
                COMMIT EXPENSE
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-[2rem] text-[10px] font-normal uppercase tracking-[0.2em] shadow-2xl animate-in fade-in slide-in-from-bottom-4 border border-foreground/[0.05] backdrop-blur-xl ${
            toast?.t === "ok"
              ? "bg-foreground text-background"
              : "bg-rose-500 text-white"
          }`}
        >
          {toast?.m}
        </div>
      )}
    </div>
  );
}
