"use client";

import { useEffect, useState } from "react";
import {
  PackageSearch,
  ShoppingCart,
  Users,
  Loader2,
  RefreshCw,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockItems: number;
  recentOrders: {
    id: number;
    name: string;
    total_price: string;
    financial_status: string;
    fulfillment_status: string | null;
    customer: { first_name: string; last_name: string } | null;
    created_at: string;
  }[];
  lowStockProducts: {
    title: string;
    sku: string | null;
    stock: number;
    variant: string;
  }[];
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes, customersRes] = await Promise.all([
        fetch("/api/shopify/orders?limit=50"),
        fetch("/api/shopify/products?limit=250"),
        fetch("/api/shopify/customers?limit=50"),
      ]);

      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();
      const customersData = await customersRes.json();

      const orders = ordersData.orders || [];
      const products = productsData.products || [];
      const customers = customersData.customers || [];

      // Calculate revenue from orders
      const totalRevenue = orders.reduce(
        (sum: number, o: any) => sum + parseFloat(o.total_price || "0"),
        0
      );

      // Find low stock variants
      const lowStockProducts: DashboardStats["lowStockProducts"] = [];
      for (const p of products) {
        for (const v of p.variants || []) {
          if (v.inventory_quantity !== null && v.inventory_quantity < 10) {
            lowStockProducts.push({
              title: p.title,
              sku: v.sku,
              stock: v.inventory_quantity,
              variant: v.title !== "Default Title" ? v.title : "",
            });
          }
        }
      }
      lowStockProducts.sort((a, b) => a.stock - b.stock);

      setStats({
        totalRevenue,
        totalOrders: orders.length,
        totalCustomers: customers.length,
        totalProducts: products.length,
        lowStockItems: lowStockProducts.length,
        recentOrders: orders.slice(0, 5),
        lowStockProducts: lowStockProducts.slice(0, 6),
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/shopify/sync", { method: "POST" });
      const data = await res.json();
      console.log("Sync result:", data);
      await fetchStats();
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

   if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-4 h-4 text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/40 animate-spin" />
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/40">Loading Data...</span>
      </div>
    );
  }

  const statCards = [
    {
      name: "Revenue",
      value: `₹${(stats?.totalRevenue || 0).toLocaleString("en-IN")}`,
      icon: Activity,
    },
    {
      name: "Orders",
      value: String(stats?.totalOrders || 0),
      icon: ShoppingCart,
    },
    {
      name: "Customers",
      value: String(stats?.totalCustomers || 0),
      icon: Users,
    },
    {
      name: "Low Stock",
      value: String(stats?.lowStockItems || 0),
      icon: PackageSearch,
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="pb-20 space-y-6 lg:space-y-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-6 mb-8 lg:mb-12 relative z-10">
        <div className="space-y-1 lg:space-y-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground uppercase tracking-tighter leading-none">
            Dashboard
          </h1>
          <p className="text-[9px] lg:text-[10px] text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/40 font-bold uppercase tracking-[0.3em] max-w-xl">
            Overview of store performance and active operations.
          </p>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 lg:px-5 py-2 lg:py-2.5 bg-background dark:bg-white/[0.03] border border-foreground/[0.08] rounded-xl text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/80 dark:text-foreground/80 dark:text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 hover:bg-foreground/[0.02] hover:text-foreground transition-all disabled:opacity-50 active:scale-95 shadow-sm"
          >
            <RefreshCw className={`w-3 h-3 lg:w-3.5 lg:h-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={2} />
            Refresh
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 lg:px-5 py-2 lg:py-2.5 bg-foreground text-background rounded-xl text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-foreground/10"
          >
            <RefreshCw className={`w-3 h-3 lg:w-3.5 lg:h-3.5 ${syncing ? "animate-spin" : ""}`} strokeWidth={2} />
            {syncing ? "Syncing..." : "Sync Node"}
          </button>
        </div>
      </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 relative z-10">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              key={stat.name}
              className="glass-card p-6 lg:p-10 relative overflow-hidden group rounded-[2rem] lg:rounded-[3rem]"
            >
              <div className="flex justify-between items-start mb-4 lg:mb-6">
                <p className="text-[10px] lg:text-[11px] font-bold text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20 uppercase tracking-[0.4em]">{stat.name}</p>
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl lg:rounded-[1.2rem] bg-foreground/5 text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/40 flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-all duration-700 border border-foreground/5 shadow-inner">
                  <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4" strokeWidth={1.5} />
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-2xl lg:text-4xl font-bold text-foreground tracking-tighter mb-1">{stat.value}</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] lg:text-[9px] font-bold text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20 uppercase tracking-widest">Real-time sync</span>
                </div>
              </div>
              
              {/* Vibrant Orb Effect */}
              <div className="absolute -right-8 -bottom-8 w-24 lg:w-32 h-24 lg:h-32 bg-foreground/5 blur-3xl rounded-full group-hover:bg-foreground/10 transition-all duration-1000" />
            </motion.div>
          );
        })}
      </div>

       <div className="grid lg:grid-cols-2 gap-4 lg:gap-6 relative z-10">
        {/* Recent Orders */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card rounded-[2rem] lg:rounded-[3rem] overflow-hidden flex flex-col"
        >
          <div className="px-6 lg:px-8 py-4 lg:py-6 border-b border-foreground/5 flex items-center justify-between bg-foreground/[0.01]">
             <h3 className="text-[10px] lg:text-[12px] font-bold text-foreground/80 uppercase tracking-[0.3em]">Recent Substrate</h3>
             <button className="px-3 lg:px-4 py-1.5 lg:py-2 glass rounded-full text-[8px] lg:text-[9px] font-bold text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/40 hover:text-foreground hover:bg-foreground/5 uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 border border-foreground/5">
                Expand <ArrowUpRight className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
             </button>
          </div>

          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <div className="min-w-[600px] lg:min-w-0">
              {(stats?.recentOrders || []).length === 0 ? (
                <div className="py-16 lg:py-20 flex flex-col items-center justify-center text-center">
                   <p className="text-[10px] lg:text-[12px] font-bold text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20 uppercase tracking-[0.3em]">No recent transmissions</p>
                </div>
              ) : (
                <table className="w-full text-left whitespace-nowrap">
                   <tbody className="divide-y divide-foreground/[0.03]">
                    {stats?.recentOrders.map((order) => {
                      const customerName = order.customer
                          ? `${order.customer.first_name || ""} ${order.customer.last_name || ""}`.trim()
                          : "Anonymous Node";
  
                      return (
                        <tr key={order.id} className="hover:bg-foreground/[0.01] transition-all group duration-500">
                          <td className="px-6 lg:px-8 py-3 lg:py-4">
                            <p className="text-[12px] lg:text-[13px] font-bold text-foreground tracking-tight leading-none uppercase">{order.name}</p>
                            <p className="text-[8px] text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20 font-bold uppercase tracking-[0.2em] mt-1.5">Node ID: {order.id}</p>
                          </td>
                          <td className="px-6 lg:px-8 py-3 lg:py-4">
                             <p className="text-[9px] lg:text-[10px] font-bold text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/40 uppercase tracking-[0.2em]">{customerName}</p>
                          </td>
                           <td className="px-6 lg:px-8 py-3 lg:py-4 text-right">
                            <span
                              className={`text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-3xl shadow-2xl border ${
                                order.financial_status === "paid"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              }`}
                            >
                              {order.financial_status}
                            </span>
                          </td>
                          <td className="px-6 lg:px-8 py-3 lg:py-4 text-right">
                            <p className="text-[14px] lg:text-[15px] font-bold text-foreground tracking-tighter">
                              ₹{parseFloat(order.total_price).toLocaleString("en-IN")}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                   </tbody>
                </table>
              )}
            </div>
          </div>
        </motion.div>

         {/* Critical Inventory */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card rounded-[2rem] lg:rounded-[3rem] overflow-hidden flex flex-col"
        >
          <div className="px-6 lg:px-10 py-5 lg:py-8 border-b border-foreground/5 flex items-center justify-between bg-foreground/[0.01]">
             <h3 className="text-[11px] lg:text-[13px] font-bold text-foreground/90 uppercase tracking-[0.3em]">Critical Inventory</h3>
             <button className="px-4 lg:px-5 py-1.5 lg:py-2 glass rounded-full text-[8px] lg:text-[10px] font-bold text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/40 hover:text-foreground hover:bg-foreground/5 uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 border border-foreground/5">
                Manage <ArrowUpRight className="w-3 h-3 lg:w-4 lg:h-4" />
             </button>
          </div>

          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <div className="min-w-[500px] lg:min-w-0">
              {(stats?.lowStockProducts || []).length === 0 ? (
                 <div className="py-16 lg:py-20 flex flex-col items-center justify-center text-center">
                   <p className="text-[10px] lg:text-[12px] font-bold text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20 uppercase tracking-[0.3em]">Inventory optimal</p>
                </div>
              ) : (
                <table className="w-full text-left whitespace-nowrap">
                   <tbody className="divide-y divide-foreground/[0.03]">
                    {stats?.lowStockProducts.map((item, i) => (
                      <tr key={i} className="hover:bg-foreground/[0.01] transition-all group duration-500">
                        <td className="px-6 lg:px-10 py-4 lg:py-6 max-w-[200px] lg:max-w-[250px] truncate">
                           <p className="text-[13px] lg:text-[15px] font-bold text-foreground truncate leading-none uppercase">{item.title}</p>
                           <p className="text-[9px] text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20 font-bold uppercase tracking-[0.2em] mt-1.5 italic transition-colors group-hover:text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/40">{item.variant || "Standard Architecture"}</p>
                        </td>
                        <td className="px-6 lg:px-10 py-4 lg:py-6 max-w-[120px] lg:max-w-[150px] truncate">
                           <div className="flex items-center gap-2 px-2.5 lg:px-3 py-1 lg:py-1.5 bg-foreground/5 border border-foreground/10 rounded-lg w-fit">
                              <PackageSearch className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-foreground/50 dark:text-foreground/50 dark:text-foreground/50 dark:text-foreground/50 dark:text-foreground/30" />
                              <p className="text-[9px] text-foreground/70 dark:text-foreground/70 dark:text-foreground/70 dark:text-foreground/70 dark:text-foreground/50 font-bold uppercase tracking-[0.2em] truncate">{item.sku || "UNASSIGNED"}</p>
                           </div>
                        </td>
                        <td className="px-6 lg:px-10 py-4 lg:py-6 text-right">
                          <span
                            className={`text-[9px] lg:text-[11px] font-bold uppercase tracking-[0.3em] ${
                              item.stock <= 0 
                                ? "text-rose-500" 
                                : "text-amber-500 dark:text-amber-400"
                            }`}
                          >
                            {item.stock} <span className="hidden sm:inline">UNITS REMAINING</span><span className="sm:hidden">LEFT</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                   </tbody>
                </table>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
