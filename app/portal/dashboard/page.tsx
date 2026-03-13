"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, ArrowLeftRight, Clock, ChevronRight, LogOut, Loader2 } from "lucide-react";

export default function PortalDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("customerToken");
    const customerId = localStorage.getItem("customerId");
    
    // In a real app we'd verify the token or shopDomain
    const shopDomain =
      process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "8tiahf-bk.myshopify.com";

    if (!token || !customerId) {
      router.push("/portal/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/portal/orders?customerId=${customerId}&shopDomain=${shopDomain}`);
        const data = await res.json();
        if (res.ok) {
          setOrders(data.orders);
        } else {
          console.error("Failed to fetch orders:", data.error);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerId");
    router.push("/portal/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/50 pb-12">
      {/* Navbar segment */}
      <nav className="nav-glass sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link href="/" className="flex items-center gap-3 active:scale-95 transition-transform">
              <div className="relative w-10 h-10 overflow-hidden bg-foreground/5 p-1 border border-foreground/10 rounded-full">
                <img
                  src="https://cdn.shopify.com/s/files/1/0955/5394/5881/files/zica-bella-logo_834c1ed2-2f09-4f73-bb9f-152a03f59ad2.png?v=1773354221"
                  alt="Logo"
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <h1 className="font-rocaston text-lg tracking-[0.2em] text-foreground">ZICA BELLA</h1>
            </Link>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl text-[10px] font-bold tracking-[0.1em] text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-all flex items-center border border-foreground/5"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                SIGN OUT
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase">Your Orders</h2>
          <p className="text-muted-foreground text-sm font-medium opacity-80 uppercase tracking-widest">Manage your recent purchases, returns, and exchanges.</p>
        </div>

        {orders.length === 0 ? (
          <div className="glass-card rounded-3xl border border-foreground/5 p-16 text-center shadow-2xl shadow-foreground/[0.02] backdrop-blur-xl">
            <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-foreground uppercase tracking-tight">No orders found</h3>
            <p className="text-muted-foreground mt-2 font-medium">You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {orders.map((order) => (
              <div key={order.id} className="glass-card rounded-3xl border border-foreground/[0.06] shadow-2xl shadow-foreground/[0.04] overflow-hidden hover:border-foreground/[0.12] transition-all duration-500 group">
                <div className="bg-foreground/[0.02] border-b border-foreground/[0.06] px-8 py-6 flex flex-wrap gap-8 items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Order number</p>
                    <p className="text-lg font-black text-foreground tracking-tighter">#{order.shopifyOrderId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Date placed</p>
                    <p className="text-sm font-bold text-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Total amount</p>
                    <p className="text-xl font-black text-foreground tracking-tighter">₹{order.totalPrice.toLocaleString("en-IN")}</p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      order.deliveryStatus === 'delivered' 
                      ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                      : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                    }`}>
                      {order.deliveryStatus === 'delivered' ? 'Delivered' : order.fulfillmentStatus || order.status}
                    </span>
                  </div>
                </div>

                <div className="px-8 py-6">
                  <ul className="divide-y divide-foreground/[0.04]">
                    {order.items.map((item: any) => (
                      <li key={item.id} className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center space-x-6">
                          <div className="h-20 w-20 bg-foreground/[0.03] rounded-2xl flex items-center justify-center border border-foreground/[0.06] shadow-inner group-hover:scale-105 transition-transform duration-500">
                             <Package className="text-muted-foreground/40 w-8 h-8" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-base font-black text-foreground uppercase tracking-tight leading-tight">{item.title}</p>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-70">
                              Qty: {item.quantity} <span className="mx-2 opacity-30">•</span> ₹{item.price.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        {order.deliveryStatus === 'delivered' ? (
                          <div className="flex gap-3">
                            <button
                              onClick={() => router.push(`/portal/requests/new?type=return&orderId=${order.id}&itemId=${item.id}`)}
                              className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-foreground/[0.04] hover:bg-foreground/[0.08] hover:text-foreground px-5 py-2.5 rounded-xl transition-all active:scale-95"
                            >
                              Return
                            </button>
                            <button
                              onClick={() => router.push(`/portal/requests/new?type=exchange&orderId=${order.id}&itemId=${item.id}`)}
                              className="text-[10px] font-black uppercase tracking-widest text-background bg-foreground hover:opacity-90 px-5 py-2.5 rounded-xl transition-all shadow-lg active:scale-95 flex items-center"
                            >
                              <ArrowLeftRight className="w-3 h-3 mr-2 stroke-[3px]" />
                              Exchange
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40 italic">
                            Available after delivery
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>

                  {(order.returns?.length > 0 || order.exchanges?.length > 0) && (
                    <div className="mt-6 pt-6 border-t border-foreground/[0.06]">
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center opacity-60">
                        <Clock className="w-3.5 h-3.5 mr-2" />
                        Active Requests
                      </h4>
                      <div className="grid gap-3">
                        {order.returns?.map((ret: any) => (
                          <div key={ret.id} className="flex justify-between items-center bg-orange-500/[0.03] border border-orange-500/10 px-5 py-3 rounded-2xl group/action">
                            <p className="text-xs font-bold text-orange-600 uppercase tracking-tight">Return Request <span className="mx-2 opacity-30">•</span> {ret.status}</p>
                            <button className="text-orange-600/60 text-[10px] font-black uppercase tracking-widest hover:text-orange-600 flex items-center transition-colors">
                              View Details <ChevronRight className="w-3 h-3 ml-1 stroke-[3px]" />
                            </button>
                          </div>
                        ))}
                        {order.exchanges?.map((exc: any) => (
                          <div key={exc.id} className="flex justify-between items-center bg-blue-500/[0.03] border border-blue-500/10 px-5 py-3 rounded-2xl group/action">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-tight">Exchange Request <span className="mx-2 opacity-30">•</span> {exc.status}</p>
                            <button className="text-blue-600/60 text-[10px] font-black uppercase tracking-widest hover:text-blue-600 flex items-center transition-colors">
                              View Details <ChevronRight className="w-3 h-3 ml-1 stroke-[3px]" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
