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
        <Loader2 className="w-4 h-4 text-foreground/40 animate-spin" />
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-foreground/40">Loading Data...</span>
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
      className="pb-20 space-y-12"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            Dashboard
          </h1>
          <p className="text-[11px] text-foreground/50 tracking-wide max-w-xl">
            Overview of store performance and active operations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-background border border-foreground/[0.05] rounded-md text-[10px] font-medium uppercase tracking-[0.15em] text-foreground/70 hover:bg-foreground/[0.02] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} strokeWidth={1.5} />
            Refresh
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-md text-[10px] font-medium uppercase tracking-[0.15em] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} strokeWidth={1.5} />
            {syncing ? "Syncing..." : "Sync"}
          </button>
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              key={stat.name}
              className="bg-background border border-foreground/[0.05] rounded-xl p-5 relative overflow-hidden group shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] font-medium text-foreground/50 uppercase tracking-[0.15em]">{stat.name}</p>
                <div className="p-1.5 rounded-md bg-foreground/[0.03] text-foreground/60 group-hover:bg-foreground group-hover:text-background transition-colors">
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground tracking-tight">{stat.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

       <div className="grid lg:grid-cols-2 gap-6 relative z-10">
        {/* Recent Orders */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-background border border-foreground/[0.05] rounded-xl overflow-hidden shadow-sm flex flex-col"
        >
          <div className="px-5 py-4 border-b border-foreground/[0.05] flex items-center justify-between bg-foreground/[0.01]">
             <h3 className="text-[11px] font-semibold text-foreground uppercase tracking-[0.15em]">Recent Orders</h3>
             <button className="text-[9px] text-foreground/50 hover:text-foreground uppercase tracking-widest flex items-center gap-1 transition-colors">
               View All <ArrowUpRight className="w-3 h-3" />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {(stats?.recentOrders || []).length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                 <p className="text-[11px] font-medium text-foreground/40">No recent orders</p>
              </div>
            ) : (
              <table className="w-full text-left whitespace-nowrap">
                 <tbody className="divide-y divide-foreground/[0.05]">
                  {stats?.recentOrders.map((order) => {
                    const customerName = order.customer
                        ? `${order.customer.first_name || ""} ${order.customer.last_name || ""}`.trim()
                        : "Guest";

                    return (
                      <tr key={order.id} className="hover:bg-foreground/[0.01] transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-[12px] font-medium text-foreground leading-none">{order.name}</p>
                        </td>
                        <td className="px-5 py-3">
                           <p className="text-[11px] text-foreground/60">{customerName}</p>
                        </td>
                         <td className="px-5 py-3 text-right">
                          <span
                            className={`text-[9px] font-medium px-2 py-0.5 rounded-sm uppercase tracking-widest ${
                              order.financial_status === "paid"
                                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                            }`}
                          >
                            {order.financial_status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <p className="text-[12px] font-medium text-foreground">
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
        </motion.div>

         {/* Low Stock Alerts */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-background border border-foreground/[0.05] rounded-xl overflow-hidden shadow-sm flex flex-col"
        >
          <div className="px-5 py-4 border-b border-foreground/[0.05] flex items-center justify-between bg-foreground/[0.01]">
             <h3 className="text-[11px] font-semibold text-foreground uppercase tracking-[0.15em]">Low Stock Alerts</h3>
             <button className="text-[9px] text-foreground/50 hover:text-foreground uppercase tracking-widest flex items-center gap-1 transition-colors">
               Manage <ArrowUpRight className="w-3 h-3" />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {(stats?.lowStockProducts || []).length === 0 ? (
               <div className="py-12 flex flex-col items-center justify-center text-center">
                 <p className="text-[11px] font-medium text-foreground/40">Inventory optimal</p>
              </div>
            ) : (
              <table className="w-full text-left whitespace-nowrap">
                 <tbody className="divide-y divide-foreground/[0.05]">
                  {stats?.lowStockProducts.map((item, i) => (
                    <tr key={i} className="hover:bg-foreground/[0.01] transition-colors">
                      <td className="px-5 py-3 max-w-[200px] truncate">
                         <p className="text-[12px] font-medium text-foreground truncate">{item.title}</p>
                      </td>
                      <td className="px-5 py-3 max-w-[150px] truncate">
                         <p className="text-[10px] text-foreground/50 font-mono truncate">{item.sku || "N/A"}</p>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`text-[10px] font-medium ${
                            item.stock <= 0 
                              ? "text-red-500" 
                              : "text-orange-500"
                          }`}
                        >
                          {item.stock} left
                        </span>
                      </td>
                    </tr>
                  ))}
                 </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
