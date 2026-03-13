"use client";

import { usePathname } from "next/navigation";
import StorefrontHeader from "./StorefrontHeader";
import StorefrontNav from "./StorefrontNav";
import { useEffect, useState } from "react";

interface StorefrontLayoutProps {
  children: React.ReactNode;
  footer: React.ReactNode;
}

export default function StorefrontLayout({ children, footer }: StorefrontLayoutProps) {
  const pathname = usePathname();
  const [collections, setCollections] = useState<any[]>([]);
  
  // Don't show storefront UI on dashboard or scanner routes
  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/scanner") || pathname.startsWith("/portal");
  
  useEffect(() => {
    if (!isDashboard) {
      fetch("/api/shopify/collections?usage=header")
        .then(res => res.json())
        .then(data => setCollections(data))
        .catch(err => console.error("Error fetching collections for header:", err));
    }
  }, [isDashboard]);

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-foreground/10 transition-colors duration-500">
      {/* ── Ambient Orbs ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
        <div className="absolute -top-[15%] -left-[10%] w-[80vw] h-[80vw] rounded-full glow-orb-1 opacity-20 dark:opacity-35" />
        <div className="absolute top-[5%] -right-[8%] w-[60vw] h-[60vw] rounded-full glow-orb-2 opacity-14 dark:opacity-25" />
        <div className="absolute -bottom-[12%] left-[8%] w-[70vw] h-[70vw] rounded-full glow-orb-3 opacity-10 dark:opacity-18" />
      </div>

      <StorefrontHeader collections={collections} />
      
      {/* ── Main Content ── */}
      <div className="relative z-10">
        {children}
      </div>

      {/* ── Footer (passed from server) ── */}
      {footer}

      {/* ── Shared Bottom Nav ── */}
      <StorefrontNav />
    </div>
  );
}
