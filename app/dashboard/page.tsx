"use client";

import { useEffect, useState } from "react";
import {
  PackageSearch,
  ArrowLeftRight,
  Undo2,
  TrendingUp,
  CircleDollarSign,
  ShoppingCart,
  Users,
  Loader2,
  RefreshCw,
} from "lucide-react";

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
        fetch("/api/shopify/orders?limit=100&status=any"),
        fetch("/api/shopify/products?limit=250"),
        fetch("/api/shopify/customers?limit=250"),
      ]);

      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();
      const customersData = await customersRes.json();

      const orders = ordersData.orders || [];
      const products = productsData.products || [];
      const customers = customersData.customers || [];
      
      console.log(`[Dashboard] Fetched ${orders.length} orders from API`);

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
      // Refresh stats after sync
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
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading dashboard...
      </div>
    );
  }

  const statCards = [
    {
      name: "Total Revenue",
      value: `₹${(stats?.totalRevenue || 0).toLocaleString("en-IN")}`,
      icon: CircleDollarSign,
      color: "text-emerald-500",
    },
    {
      name: "Orders",
      value: String(stats?.totalOrders || 0),
      icon: ShoppingCart,
      color: "text-blue-500",
    },
    {
      name: "Customers",
      value: String(stats?.totalCustomers || 0),
      icon: Users,
      color: "text-purple-500",
    },
    {
      name: "Low Stock",
      value: String(stats?.lowStockItems || 0),
      icon: PackageSearch,
      color: "text-red-500",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1 transition-colors">
            Welcome back, Admin
          </h1>
          <p className="text-muted-foreground">Live overview of your Shopify store.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 glass glass-hover rounded-xl text-sm font-medium text-foreground disabled:opacity-50 transition-all border border-foreground/5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-foreground/5"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Full Sync"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="glass-card rounded-2xl p-6 glass-hover transition-all border border-foreground/5 shadow-xl shadow-foreground/[0.02]"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.name}</p>
                  <p className="text-2xl font-semibold text-foreground tracking-tight transition-colors">{stat.value}</p>
                </div>
                <div className={`p-3 bg-foreground/5 rounded-xl ${stat.color} border border-foreground/5`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="glass-card rounded-2xl p-6 border border-foreground/5 shadow-xl shadow-foreground/[0.02]">
          <h3 className="text-base font-semibold text-foreground mb-5 transition-colors">Recent Orders</h3>
          <div className="space-y-3">
            {(stats?.recentOrders || []).length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No recent orders</p>
            ) : (
              stats?.recentOrders.map((order) => {
                const customerName = order.customer
                    ? `${order.customer.first_name || ""} ${order.customer.last_name || ""}`.trim()
                    : "Anonymous";

                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-foreground/3 border border-foreground/5 hover:bg-foreground/5 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground group-hover:text-blue-500 transition-colors">{order.name}</p>
                        <p className="text-xs text-muted-foreground">{customerName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground transition-colors">
                        ₹{parseFloat(order.total_price).toLocaleString("en-IN")}
                      </p>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          order.financial_status === "paid"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-yellow-500/10 text-yellow-500"
                        }`}
                      >
                        {order.financial_status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-card rounded-2xl p-6 border border-foreground/5 shadow-xl shadow-foreground/[0.02]">
          <h3 className="text-base font-semibold text-foreground mb-5 transition-colors">Low Stock Alerts</h3>
          <div className="space-y-3">
            {(stats?.lowStockProducts || []).length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">All stock levels healthy</p>
            ) : (
              stats?.lowStockProducts.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-xl bg-foreground/3 border border-foreground/5 hover:bg-foreground/5 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-foreground/10 border border-foreground/10 flex items-center justify-center overflow-hidden">
                      <PackageSearch className="w-5 h-5 text-muted-foreground group-hover:text-red-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground transition-colors">
                        {item.title}
                        {item.variant ? ` - ${item.variant}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">SKU: {item.sku || "N/A"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold px-3 py-1 rounded-lg ${
                        item.stock <= 0 
                          ? "bg-red-500/20 text-red-600" 
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {item.stock} left
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
