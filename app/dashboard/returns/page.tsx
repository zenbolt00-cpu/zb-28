"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Undo2,
  Loader2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ChevronDown,
  RefreshCw,
  Package,
  CreditCard,
  AlertTriangle,
  Check,
  X,
  Clock,
  Inbox,
  ArrowUpRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ReturnRequest = {
  id: string;
  order: { shopifyOrderId: string; id: string };
  customer: { name: string; email: string; id: string };
  product: { title: string; id: string };
  sku: string | null;
  reason: string;
  status: string;
  returnMethod: string | null;
  trackingNumber: string | null;
  refundAmount: number | null;
  refundStatus: string | null;
  requestedAt: string;
  updatedAt: string;
};

type Summary = {
  requested: number;
  approved: number;
  received: number;
  refunded: number;
  rejected: number;
  total: number;
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  REQUESTED: { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Requested" },
  APPROVED: { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", label: "Approved" },
  RECEIVED: { color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", label: "Item Received" },
  REFUNDED: { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Refunded" },
  REJECTED: { color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", label: "Rejected" },
  PICKUP_SCHEDULED: { color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20", label: "Pickup Scheduled" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.REQUESTED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.color.replace('text-', 'bg-')} ${status === 'REQUESTED' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [summary, setSummary] = useState<Summary>({ requested: 0, approved: 0, received: 0, refunded: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Refund modal state
  const [refundModal, setRefundModal] = useState<ReturnRequest | null>(null);
  const [refundAmount, setRefundAmount] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (reasonFilter !== "all") params.set("reason", reasonFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/returns?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReturns(data.returns || []);
        setSummary(data.summary || { requested: 0, approved: 0, received: 0, refunded: 0, rejected: 0, total: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, reasonFilter, search]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const handleStatusUpdate = async (id: string, status: string, extra?: any) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/returns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extra }),
      });
      if (res.ok) {
        const data = await res.json();
        setReturns(prev => prev.map(r => r.id === id ? { ...r, ...data.return } : r));
        showToast(`Return ${status.toLowerCase()} successfully`);
        // Refresh summary
        fetchReturns();
      } else {
        const err = await res.json();
        showToast(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
      showToast("Status update failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (action: "approve" | "reject") => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch(`/api/admin/returns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: Array.from(selectedIds) }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message);
        setSelectedIds(new Set());
        fetchReturns();
      }
    } catch (err) {
      console.error(err);
      showToast("Bulk action failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleRefundSubmit = () => {
    if (!refundModal) return;
    handleStatusUpdate(refundModal.id, "REFUNDED", { refundAmount: parseFloat(refundAmount) || refundModal.refundAmount });
    setRefundModal(null);
    setRefundAmount("");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const requestedReturns = returns.filter(r => r.status === "REQUESTED");
    if (selectedIds.size === requestedReturns.length && requestedReturns.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(requestedReturns.map(r => r.id)));
    }
  };

  const summaryCards = [
    { label: "Pending", count: summary.requested, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Approved", count: summary.approved, icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Received", count: summary.received, icon: Package, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Refunded", count: summary.refunded, icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Rejected", count: summary.rejected, icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
  ];

  const getNextActions = (req: ReturnRequest) => {
    switch (req.status) {
      case "REQUESTED":
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); handleStatusUpdate(req.id, "REJECTED"); }}
              disabled={actionLoading === req.id}
              className="px-3 py-1.5 rounded-lg text-rose-500 hover:bg-rose-500/5 border border-rose-500/10 text-[8px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
            >
              Deny
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleStatusUpdate(req.id, "APPROVED"); }}
              disabled={actionLoading === req.id}
              className="px-3 py-1.5 bg-foreground text-background rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-foreground/5 disabled:opacity-50"
            >
              {actionLoading === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Approve"}
            </button>
          </div>
        );
      case "APPROVED":
        return (
          <button
            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(req.id, "RECEIVED"); }}
            disabled={actionLoading === req.id}
            className="px-3 py-1.5 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
          >
            Mark Received
          </button>
        );
      case "RECEIVED":
        return (
          <button
            onClick={(e) => { e.stopPropagation(); setRefundModal(req); setRefundAmount(String(req.refundAmount || "")); }}
            disabled={actionLoading === req.id}
            className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            <CreditCard className="w-3 h-3" />
            Issue Refund
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 pb-20 relative z-10"
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-8 left-1/2 z-50 bg-background border border-foreground/[0.05] rounded-md px-4 py-2 text-[10px] font-medium text-foreground shadow-sm flex items-center gap-2 uppercase tracking-wide"
          >
            <Check className="w-3 h-3 text-green-500" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Returns</h1>
          <p className="text-[11px] text-foreground/50 tracking-wide max-w-xl">
            Manage return requests, track item returns, and process refunds.
          </p>
        </div>
        <button
          onClick={fetchReturns}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-md text-[10px] font-medium uppercase tracking-[0.15em] hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setStatusFilter(card.label === "Pending" ? "REQUESTED" : card.label.toUpperCase())}
              className={`glass-card p-4 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden ${statusFilter === (card.label === "Pending" ? "REQUESTED" : card.label.toUpperCase()) ? "ring-1 ring-foreground/20" : ""}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-[0.3em]">{card.label}</span>
                <div className={`w-7 h-7 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tighter">{card.count}</p>
              <div className={`absolute -right-4 -bottom-4 w-16 h-16 ${card.bg} blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
            </motion.button>
          );
        })}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40" />
          <input
            className="w-full bg-background border border-foreground/[0.05] rounded-md pl-9 pr-4 py-2 text-[11px] font-medium text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-foreground/20 transition-colors"
            placeholder="Search by order, customer, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-background border border-foreground/[0.05] rounded-md p-1">
            {["all", "REQUESTED", "APPROVED", "RECEIVED", "REFUNDED", "REJECTED"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-[4px] text-[8px] font-medium uppercase tracking-[0.15em] transition-colors whitespace-nowrap ${
                  statusFilter === s ? "bg-foreground text-background" : "text-foreground/50 hover:bg-foreground/[0.03]"
                }`}
              >
                {s === "all" ? "All" : STATUS_CONFIG[s]?.label || s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between bg-foreground/[0.03] border border-foreground/[0.05] rounded-xl px-5 py-3"
          >
            <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-widest">
              {selectedIds.size} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction("reject")}
                disabled={bulkLoading}
                className="px-4 py-1.5 rounded-lg text-rose-500 hover:bg-rose-500/5 border border-rose-500/10 text-[8px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
              >
                Bulk Reject
              </button>
              <button
                onClick={() => handleBulkAction("approve")}
                disabled={bulkLoading}
                className="px-4 py-1.5 bg-foreground text-background rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-lg disabled:opacity-50"
              >
                {bulkLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Bulk Approve"}
              </button>
              <button onClick={() => setSelectedIds(new Set())} className="p-1.5 text-foreground/40 hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Returns Table */}
      <div className="bg-background border border-foreground/[0.05] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-foreground/[0.01] border-b border-foreground/[0.05]">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size > 0 && selectedIds.size === returns.filter(r => r.status === "REQUESTED").length}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-foreground/20 text-foreground accent-foreground"
                  />
                </th>
                <th className="px-4 py-3 text-[9px] font-semibold text-foreground/50 uppercase tracking-widest">Order</th>
                <th className="px-4 py-3 text-[9px] font-semibold text-foreground/50 uppercase tracking-widest">Customer</th>
                <th className="px-4 py-3 text-[9px] font-semibold text-foreground/50 uppercase tracking-widest">Product</th>
                <th className="px-4 py-3 text-[9px] font-semibold text-foreground/50 uppercase tracking-widest">Reason</th>
                <th className="px-4 py-3 text-[9px] font-semibold text-foreground/50 uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-[9px] font-semibold text-foreground/50 uppercase tracking-widest">Refund</th>
                <th className="px-4 py-3 text-[9px] font-semibold text-foreground/50 uppercase tracking-widest text-center">Date</th>
                <th className="px-4 py-3 text-[9px] font-semibold text-foreground/50 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/[0.03]">
              {loading && returns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-foreground/30" />
                    <p className="text-[10px] font-medium uppercase tracking-widest text-foreground/40">Loading returns...</p>
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <Inbox className="w-8 h-8 text-foreground/10 mx-auto mb-3" />
                    <p className="text-[11px] font-semibold text-foreground/50 uppercase tracking-tight">No returns found</p>
                    <p className="text-[9px] text-foreground/30 mt-1 uppercase tracking-widest">All return requests will appear here</p>
                  </td>
                </tr>
              ) : (
                returns.map((req) => (
                  <tr key={req.id} className="hover:bg-foreground/[0.01] transition-all group">
                    <td className="px-4 py-3">
                      {req.status === "REQUESTED" && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(req.id)}
                          onChange={() => toggleSelect(req.id)}
                          className="w-3.5 h-3.5 rounded border-foreground/20 text-foreground accent-foreground"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold text-foreground">#{req.order.shopifyOrderId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[11px] font-medium text-foreground">{req.customer?.name || "Unknown"}</div>
                      <div className="text-[9px] text-foreground/40 mt-0.5">{req.customer?.email}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <div className="text-[11px] font-medium text-foreground truncate">{req.product?.title}</div>
                      {req.sku && <div className="text-[9px] text-foreground/40 font-mono mt-0.5">SKU: {req.sku}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-foreground/60 capitalize">{req.reason}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-4 py-3">
                      {req.refundAmount ? (
                        <div>
                          <span className="text-[11px] font-semibold text-foreground">₹{req.refundAmount.toLocaleString("en-IN")}</span>
                          {req.refundStatus && (
                            <span className={`block text-[8px] uppercase tracking-widest mt-0.5 ${
                              req.refundStatus === "COMPLETED" ? "text-emerald-500" :
                              req.refundStatus === "FAILED" ? "text-rose-500" : "text-amber-500"
                            }`}>
                              {req.refundStatus}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-foreground/20">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[10px] text-foreground/50">
                        {new Date(req.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {getNextActions(req)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Modal */}
      <AnimatePresence>
        {refundModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <div className="absolute inset-0 z-0" onClick={() => setRefundModal(null)} />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-background w-full max-w-sm rounded-xl p-6 border border-foreground/[0.05] shadow-lg relative z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[12px] font-semibold text-foreground tracking-widest uppercase">Issue Refund</h2>
                <button onClick={() => setRefundModal(null)} className="text-foreground/40 hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-foreground/[0.02] border border-foreground/[0.05] rounded-lg p-3 space-y-1">
                  <p className="text-[10px] text-foreground/50 uppercase tracking-widest">Order #{refundModal.order.shopifyOrderId}</p>
                  <p className="text-[11px] font-medium text-foreground">{refundModal.product?.title}</p>
                  <p className="text-[10px] text-foreground/50">Reason: {refundModal.reason}</p>
                </div>

                <div>
                  <label className="block text-[9px] font-semibold uppercase tracking-widest text-foreground/50 mb-1.5">Refund Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full bg-foreground/[0.02] border border-foreground/[0.05] focus:border-foreground/20 rounded-md px-3 py-2.5 text-[14px] font-semibold text-foreground outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-amber-600 dark:text-amber-400">
                    This will trigger a Shopify refund for the original payment method. This action cannot be undone.
                  </p>
                </div>

                <button
                  onClick={handleRefundSubmit}
                  className="w-full py-2.5 bg-emerald-500 text-white rounded-md text-[10px] font-semibold uppercase tracking-[0.15em] hover:bg-emerald-600 transition-colors mt-2 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Process Refund
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
