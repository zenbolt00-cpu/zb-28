"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  checkoutUrl: string;
  onSuccess: () => void;
  onClose: () => void;
}

// Detect Shopify order confirmation page patterns
function isOrderConfirmation(url: string): boolean {
  try {
    const u = new URL(url);
    // Shopify standard checkout thank_you paths
    return (
      u.pathname.includes("/thank_you") ||
      u.pathname.includes("/orders/") ||
      u.pathname.includes("/order-status") ||
      u.searchParams.has("order_id") ||
      u.searchParams.has("checkout")
    );
  } catch {
    return false;
  }
}

export default function CheckoutWebView({ checkoutUrl, onSuccess, onClose }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(checkoutUrl);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll iframe location for order confirmation (works if same-origin or postMessage)
  const checkForSuccess = useCallback(() => {
    try {
      const iframe = iframeRef.current;
      if (!iframe) return;
      // Try to access href - will throw if cross-origin (expected for Shopify)
      const loc = iframe.contentWindow?.location?.href;
      if (loc && isOrderConfirmation(loc)) {
        if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
        onSuccess();
      }
    } catch {
      // Cross-origin — expected. We rely on postMessage or window messaging instead.
    }
  }, [onSuccess]);

  // Listen for messages from the Shopify checkout page
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        // Shopify sometimes sends checkout:complete or similar
        if (
          data?.type === "checkout:complete" ||
          data?.event === "checkout:complete" ||
          data?.status === "success" ||
          (typeof e.data === "string" && e.data.includes("thank_you"))
        ) {
          onSuccess();
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onSuccess]);

  // Poll iframe URL every 1.5s for confirmation page
  useEffect(() => {
    checkIntervalRef.current = setInterval(checkForSuccess, 1500);
    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [checkForSuccess]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    // Immediately check if we landed on confirmation page
    checkForSuccess();
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setIframeBlocked(true);
  };

  // Fallback: if iframe is blocked by CSP/X-Frame-Options, open in new tab
  const openExternal = () => {
    window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex flex-col"
        style={{ background: "hsl(var(--background))" }}
      >
        {/* Header Bar */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b border-foreground/[0.06] flex-shrink-0"
          style={{
            background: "hsla(var(--glass-bg), 0.90)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-foreground/[0.05] hover:bg-foreground/[0.1] transition-all active:scale-90"
            aria-label="Close checkout"
          >
            <X className="w-4 h-4 text-foreground/60" />
          </button>

          {/* URL bar */}
          <div
            className="flex-1 h-8 rounded-full flex items-center px-3 gap-2"
            style={{
              background: "hsla(var(--glass-bg), 0.5)",
              border: "1px solid hsla(var(--glass-border), 0.08)",
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
            <span className="text-[9px] font-medium text-foreground/40 truncate tracking-wide">
              Secure Checkout · {new URL(checkoutUrl).hostname}
            </span>
          </div>

          {isLoading && <Loader2 className="w-4 h-4 text-foreground/30 animate-spin flex-shrink-0" />}
        </div>

        {/* Iframe Content */}
        <div className="flex-1 relative overflow-hidden">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4"
              style={{ background: "hsl(var(--background))" }}>
              <div className="w-10 h-10 rounded-full border-2 border-foreground/10 border-t-foreground/50 animate-spin" />
              <p className="text-[9px] uppercase tracking-[0.3em] text-foreground/30">Loading Checkout…</p>
            </div>
          )}

          {/* Blocked state */}
          {iframeBlocked ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "hsla(var(--glass-bg), 0.5)", border: "1px solid hsla(var(--glass-border), 0.1)" }}
              >
                <RefreshCw className="w-7 h-7 text-foreground/40" />
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-tight text-foreground/80 mb-2">Complete Your Order</p>
                <p className="text-[9px] text-foreground/40 tracking-wide leading-relaxed max-w-[240px]">
                  Tap below to open the secure checkout. Your cart is saved.
                </p>
              </div>
              <button
                onClick={openExternal}
                className="px-8 py-3.5 rounded-2xl bg-foreground text-background text-[9px] font-bold uppercase tracking-[0.35em] hover:opacity-90 active:scale-[0.98] transition-all shadow-xl"
              >
                Open Checkout
              </button>
              <button onClick={onClose} className="text-[8px] uppercase tracking-widest text-foreground/30 hover:text-foreground/60 transition-colors">
                Cancel
              </button>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={checkoutUrl}
              title="Shopify Checkout"
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              allow="payment; camera; microphone"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation allow-modals"
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

