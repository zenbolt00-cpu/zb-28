"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  Truck, 
  ChevronRight, 
  Search, 
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StorefrontHeader from "@/components/StorefrontHeader";
import StorefrontNav from "@/components/StorefrontNav";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error("Error fetching orders", e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "shipped": return <Truck className="w-4 h-4 text-blue-500" />;
      case "cancelled": return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-orange-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Ambient Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-[20%] right-[-5%] w-[60vw] h-[60vw] rounded-full glow-orb-2 opacity-8 dark:opacity-15" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full glow-orb-1 opacity-5 dark:opacity-10" />
      </div>

      <StorefrontHeader />

      <main className="relative z-10 max-w-md mx-auto px-4 pt-header pb-40">
        {/* Page Title - Cart Style */}
        <div className="mb-8">
          <p className="text-[7px] font-extralight uppercase tracking-[0.55em] text-muted-foreground/35 mb-0.5 ml-0.5">Your</p>
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-[13px] uppercase tracking-widest text-foreground/80 flex items-center gap-2">
              Orders
              {orders.length > 0 && (
                <span className="text-[8px] px-2 py-0.5 rounded-full bg-foreground/10 text-foreground/50 font-inter font-medium">
                  {orders.length}
                </span>
              )}
            </h1>
            <Link href="/profile" className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/30 hover:text-foreground/60 transition-colors">
              Back to Profile
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/20" />
            <p className="text-[7px] text-muted-foreground/30 font-black uppercase tracking-[0.3em]">Syncing History</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-6 text-center">
            <div className="w-16 h-16 bg-muted/40 rounded-[2rem] flex items-center justify-center border border-border/5">
               <Package className="w-6 h-6 text-muted-foreground/10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-[11px] font-heading uppercase tracking-widest text-foreground/40">No Orders Yet</h2>
              <p className="text-[9px] text-muted-foreground/30 font-medium">Your purchase history will appear here.</p>
            </div>
            <Link href="/" className="px-8 py-3 bg-foreground text-background rounded-full text-[9px] font-black uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-foreground/5">
                Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {orders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative rounded-2xl p-4 transition-all duration-500 overflow-hidden"
                style={{
                  background: "hsla(var(--glass-bg), 0.55)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid hsla(var(--glass-border), 0.08)",
                }}
              >
                {/* Header Info */}
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/50 flex items-center gap-1.5">
                      <Clock className="w-2.5 h-2.5 opacity-30" />
                      #{order.shopifyOrderId || order.id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-[9px] text-muted-foreground/40 font-bold">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full bg-foreground/5 border border-border/5 text-[7px] font-black uppercase tracking-widest`}>
                    {getStatusIcon(order.deliveryStatus)}
                    <span className="opacity-70">{order.deliveryStatus}</span>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3.5">
                    {order.items.slice(0, 3).map((item: any, i: number) => (
                      <div key={i} className="h-10 w-10 rounded-xl ring-2 ring-background/50 bg-background/40 flex items-center justify-center overflow-hidden border border-border/10 shadow-sm relative group-hover:scale-105 transition-transform">
                        {item.image ? (
                          <img src={item.image} alt="" className="object-cover w-full h-full opacity-80" />
                        ) : (
                          <span className="text-[10px] font-black opacity-10">{item.title[0]}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold truncate tracking-tight text-foreground/80 leading-snug">
                        {order.items[0].title}
                    </p>
                    <p className="text-[8px] text-muted-foreground/40 font-medium mt-0.5 uppercase tracking-widest">
                      {order.items.length > 1 ? `+ ${order.items.length - 1} more items` : `1 quantity`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-inter font-bold tracking-tight text-foreground/80">₹{order.totalPrice.toLocaleString('en-IN')}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40">Details</span>
                      <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/40" />
                    </div>
                  </div>
                </div>

                {/* Tracking / Quick Actions */}
                {order.deliveryStatus.toLowerCase() !== "pending" && order.shipments?.[0]?.trackingNumber ? (
                  <div className="mt-4 pt-4 border-t border-border/5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-lg bg-foreground/5 flex items-center justify-center">
                        <Truck className="w-3 h-3 text-muted-foreground/40" />
                      </div>
                      <div className="text-[8px]">
                        <p className="uppercase tracking-widest text-muted-foreground/30 font-black">ID</p>
                        <p className="font-mono text-foreground/50 font-medium uppercase truncate max-w-[80px]">{order.shipments[0].trackingNumber}</p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-[7px] font-black uppercase tracking-widest text-foreground/60 transition-colors">
                        Track Ship
                    </button>
                  </div>
                ) : (
                    <div className="mt-4 opacity-10 flex justify-end">
                         <Link href={`/orders/${order.id}/confirmation`} className="text-[7px] font-black uppercase tracking-widest">View Order Confirmation</Link>
                    </div>
                )}
                
                <Link href={`/orders/${order.id}/confirmation`} className="absolute inset-0 z-[1]" />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <StorefrontNav />
    </div>
  );
}
