"use client";

import { usePathname } from "next/navigation";
import StorefrontLayout from "@/components/StorefrontLayout";
import { useEffect, useState } from "react";

export default function LayoutWrapper({ 
  children, 
  footer 
}: { 
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Normal mount
    setMounted(true);

    // Fallback: force mount if something hangs hydration
    const timer = setTimeout(() => {
      setMounted(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    // SSR / Initial Hydration state
    return <div className="min-h-screen bg-background flex items-center justify-center">
      {/* Optional: Add a very minimal, Apple-style spinner here if needed, but keeping it empty for the 'clean' look requested */}
    </div>;
  }

  const isAdmin = pathname?.startsWith("/dashboard") || pathname?.startsWith("/scanner") || pathname?.startsWith("/portal");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <StorefrontLayout footer={footer}>
      {children}
    </StorefrontLayout>
  );
}
