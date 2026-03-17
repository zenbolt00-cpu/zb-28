"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function PageLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Basic route change detection for immediate feedback
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    // Since Next.js 13+ doesn't have route change events, 
    // we use pathname/searchParams as triggers to stop loading
    handleComplete();

    // We can't easily detect the "start" of a navigation in app router 
    // without wrapping Links, but we can make the loading state 
    // feel faster by showing it briefly or during data fetching.
    // For now, this component will be ready to be triggered.
  }, [pathname, searchParams]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 w-full h-1 z-[100] pointer-events-none"
        >
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.3, ease: "circIn" }}
            className="h-full bg-primary shadow-[0_0_12px_rgba(var(--primary),0.8)]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
