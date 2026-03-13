"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ExternalLink,
  Search,
  Plus,
  X,
  Edit2
} from "lucide-react";

interface LineItem {
  id: number;
  title: string;
  name?: string;
  quantity: number;
  price: string;
  sku: string | null;
  variant_title?: string | null;
}

interface ShopifyOrder {
  id: number;
  name: string;
  order_number: number;
  created_at: string;
  total_price: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  deliveryStatus?: string;
  note: string | null;
  customer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  line_items: LineItem[];
  shipping_address?: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    company?: string | null;
    city: string;
    province: string;
    zip: string;
    country: string;
    phone?: string | null;
  };
}

interface ShopifyProduct {
  id: number;
  title: string;
  variants: {
    id: number;
    title: string;
    price: string;
    inventory_quantity: number;
  }[];
}

const SHOPIFY_DOMAIN =
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "8tiahf-bk.myshopify.com";

type StatusFilter = "any" | "unfulfilled" | "fulfilled" | "refunded";

function StatusBadge({ status, type }: { status: string | null; type: "payment" | "fulfillment" | "delivery" }) {
  const label = status || (type === "fulfillment" ? "unfulfilled" : type === "delivery" ? "pending" : "pending");
  const colors: Record<string, string> = {
    paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    refunded: "bg-red-500/10 text-red-500 border-red-500/20",
    partially_refunded: "bg-red-400/10 text-red-400 border-red-400/20",
    fulfilled: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    delivered: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    partial: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    unfulfilled: "bg-background/10 text-muted-foreground border-foreground/10",
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    authorized: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colors[label] || "bg-foreground/5 text-muted-foreground border-foreground/10"}`}>
      {label}
    </span>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [fulfilling, setFulfilling] = useState<number | null>(null);
  const [delivering, setDelivering] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("any");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // New Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ShopifyOrder | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState({
    email: "", firstName: "", lastName: "", variantId: "", quantity: 1, address1: "", city: "", zip: "", country: ""
  });
  const [editForm, setEditForm] = useState({ note: "", email: "" });
  
  // Product Selection State
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  // Fetch products when modal opens
  useEffect(() => {
    if (isCreateModalOpen && products.length === 0) {
      const loadProducts = async () => {
        setIsProductsLoading(true);
        try {
          const res = await fetch("/api/shopify/products");
          const data = await res.json();
          setProducts(data.products || []);
        } catch (err) {
          console.error("Failed to fetch products", err);
        } finally {
          setIsProductsLoading(false);
        }
      };
      loadProducts();
    }
  }, [isCreateModalOpen, products.length]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/shopify/orders?limit=50&status=${statusFilter === "any" ? "any" : "open"}`
      );
      const data = await res.json();
      setOrders(data.orders || []);
      if (data.error) setError(`Shopify API: ${data.error}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch orders";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleFulfill = async (order: ShopifyOrder) => {
    setFulfilling(order.id);
    try {
      const res = await fetch(`/api/shopify/orders/${order.id}/fulfill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fulfillment failed");
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, fulfillment_status: "fulfilled" } : o
        )
      );
      showToast(`Order ${order.name} marked as fulfilled!`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Fulfillment failed";
      showToast(`Error: ${message}`);
    } finally {
      setFulfilling(null);
    }
  };

  const handleDeliver = async (order: ShopifyOrder) => {
    setDelivering(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delivery update failed");
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, deliveryStatus: "delivered" } : o
        )
      );
      showToast(`Order ${order.name} marked as delivered!`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Delivery update failed";
      showToast(`Error: ${message}`);
    } finally {
      setDelivering(null);
    }
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/shopify/orders/${editingOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: editForm.note, email: editForm.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      
      setOrders(prev => prev.map(o => o.id === editingOrder.id ? { ...o, note: editForm.note, email: editForm.email } : o));
      showToast("Order updated successfully!");
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Update failed";
      showToast(`Error: ${message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.variantId) {
      showToast("Error: Please select a product variant");
      return;
    }
    
    setActionLoading(true);
    try {
      const payload = {
        customer: { email: createForm.email, first_name: createForm.firstName, last_name: createForm.lastName },
        line_items: [{ variant_id: parseInt(createForm.variantId, 10), quantity: createForm.quantity }],
        shipping_address: { address1: createForm.address1, city: createForm.city, zip: createForm.zip, country: createForm.country, first_name: createForm.firstName, last_name: createForm.lastName },
        financial_status: 'pending'
      };

      const res = await fetch(`/api/shopify/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      
      setOrders(prev => [data.order, ...prev]);
      showToast("Order created successfully!");
      setIsCreateModalOpen(false);
      setCreateForm({ email: "", firstName: "", lastName: "", variantId: "", quantity: 1, address1: "", city: "", zip: "", country: "" });
      setSelectedProductId("");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Create failed";
      showToast(`Error: ${message}`);
    } finally {
        setActionLoading(false);
    }
  };

  const displayedOrders = orders.filter((o) => {
    if (statusFilter === "unfulfilled" && o.fulfillment_status === "fulfilled") return false;
    if (statusFilter === "fulfilled" && o.fulfillment_status !== "fulfilled") return false;
    if (statusFilter === "refunded" && o.financial_status !== "refunded") return false;
    if (search) {
      const term = search.toLowerCase();
      const customerName = o.customer
        ? `${o.customer.first_name || ""} ${o.customer.last_name || ""}`.toLowerCase()
        : "";
      return o.name.toLowerCase().includes(term) || customerName.includes(term) ||
        o.customer?.email?.toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {toast && (
        <div className="fixed top-6 right-6 z-50 glass-card rounded-xl px-5 py-3 text-sm text-foreground border border-foreground/10 flex items-center gap-2 shadow-xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          {toast}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1 transition-colors">Orders</h1>
          <p className="text-muted-foreground text-sm">
            Live orders synced from Shopify — {orders.length} total.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:opacity-90 rounded-xl text-sm font-semibold transition-all w-fit shadow-lg shadow-foreground/5"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 glass glass-hover border border-foreground/5 rounded-xl text-sm font-medium text-foreground disabled:opacity-50 w-fit"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-foreground/20 transition-all"
            placeholder="Search by order #, customer name, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["any", "unfulfilled", "fulfilled", "refunded"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm capitalize ${
                statusFilter === s ? "bg-foreground text-background" : "glass glass-hover text-muted-foreground border border-foreground/5"
              }`}
            >
              {s === "any" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="glass-card rounded-2xl p-4 border border-red-500/20 text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden shadow-xl shadow-foreground/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-foreground/5 border-b border-foreground/10 uppercase tracking-widest text-[10px] text-muted-foreground font-bold">
              <tr>
                <th className="px-5 py-4 w-8"></th>
                <th className="px-5 py-4 text-center">Order</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Fulfillment</th>
                <th className="px-5 py-4">Delivery</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    No orders match your filters.
                  </td>
                </tr>
              ) : (
                displayedOrders.map((order) => {
                  const rawName = order.customer
                    ? `${order.customer.first_name || ""} ${order.customer.last_name || ""}`.trim()
                    : "";
                  const customerName = rawName || (order.customer ? "Name Redacted" : "Anonymous");
                  const isExpanded = expanded === order.id;
                  const isFulfilling = fulfilling === order.id;
                  const isDelivering = delivering === order.id;
                  const canFulfill =
                    !order.fulfillment_status || order.fulfillment_status === "unfulfilled";
                  const canDeliver =
                    order.fulfillment_status === "fulfilled" && order.deliveryStatus !== "delivered";

                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className="hover:bg-foreground/[0.03] transition-colors cursor-pointer group"
                        onClick={() => setExpanded(isExpanded ? null : order.id)}
                      >
                        <td className="px-5 py-4 text-muted-foreground">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs font-bold text-foreground">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="hover:text-blue-500 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {order.name}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-foreground/80">
                          <div className={`font-medium ${rawName ? "" : "text-muted-foreground italic"}`}>{customerName}</div>
                          {order.customer?.email && (
                            <div className="text-[10px] text-muted-foreground/60">{order.customer.email}</div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={order.financial_status} type="payment" />
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={order.fulfillment_status} type="fulfillment" />
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={order.deliveryStatus || 'pending'} type="delivery" />
                        </td>
                        <td className="px-5 py-4 text-foreground font-semibold">
                          ₹{parseFloat(order.total_price).toLocaleString("en-IN")}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground text-xs font-medium">
                          {new Date(order.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {canFulfill && (
                              <button
                                onClick={() => handleFulfill(order)}
                                disabled={isFulfilling}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
                              >
                                {isFulfilling ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                Fulfill
                              </button>
                            )}
                            {canDeliver && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeliver(order); }}
                                disabled={isDelivering}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-500 hover:text-white disabled:opacity-50 transition-all shadow-sm"
                              >
                                {isDelivering ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                Deliver
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingOrder(order);
                                setEditForm({ note: order.note || "", email: order.customer?.email || "" });
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 glass glass-hover border border-foreground/5 rounded-lg transition-all"
                              title="Edit Order"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            <a
                              href={`https://${SHOPIFY_DOMAIN}/admin/orders/${order.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 glass glass-hover border border-foreground/5 rounded-lg transition-all"
                              title="Open in Shopify Admin"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                            </a>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {isExpanded && (
                        <tr className="bg-foreground/[0.02]">
                          <td colSpan={9} className="px-8 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {/* Line Items */}
                              <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                                  Items ({order.line_items.length})
                                </h4>
                                <div className="space-y-3">
                                  {order.line_items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex justify-between items-center text-sm border-b border-foreground/5 pb-2"
                                    >
                                      <div>
                                        <span className="text-foreground font-semibold">
                                          {item.name || item.title}
                                        </span>
                                        {item.variant_title && (
                                          <span className="text-xs text-muted-foreground ml-2 font-medium">
                                            ({item.variant_title})
                                          </span>
                                        )}
                                        {item.sku && (
                                          <span className="text-[10px] font-mono text-muted-foreground/60 ml-2">
                                            {item.sku}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-foreground/70 ml-4 shrink-0 font-bold">
                                        {item.quantity} × ₹
                                        {parseFloat(item.price).toLocaleString("en-IN")}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Shipping Address */}
                              {order.shipping_address && (
                                <div>
                                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                                    Shipping Destination
                                  </h4>
                                  <address className="not-italic text-sm text-foreground/80 space-y-1">
                                    <div className="font-bold text-foreground">
                                      {order.shipping_address.first_name}{" "}
                                      {order.shipping_address.last_name}
                                    </div>
                                    {order.shipping_address.company && (
                                      <div className="text-xs">{order.shipping_address.company}</div>
                                    )}
                                    <div>{order.shipping_address.address1}</div>
                                    {order.shipping_address.address2 && (
                                      <div>{order.shipping_address.address2}</div>
                                    )}
                                    <div>
                                      {order.shipping_address.city},{" "}
                                      {order.shipping_address.province}{" "}
                                      {order.shipping_address.zip}
                                    </div>
                                    <div>{order.shipping_address.country}</div>
                                    {order.shipping_address.phone && (
                                      <div className="text-xs text-muted-foreground mt-2 border-t border-foreground/5 pt-2">
                                        <span className="font-bold uppercase tracking-tighter text-[10px] mr-2">Contact:</span>
                                        {order.shipping_address.phone}
                                      </div>
                                    )}
                                  </address>
                                </div>
                              )}
                            </div>
                            {order.note && (
                              <div className="mt-6 p-4 rounded-xl bg-foreground/5 border border-foreground/10 text-sm text-foreground/70">
                                <span className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider block mb-1">Customer Note:</span>
                                {order.note}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-md rounded-2xl p-8 border border-foreground/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-rocaston tracking-widest text-foreground">EDIT ORDER</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateOrder} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Customer Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full glass bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Order Note</label>
                <textarea
                  value={editForm.note}
                  onChange={(e) => setEditForm(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full glass bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all min-h-[120px]"
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full flex items-center justify-center py-3.5 bg-foreground text-background hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "SAVE CHANGES"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="glass-card w-full max-w-xl rounded-2xl p-8 border border-foreground/10 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-rocaston tracking-widest text-foreground">CREATE ORDER</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateOrder} className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">First Name</label>
                   <input required value={createForm.firstName} onChange={(e) => setCreateForm(p => ({...p, firstName: e.target.value}))} className="w-full glass bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Last Name</label>
                   <input required value={createForm.lastName} onChange={(e) => setCreateForm(p => ({...p, lastName: e.target.value}))} className="w-full glass bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20" />
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</label>
                 <input required type="email" value={createForm.email} onChange={(e) => setCreateForm(p => ({...p, email: e.target.value}))} className="w-full glass bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20" />
               </div>

               <div className="pt-6 border-t border-foreground/5">
                 <h3 className="text-xs font-extrabold text-foreground mb-4 uppercase tracking-[0.2em]">Product Item</h3>
                 <div className="grid grid-cols-12 gap-4 relative">
                   {isProductsLoading && (
                     <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 rounded-lg">
                       <Loader2 className="w-4 h-4 animate-spin text-foreground" />
                     </div>
                   )}
                   <div className="col-span-12 sm:col-span-12 space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select Product</label>
                     <div className="relative">
                       <select
                         required
                         value={selectedProductId}
                         onChange={(e) => {
                           setSelectedProductId(e.target.value);
                           setCreateForm((p) => ({ ...p, variantId: "" })); // reset variant
                         }}
                         className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 appearance-none transition-all"
                       >
                         <option value="" disabled className="text-muted-foreground">Choose product...</option>
                         {products.map((p) => (
                           <option key={p.id} value={p.id} className="text-foreground bg-background">
                             {p.title}
                           </option>
                         ))}
                       </select>
                       <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                     </div>
                   </div>
                   
                   <div className="col-span-9 sm:col-span-9 space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select Variant</label>
                     <div className="relative">
                       <select
                         required
                         disabled={!selectedProductId}
                         value={createForm.variantId}
                         onChange={(e) => setCreateForm((p) => ({ ...p, variantId: e.target.value }))}
                         className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 appearance-none disabled:opacity-40 transition-all font-mono"
                       >
                         <option value="" disabled className="text-muted-foreground">Choose variant...</option>
                         {products
                           .find((p) => p.id.toString() === selectedProductId)
                           ?.variants.map((v) => (
                             <option key={v.id} value={v.id} className="text-foreground bg-background">
                               {v.title !== "Default Title" ? v.title : "Standard"} - ₹{v.price} ({v.inventory_quantity} in stock)
                             </option>
                           ))}
                       </select>
                       <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                     </div>
                   </div>

                   <div className="col-span-3 sm:col-span-3 space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center block">Qty</label>
                     <input required type="number" min="1" value={createForm.quantity} onChange={(e) => setCreateForm(p => ({...p, quantity: parseInt(e.target.value) || 1}))} className="w-full glass bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-foreground/20 font-bold" />
                   </div>
                 </div>
               </div>

               <div className="pt-6 border-t border-foreground/5">
                 <h3 className="text-xs font-extrabold text-foreground mb-4 uppercase tracking-[0.2em]">Shipping</h3>
                 <div className="space-y-4">
                   <input required placeholder="Full Street Address" value={createForm.address1} onChange={(e) => setCreateForm(p => ({...p, address1: e.target.value}))} className="w-full glass bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20" />
                   <div className="grid grid-cols-3 gap-4">
                     <input required placeholder="City" value={createForm.city} onChange={(e) => setCreateForm(p => ({...p, city: e.target.value}))} className="w-full glass bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none" />
                     <input required placeholder="ZIP" value={createForm.zip} onChange={(e) => setCreateForm(p => ({...p, zip: e.target.value}))} className="w-full glass bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-xs text-foreground font-mono focus:outline-none" />
                     <input required placeholder="Country" value={createForm.country} onChange={(e) => setCreateForm(p => ({...p, country: e.target.value}))} className="w-full glass bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none" />
                   </div>
                 </div>
               </div>

               <button
                type="submit"
                disabled={actionLoading}
                className="w-full flex items-center justify-center py-4 bg-foreground text-background hover:opacity-95 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 mt-6 shadow-xl"
              >
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "CREATE OFFICIAL ORDER"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
