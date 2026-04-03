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
    <div className="w-full space-y-6 sm:space-y-8 pb-12 pt-4 lg:pt-10 max-w-[1500px] mx-auto overflow-x-hidden lg:overflow-visible">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground uppercase tracking-tighter leading-none">Cost Ledger</h1>
          <p className="text-sm text-foreground/55 max-w-3xl leading-relaxed">
            Live roll-up of fabric OUT linked to batches, stage transition costs, travel lines from logs,
            and miscellaneous charges. Filters re-query the API; export reflects the current table.
          </p>
          {range && (
            <p className="text-[11px] text-foreground/50 mt-2">
              <span className="font-semibold text-foreground/60">Range (IST):</span>{" "}
              <span className="font-mono">{formatDateTimeIST(range.from)}</span>
              <span className="mx-1.5 text-foreground/30">→</span>
              <span className="font-mono">{formatDateTimeIST(range.to)}</span>
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 mt-4 lg:mt-0 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => loadLedger()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-foreground/10 text-[12px] font-semibold hover:bg-foreground/[0.04]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={batches.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-foreground/10 text-[12px] font-semibold hover:bg-foreground/[0.04] disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setMiscOpen(true);
              setMiscErr({});
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-foreground text-background text-[12px] font-bold shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add misc expense
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {loading && !summary ? (
          <div className="col-span-full flex justify-center py-16 text-foreground/45">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
        ) : (
          cards.map((c) => (
            <div
              key={c.key}
              className={`rounded-2xl border p-4 sm:p-5 bg-foreground/[0.02] ${
                c.highlight
                  ? "border-foreground/20 ring-1 ring-foreground/10 shadow-lg"
                  : "border-foreground/10"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 leading-snug">
                {c.label}
              </p>
              <div className="flex items-end justify-between gap-2 mt-3">
                <p
                  className={`text-2xl sm:text-3xl font-bold tabular-nums font-inter leading-none ${
                    c.highlight ? "text-foreground" : "text-foreground/90"
                  }`}
                >
                  {summary ? formatInr(summary[c.key]) : "—"}
                </p>
                <div className="pb-1 sm:pb-0.5">
                  <DeltaBadge delta={trendDeltas?.[c.key]} />
                </div>
              </div>
              <p className="text-[9px] text-foreground/35 mt-2 font-medium">
                vs previous refresh
              </p>
            </div>
          ))
        )}
      </section>

      <section className="rounded-3xl border border-foreground/10 bg-foreground/[0.02] p-4 sm:p-5 space-y-4 shadow-sm">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-foreground/40">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border border-foreground/10 bg-background/50 px-3 py-2.5 text-sm"
          />
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border border-foreground/10 bg-background/50 px-3 py-2.5 text-sm"
          />
          <select
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="rounded-xl border border-foreground/10 bg-background/50 px-3 py-2.5 text-sm"
          >
            <option value="">All batch IDs</option>
            {batchOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batchCode}
              </option>
            ))}
          </select>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="rounded-xl border border-foreground/10 bg-background/50 px-3 py-2.5 text-sm"
          >
            <option value="">All stages</option>
            {Object.entries(MFG_STAGE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => loadLedger()}
            className="rounded-xl border border-foreground/10 px-3 py-2.5 text-sm font-semibold hover:bg-foreground/5"
          >
            Apply filters
          </button>
        </div>
        <p className="text-[11px] text-foreground/45">
          Empty dates default to the current calendar month (UTC window from the server).
        </p>
      </section>

      <section className="rounded-3xl border border-foreground/10 overflow-hidden shadow-lg bg-foreground/[0.02] w-full">
        <div className="overflow-x-auto max-h-[min(70vh,720px)] overflow-y-auto w-full">
          <table className="w-full text-left text-[11px] font-inter min-w-[1180px] border-collapse">
            <thead className="sticky top-0 z-10 bg-foreground/[0.08] backdrop-blur-md border-b border-foreground/10 text-foreground/50 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-3 py-3.5">Batch / style</th>
                <th className="px-3 py-3.5">Stage</th>
                <th className="px-3 py-3.5">Fabric</th>
                <th className="px-3 py-3.5">Wash</th>
                <th className="px-3 py-3.5">Wash/u</th>
                <th className="px-3 py-3.5">Print</th>
                <th className="px-3 py-3.5">Emb.</th>
                <th className="px-3 py-3.5">Travel</th>
                <th className="px-3 py-3.5">Misc</th>
                <th className="px-3 py-3.5">Total</th>
                <th className="px-3 py-3.5">₹ / unit</th>
              </tr>
            </thead>
            <tbody>
              {loading && batches.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-14 text-center text-foreground/45">
                    <Loader2 className="w-6 h-6 animate-spin inline" />
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-14 text-center text-foreground/45">
                    No batch rows for this filter. Log fabric OUT against batches, stage costs, or misc
                    expenses in range.
                  </td>
                </tr>
              ) : (
                batches.map((b, i) => (
                  <tr
                    key={b.batchId}
                    className={`border-b border-foreground/[0.06] hover:bg-foreground/[0.04] transition-colors align-top ${
                      i % 2 === 1 ? "bg-foreground/[0.02]" : ""
                    }`}
                  >
                    <td className="px-3 py-3">
                      <div className="font-mono text-[10px] text-foreground/45">{b.batchCode}</div>
                      <div className="font-semibold text-foreground mt-0.5">{b.productName}</div>
                      <div className="text-[10px] text-foreground/40 mt-1">Qty {b.quantity}</div>
                    </td>
                    <td className="px-3 py-3 text-foreground/70 max-w-[150px] leading-snug">
                      {MFG_STAGE_LABEL[b.currentStage] || b.currentStage}
                    </td>
                    <td className="px-3 py-3 tabular-nums">{formatInr(b.fabricCost)}</td>
                    <td className="px-3 py-3 tabular-nums">{formatInr(b.washCost)}</td>
                    <td className="px-3 py-3 tabular-nums text-foreground/80">
                      {formatInr(num(b.washCostPerUnit))}
                    </td>
                    <td className="px-3 py-3 tabular-nums">{formatInr(b.printingCost)}</td>
                    <td className="px-3 py-3 tabular-nums">{formatInr(b.embroideryCost)}</td>
                    <td className="px-3 py-3 tabular-nums">{formatInr(b.travelLogistics)}</td>
                    <td className="px-3 py-3 tabular-nums">{formatInr(b.miscellaneous)}</td>
                    <td className="px-3 py-3 tabular-nums font-bold">{formatInr(b.totalCost)}</td>
                    <td
                      className={`px-3 py-3 tabular-nums font-semibold ${
                        b.costPerUnit > COST_PER_UNIT_WARN_THRESHOLD
                          ? "text-amber-600 dark:text-amber-300"
                          : ""
                      }`}
                    >
                      {formatInr(b.costPerUnit)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {miscOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-background/70 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-foreground/10 bg-foreground/[0.03] p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-lg font-bold">Add miscellaneous expense</h2>
            <p className="text-[12px] text-foreground/50">
              Batch is optional — unallocated misc still rolls into period totals. Description and amount
              are required.
            </p>
            <div>
              <label className="text-[11px] font-bold text-foreground/50">Batch (optional)</label>
              <select
                value={miscBatch}
                onChange={(e) => setMiscBatch(e.target.value)}
                className="mt-1 w-full rounded-xl border border-foreground/10 bg-background/50 px-3 py-2.5 text-sm"
              >
                <option value="">Unallocated</option>
                {batchOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchCode}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-foreground/50">Expense type</label>
              <select
                value={miscExpenseType}
                onChange={(e) => setMiscExpenseType(e.target.value)}
                className="mt-1 w-full rounded-xl border border-foreground/10 bg-background/50 px-3 py-2.5 text-sm"
              >
                {MISC_EXPENSE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-foreground/50">Amount (₹) *</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={miscAmount}
                onChange={(e) => setMiscAmount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-foreground/10 bg-background/50 px-3 py-2.5 text-sm tabular-nums"
              />
              {miscErr.amount && <p className="text-red-500 text-[11px] mt-1">{miscErr.amount}</p>}
            </div>
            <div>
              <label className="text-[11px] font-bold text-foreground/50">Description *</label>
              <input
                value={miscDesc}
                onChange={(e) => setMiscDesc(e.target.value)}
                placeholder="e.g. packaging, courier, labour"
                className="mt-1 w-full rounded-xl border border-foreground/10 bg-background/50 px-3 py-2.5 text-sm"
              />
              {miscErr.description && (
                <p className="text-red-500 text-[11px] mt-1">{miscErr.description}</p>
              )}
            </div>
            <div>
              <label className="text-[11px] font-bold text-foreground/50">Date</label>
              <input
                type="date"
                value={miscDate}
                onChange={(e) => setMiscDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-foreground/10 bg-background/50 px-3 py-2.5 text-sm"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2 border-t border-foreground/10">
              <button
                type="button"
                onClick={() => setMiscOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-foreground/10 text-[12px] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveMisc}
                className="px-4 py-2.5 rounded-xl bg-foreground text-background text-[12px] font-bold"
              >
                Save expense
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-[min(92vw,400px)] px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl text-center ${
            toast?.t === "ok" ? "bg-foreground text-background" : "bg-red-600 text-white"
          }`}
        >
          {toast?.m}
        </div>
      )}
    </div>
  );
}
