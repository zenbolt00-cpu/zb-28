"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeftRight,
  Loader2,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Package,
  Truck,
  Check,
  X,
  Clock,
  Inbox,
  ArrowRight,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ExchangeRequest = {
  id: string;
  order: {
    shopifyOrderId: string;
    id: string;
    customer: { name: string; email: string } | null;
  };
  originalProduct: { title: string; id: string };
  newProduct: { title: string; id: string };
  status: string;
  priceDifference: number;
  paymentStatus: string | null;
  newOrderId: string | null;
  createdAt: string;
  updatedAt: string;
};

type Summary = {
  requested: number;
  approved: number;
  shipped: number;
  delivered: number;
  rejected: number;
  total: number;
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  REQUESTED: { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Requested" },
  APPROVED: { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", label: "Approved" },
  SHIPPED: { color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", label: "Shipped" },
  DELIVERED: { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Delivered" },
  REJECTED: { color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", label: "Rejected" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.REQUESTED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.color.replace("text-", "bg-")} ${status === "REQUESTED" ? "animate-pulse" : ""}`} />
      {cfg.label}
    </span>
  );
}

export default function ExchangesPage() {
  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([]);
  const [summary, setSummary] = useState<Summary>({ requested: 0, approved: 0, shipped: 0, delivered: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Ship modal
  const [shipModal, setShipModal] = useState<ExchangeRequest | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchExchanges = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/exchanges?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setExchanges(data.exchanges || []);
        setSummary(data.summary || { requested: 0, approved: 0, shipped: 0, delivered: 0, rejected: 0, total: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  const handleStatusUpdate = async (id: string, status: string, extra?: any) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/exchanges/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extra }),
      });
      if (res.ok) {
        const data = await res.json();
        setExchanges(prev => prev.map(e => e.id === id ? { ...e, ...data.exchange } : e));
        showToast(`Exchange ${status.toLowerCase()} successfully`);
        fetchExchanges();
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

  const handleShipSubmit = () => {
    if (!shipModal) return;
    handleStatusUpdate(shipModal.id, "SHIPPED", { trackingNumber });
    setShipModal(null);
    setTrackingNumber("");
  };

  const summaryCards = [
    { label: "Pending", count: summary.requested, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Approved", count: summary.approved, icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Shipped", count: summary.shipped, icon: Truck, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Delivered", count: summary.delivered, icon: Package, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Rejected", count: summary.rejected, icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
  ];

  const getNextActions = (req: ExchangeRequest) => {
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
            onClick={(e) => { e.stopPropagation(); setShipModal(req); }}
            disabled={actionLoading === req.id}
            className="px-3 py-1.5 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Truck className="w-3 h-3" />
            Ship Order
          </button>
        );
      case "SHIPPED":
        return (
          <button
            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(req.id, "DELIVERED"); }}
            disabled={actionLoading === req.id}
            className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
          >
            Mark Delivered
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
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Exchanges</h1>
          <p className="text-[11px] text-foreground/50 tracking-wide max-w-xl">
            Manage exchange requests, create replacement orders, and track shipments.
          </p>
        </div>
        <button
          onClick={fetchExchanges}
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
            placeholder="Search by order, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center bg-background border border-foreground/[0.05] rounded-md p-1">
          {["all", "REQUESTED", "APPROVED", "SHIPPED", "DELIVERED", "REJECTED"].map((s) => (
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

      {/* Exchanges Table */}
      <div className="bg-background border border-foreground/[0.05] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-foreground/[0.01] border-b border-foreground/[0.05]">
              <tr>
                <th className="px-4 py-3 text-[9px] font-semibold text-foreground/50 uppercase tracking-widest">Order</th>
                <th className="px-4 py-3 text-[9px] font-semibold text-foreground/50 uppercase tracking-widest">Customer</th>
                <th className="px-4 py-3 text-[9px] font-semibold text-foreground/50 uppercase tracking-widest">Original Item</th>
                <th className="px-4 py-3 text-[9px] font-semibold text-foreground/50 uppercase tracking-widest"></th>
                <th className="px-4 py-3 text-[9px] font-semibold text-foreground/50 uppercase tracking-widest">New Item</th>
                <th className="px-4 py-3 text-[9px] font-semibold text-foreground/50 uppercase tracking-widest">Delta</th>
                <th className="px-4 py-3 text-[9px] font-semibold text-foreground/50 uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-[9px] font-semibold text-foreground/50 uppercase tracking-widest text-center">Date</th>
                <th className="px-4 py-3 text-[9px] font-semibold text-foreground/50 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/[0.03]">
              {loading && exchanges.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-foreground/30" />
                    <p className="text-[10px] font-medium uppercase tracking-widest text-foreground/40">Loading exchanges...</p>
                  </td>
                </tr>
              ) : exchanges.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <Inbox className="w-8 h-8 text-foreground/10 mx-auto mb-3" />
                    <p className="text-[11px] font-semibold text-foreground/50 uppercase tracking-tight">No exchanges found</p>
                    <p className="text-[9px] text-foreground/30 mt-1 uppercase tracking-widest">All exchange requests will appear here</p>
                  </td>
                </tr>
              ) : (
                exchanges.map((req) => (
                  <tr key={req.id} className="hover:bg-foreground/[0.01] transition-all group">
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold text-foreground">#{req.order.shopifyOrderId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[11px] font-medium text-foreground">{req.order.customer?.name || "Unknown"}</div>
                      <div className="text-[9px] text-foreground/40 mt-0.5">{req.order.customer?.email}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <div className="text-[11px] font-medium text-foreground/50 truncate line-through decoration-foreground/20">{req.originalProduct?.title}</div>
                    </td>
                    <td className="px-4 py-1">
                      <ArrowRight className="w-3.5 h-3.5 text-foreground/20" />
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <div className="text-[11px] font-medium text-emerald-500 truncate">{req.newProduct?.title}</div>
                    </td>
                    <td className="px-4 py-3">
                      {req.priceDifference !== 0 ? (
                        <span className={`text-[11px] font-semibold ${req.priceDifference > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                          {req.priceDifference > 0 ? "+" : ""}₹{Math.abs(req.priceDifference).toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="text-[10px] text-foreground/20">Even</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status} />
                      {req.newOrderId && (
                        <span className="block text-[8px] text-blue-500/60 mt-1 uppercase tracking-widest">
                          New Order: {req.newOrderId.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[10px] text-foreground/50">
                        {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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

      {/* Ship Modal */}
      <AnimatePresence>
        {shipModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <div className="absolute inset-0 z-0" onClick={() => setShipModal(null)} />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-background w-full max-w-sm rounded-xl p-6 border border-foreground/[0.05] shadow-lg relative z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[12px] font-semibold text-foreground tracking-widest uppercase">Ship Exchange</h2>
                <button onClick={() => setShipModal(null)} className="text-foreground/40 hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-foreground/[0.02] border border-foreground/[0.05] rounded-lg p-3 space-y-2">
                  <p className="text-[10px] text-foreground/50 uppercase tracking-widest">Exchange #{shipModal.id.slice(0, 8)}</p>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-foreground/50 line-through">{shipModal.originalProduct?.title}</span>
                    <ArrowRight className="w-3 h-3 text-foreground/20" />
                    <span className="text-emerald-500 font-medium">{shipModal.newProduct?.title}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-semibold uppercase tracking-widest text-foreground/50 mb-1.5">Tracking Number</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full bg-foreground/[0.02] border border-foreground/[0.05] focus:border-foreground/20 rounded-md px-3 py-2.5 text-[12px] font-mono text-foreground outline-none"
                    placeholder="Enter tracking number..."
                  />
                </div>

                <button
                  onClick={handleShipSubmit}
                  className="w-full py-2.5 bg-purple-500 text-white rounded-md text-[10px] font-semibold uppercase tracking-[0.15em] hover:bg-purple-600 transition-colors mt-2 flex items-center justify-center gap-2"
                >
                  <Truck className="w-3.5 h-3.5" />
                  Confirm Shipment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
