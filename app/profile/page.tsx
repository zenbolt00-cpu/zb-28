"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { User, LogOut, Package, MapPin, ChevronRight, Settings, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import StorefrontHeader from "@/components/StorefrontHeader";
import StorefrontNav from "@/components/StorefrontNav";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-12 h-12 bg-foreground/10 rounded-2xl flex items-center justify-center"
        >
          <User className="w-6 h-6 text-foreground/20" />
        </motion.div>
      </div>
    );
  }

  if (!session) return null;

  const sections = [
    { label: "Orders", icon: Package, href: "/orders", count: "3" },
    { label: "Addresses", icon: MapPin, href: "/profile/addresses" },
    { label: "Security", icon: Shield, href: "/profile/security" },
    { label: "Settings", icon: Settings, href: "/profile/settings" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Ambient Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-[20%] right-[-5%] w-[60vw] h-[60vw] rounded-full glow-orb-2 opacity-8 dark:opacity-15" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full glow-orb-1 opacity-5 dark:opacity-10" />
      </div>

      <StorefrontHeader />

      <main className="relative z-10 max-w-md mx-auto px-4 pt-header pb-40">
        {/* Page Title - Unified Style */}
        <div className="mb-8">
          <p className="text-[7px] font-extralight uppercase tracking-[0.55em] text-muted-foreground/35 mb-0.5 ml-0.5">Your</p>
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-[13px] uppercase tracking-widest text-foreground/80 flex items-center gap-2">
              Profile
            </h1>
            <Link href="/" className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/30 hover:text-foreground/60 transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>

        <div className="space-y-10">
          {/* Profile Info */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative w-20 h-20 rounded-[2rem] bg-muted/40 flex items-center justify-center border border-border/5 shadow-lg overflow-hidden group">
              {session.user?.image ? (
                <Image src={session.user.image} alt={session.user.name || "User"} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <User className="w-8 h-8 text-muted-foreground/30" />
              )}
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-black tracking-tight">{session.user?.name || "Member"}</h1>
              <p className="text-muted-foreground text-[10px] font-bold tracking-[0.1em] uppercase opacity-50">
                {session.user?.email || (session as any).customer?.phone}
              </p>
            </div>
          </div>

          {/* Menu Sections */}
          <div className="space-y-1.5">
            {sections.map((section, idx) => (
              <Link key={idx} href={section.href}>
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-between p-4 rounded-[1.5rem] bg-muted/10 hover:bg-muted/30 transition-all border border-transparent hover:border-border/5 group shadow-sm"
                  style={{
                    background: "hsla(var(--glass-bg), 0.55)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid hsla(var(--glass-border), 0.08)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-background rounded-xl border border-border/10 group-hover:scale-105 transition-transform">
                      <section.icon className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                    </div>
                    <span className="font-bold text-[14px] tracking-tight">{section.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {section.count && <span className="text-[9px] font-black bg-foreground/5 px-2 py-0.5 rounded-full">{section.count}</span>}
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-foreground transition-all group-hover:translate-x-0.5" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Global Actions */}
          <div className="space-y-2">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 border border-red-500/10 rounded-full text-red-500 hover:bg-red-500/5 transition-all font-black text-[10px] uppercase tracking-widest"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>

          <div className="text-center opacity-30">
              <p className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] font-black">
                  Since {new Date().getFullYear()}
              </p>
          </div>
        </div>
      </main>

      <StorefrontNav />
    </div>
  );
}
