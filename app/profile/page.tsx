"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  LogOut,
  Package,
  ChevronRight,
  Shield,
  Bookmark,
  Sparkles,
  Camera,
  Loader2,
  Check,
  Star,
  ShoppingBag,
  TrendingUp,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useBookmarks } from "@/lib/bookmark-context";

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const { bookmarks } = useBookmarks();

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"orders" | "wishlist" | "info">("orders");
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile");
    } else if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const customerId = (session as any)?.customer?.id || (session?.user as any)?.id;
      if (!customerId) return;

      const [profRes, socialRes] = await Promise.all([
        fetch("/api/customer/profile"),
        fetch(`/api/customer/social-stats?customerId=${customerId}`)
      ]);
      const profData = await profRes.json();
      const socialData = await socialRes.json();
      
      if (profRes.ok) {
        setCustomer({
          ...profData.customer,
          followersCount: socialData.followersCount,
          followingCount: socialData.followingCount
        });
      }
    } catch (e) {
      console.error("Error fetching profile", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRegion = async (region: string) => {
    setUpdating(true);
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region }),
      });
      if (res.ok) setCustomer({ ...customer, region });
    } finally {
      setUpdating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch("/api/customer/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });
        if (res.ok) {
          setCustomer({ ...customer, image: base64 });
          await updateSession({ ...session, user: { ...session?.user, image: base64 } });
        }
      } finally {
        setUploading(false);
      }
    };
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="w-8 h-8 border-[1.5px] border-foreground/10 border-t-foreground/40 rounded-full"
        />
        <p className="text-[7px] font-semibold uppercase tracking-[0.5em] text-foreground/40 dark:text-foreground/20">Loading</p>
      </div>
    );
  }

  if (!session) return null;

  const totalOrders = customer?.orders?.length ?? 0;
  const totalSpent = customer?.orders?.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0) ?? 0;
  const storeCredits = customer?.storeCredits ?? 0;
  const name = customer?.name || session.user?.name || "Member";
  const email = session.user?.email || (session as any).customer?.phone || "";

  return (
    <div className="min-h-screen bg-background text-foreground relative font-sans">
      <main className="max-w-[430px] mx-auto px-4 pt-20 pb-36">

        {/* ─── Profile Hero Card ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[2rem] overflow-hidden mb-5 p-6"
          style={{
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 80px -16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.05) 0%, transparent 70%)" }} />

          <div className="flex items-center gap-5 relative z-10">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-[1.5rem] border border-white/10 overflow-hidden relative group/img bg-foreground/[0.04]">
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 backdrop-blur-sm">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
                {customer?.image || session.user?.image ? (
                  <img src={customer?.image || session.user?.image || ""} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-foreground/30 dark:text-foreground/10" />
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all"
                >
                  <Camera className="w-4 h-4 text-white/70" />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-xl bg-foreground flex items-center justify-center border-2 border-background shadow">
                <Sparkles className="w-2.5 h-2.5 text-background" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-[17px] font-bold tracking-tight text-foreground truncate leading-tight">{name}</h1>
              {email && (
                <p className="text-[10px] text-foreground/70 dark:text-foreground/50 truncate tracking-wide mt-0.5">{email}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-foreground">{customer?.followersCount || 0}</span>
                  <span className="text-[10px] text-foreground/35 font-medium">Followers</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-foreground/10" />
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-foreground">{customer?.followingCount || 0}</span>
                  <span className="text-[10px] text-foreground/35 font-medium">Following</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-full text-[7px] font-bold uppercase tracking-widest border border-foreground/10 text-foreground/60 dark:text-foreground/40">
                  Silver Member
                </span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 mt-5 relative z-10">
            {[
              { label: "Orders", value: totalOrders, icon: ShoppingBag },
              { label: "Total Spent", value: `₹${totalSpent.toLocaleString("en-IN")}`, icon: TrendingUp },
              { label: "Credits", value: storeCredits > 0 ? `₹${storeCredits}` : "—", icon: Star },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center py-3 rounded-[1rem]"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Icon className="w-3.5 h-3.5 text-foreground/25 mb-1.5" />
                <p className="text-[11px] font-bold text-foreground/70 leading-none">{value}</p>
                <p className="text-[7px] font-medium text-foreground/25 uppercase tracking-wide mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── Tab Switcher ─── */}
        <div
          className="flex rounded-[1rem] p-1 mb-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {(["orders", "wishlist", "info"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-[0.75rem] text-[8px] font-bold uppercase tracking-[0.15em] transition-all ${
                tab === t ? "bg-foreground text-background shadow" : "text-foreground/50 dark:text-foreground/30 hover:text-foreground/70 dark:text-foreground/50"
              }`}
            >
              {t === "orders" ? "Orders" : t === "wishlist" ? "Wishlist" : "Account"}
            </button>
          ))}
        </div>

        {/* ─── Tab Content ─── */}
        <AnimatePresence mode="wait">
          {tab === "orders" && (
            <motion.div key="orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[8px] font-semibold uppercase tracking-[0.3em] text-foreground/50 dark:text-foreground/30">Order History</span>
                <Link href="/orders" className="flex items-center gap-1 text-[8px] font-bold text-foreground/60 dark:text-foreground/40 hover:text-foreground/70 transition-colors">
                  All <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>

              {customer?.orders && customer.orders.length > 0 ? (
                <div className="space-y-2">
                  {customer.orders.slice(0, 5).map((order: any, idx: number) => (
                    <Link key={order.id} href={`/orders/${order.id}/confirmation`}>
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.07 }}
                        className="flex items-center gap-4 p-4 rounded-[1.25rem] hover:bg-foreground/[0.02] transition-colors group"
                        style={{ border: "1px solid rgba(255,255,255,0.05)" }}
                      >
                        <div className="w-11 h-11 rounded-[0.75rem] bg-foreground/[0.04] border border-foreground/5 flex items-center justify-center shrink-0 overflow-hidden">
                          {order.items?.[0]?.image ? (
                            <img src={order.items[0].image} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <Package className="w-4 h-4 text-foreground/15" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-foreground/70 truncate">
                            #{order.shopifyOrderId?.slice(-6) || order.id.slice(-6)}
                          </p>
                          <p className="flex items-center gap-1 text-[8px] text-foreground/50 dark:text-foreground/30 mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[11px] font-bold text-foreground/80 dark:text-foreground/60">₹{order.totalPrice.toLocaleString("en-IN")}</p>
                          <ChevronRight className="w-3 h-3 ml-auto mt-0.5 text-foreground/15 group-hover:text-foreground/50 dark:text-foreground/30 transition-colors" />
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center rounded-[1.5rem]" style={{ border: "1px dashed rgba(255,255,255,0.06)" }}>
                  <Package className="w-8 h-8 text-foreground/30 dark:text-foreground/10 mx-auto mb-3" />
                  <p className="text-[8px] font-semibold uppercase tracking-widest text-foreground/15">No orders yet</p>
                </div>
              )}
            </motion.div>
          )}

          {tab === "wishlist" && (
            <motion.div key="wishlist" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[8px] font-semibold uppercase tracking-[0.3em] text-foreground/50 dark:text-foreground/30">Saved Items</span>
                <Link href="/wishlist" className="flex items-center gap-1 text-[8px] font-bold text-foreground/60 dark:text-foreground/40 hover:text-foreground/70 transition-colors">
                  All <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>

              {bookmarks.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {bookmarks.slice(0, 6).map((item) => (
                    <Link key={item.id} href={`/products/${item.handle}`}>
                      <div className="aspect-[4/5] rounded-[1.25rem] overflow-hidden relative group" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                        <img
                          src={item.image?.src || "/zb-logo-220px.png"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          alt={item.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-[8px] font-bold uppercase tracking-tight text-white/80 truncate">{item.title}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center rounded-[1.5rem]" style={{ border: "1px dashed rgba(255,255,255,0.06)" }}>
                  <Bookmark className="w-8 h-8 text-foreground/30 dark:text-foreground/10 mx-auto mb-3" />
                  <p className="text-[8px] font-semibold uppercase tracking-widest text-foreground/15">Nothing saved yet</p>
                </div>
              )}
            </motion.div>
          )}

          {tab === "info" && (
            <motion.div key="info" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="space-y-3">

              {/* Region Picker */}
              <div className="rounded-[1.5rem] overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="px-4 py-3 border-b border-white/[0.04]">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.3em] text-foreground/50 dark:text-foreground/30">Region</p>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  {[
                    { id: "IN", name: "India", flag: "🇮🇳" },
                    { id: "GL", name: "Global", flag: "🌐" },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleUpdateRegion(r.id)}
                      className={`flex items-center justify-between px-4 py-3 rounded-[1rem] border transition-all text-left ${
                        customer?.region === r.id
                          ? "bg-foreground border-transparent text-background"
                          : "border-white/[0.06] text-foreground/60 dark:text-foreground/40 hover:bg-foreground/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{r.flag}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wide">{r.name}</span>
                      </div>
                      {customer?.region === r.id && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* The Collective */}
              <Link href="/community" className="block">
                <div
                  className="flex items-center justify-between p-4 rounded-[1.5rem] group transition-all hover:bg-foreground/[0.02]"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[0.75rem] bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-blue-500 uppercase tracking-wide">The Collective</p>
                      <p className="text-[8px] text-blue-500/40 uppercase tracking-tight font-medium mt-0.5">Verified Member Access</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-500/40 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* Sign Out */}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full py-4 rounded-[1.5rem] text-[9px] font-bold uppercase tracking-[0.3em] text-foreground/50 dark:text-foreground/30 hover:text-red-400 hover:bg-red-500/[0.04] transition-all active:scale-[0.98]"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>


    </div>
  );
}
