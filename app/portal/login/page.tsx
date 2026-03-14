"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PortalLoginPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-[10px] font-black uppercase tracking-widest opacity-30">
        Redirecting to Unified Login...
      </div>
    </div>
  );
}
