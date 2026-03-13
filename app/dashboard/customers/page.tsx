"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Mail,
  Phone,
  CalendarDays,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";

interface CustomerOrderItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  sku: string | null;
}

interface CustomerOrder {
  id: string;
  shopifyOrderId: string;
  status: string;
  totalPrice: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
  items: CustomerOrderItem[];
}

interface AdminCustomer {
  id: string;
  shopifyId: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  orders: CustomerOrder[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      setCustomers(data.customers || []);
      if (data.error) setError(data.error);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load customers";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
            Customers
          </h1>
          <p className="text-muted-foreground text-sm">
            Customers synced from Shopify with their orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/admin/customers?format=csv"
            className="flex items-center gap-2 px-3 py-2 island-blur island-blur-hover rounded-xl text-xs font-medium text-foreground transition-all duration-300 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>
          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 island-blur island-blur-hover rounded-xl text-sm font-medium text-foreground transition-all duration-300 disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-card rounded-2xl p-4 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="glass-card rounded-2xl p-12 text-center flex justify-center border border-foreground/5 backdrop-blur-md">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : customers.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-foreground/5 backdrop-blur-sm">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No customers found</h3>
            <p className="text-muted-foreground mt-2">
              Run a Shopify sync to import customers.
            </p>
          </div>
        ) : (
          customers.map((customer) => {
            const fullName =
              customer.name || customer.email || "Anonymous User";
            const isExpanded = expandedId === customer.id;

            return (
              <div
                key={customer.id}
                className="glass-card rounded-2xl p-6 space-y-4 border border-foreground/[0.03] backdrop-blur-sm shadow-sm transition-all duration-300 hover:border-foreground/[0.08]"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-foreground/[0.05] flex items-center justify-center text-foreground font-semibold border border-foreground/[0.1] shadow-inner">
                        {fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground tracking-tight">
                          {fullName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-button-muted-foreground">
                          {customer.email && (
                            <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                              <Mail className="w-3.5 h-3.5 opacity-70" /> {customer.email}
                            </span>
                          )}
                          {customer.phone && (
                            <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                              <Phone className="w-3.5 h-3.5 opacity-70" /> {customer.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 bg-foreground/[0.02] md:bg-transparent rounded-xl p-4 md:p-0">
                    <div className="text-center md:text-right px-2">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 opacity-70">
                        Total Orders
                      </p>
                      <p className="text-xl font-black text-foreground tracking-tighter">
                        {customer.totalOrders}
                      </p>
                    </div>
                    <div className="text-center md:text-right px-2">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 opacity-70">
                        Total Spent
                      </p>
                      <p className="text-xl font-black text-foreground tracking-tighter">
                        ₹{customer.totalSpent.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="text-center md:text-right hidden sm:block px-2">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 opacity-70">
                        Joined
                      </p>
                      <p className="text-sm font-bold text-foreground/80 tracking-tight flex items-center justify-end gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 opacity-60" />
                        {new Date(customer.createdAt).toLocaleDateString(
                          "en-IN"
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : customer.id)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300 text-xs font-bold leading-none ${
                        isExpanded 
                        ? "bg-foreground text-background shadow-lg scale-[0.99]" 
                        : "bg-foreground/[0.04] hover:bg-foreground/[0.08] text-foreground"
                    }`}
                  >
                    <span className="uppercase tracking-widest opacity-90">
                      {customer.totalOrders === 0
                        ? "No orders yet"
                        : `${customer.totalOrders} order${
                            customer.totalOrders > 1 ? "s" : ""
                          }`}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 stroke-[3px]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 stroke-[3px]" />
                    )}
                  </button>
                  
                  {isExpanded && customer.orders.length > 0 && (
                    <div className="mt-3 grid gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      {customer.orders.map((order) => (
                        <div
                          key={order.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-foreground/[0.02] border border-foreground/[0.05] rounded-2xl px-4 py-4 transition-all hover:border-foreground/[0.1] hover:bg-foreground/[0.03]"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <p className="font-black text-foreground text-sm uppercase tracking-tight">
                                Order #{order.shopifyOrderId}
                              </p>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                order.fulfillmentStatus === 'fulfilled' 
                                ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                                : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                              }`}>
                                {order.fulfillmentStatus}
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-80">
                              {new Date(order.createdAt).toLocaleString("en-IN", {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {order.items.map((item, idx) => (
                                <span key={idx} className="bg-foreground/[0.05] px-2 py-1 rounded-lg text-[10px] font-bold text-foreground/80 border border-foreground/[0.05]">
                                  {item.title} <span className="text-muted-foreground mx-1">×</span> {item.quantity}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 border-foreground/[0.05] pt-3 sm:pt-0">
                            <p className="text-lg font-black text-foreground tracking-tighter">
                              ₹{order.totalPrice.toLocaleString("en-IN")}
                            </p>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                              {order.paymentStatus}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

