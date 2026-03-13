"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Loader2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import StorefrontNav from "@/components/StorefrontNav";
import StorefrontHeader from "@/components/StorefrontHeader";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const CheckoutWebView = dynamic(() => import("@/components/CheckoutWebView"), { ssr: false });
const OrderSuccess = dynamic(() => import("@/components/OrderSuccess"), { ssr: false });

export default function CartPage() {
  const { items, count, subtotal, remove, update, clear } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const res = await fetch("/api/shopify/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Could not start checkout");
      }
      setCheckoutUrl(data.checkoutUrl);
    } catch (err: any) {
      setCheckoutError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleOrderSuccess = () => {
    setCheckoutUrl(null);
    setShowSuccess(true);
  };

  const handleSuccessContinue = () => {
    setShowSuccess(false);
    clear();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-[20%] right-[-5%] w-[60vw] h-[60vw] rounded-full glow-orb-2 opacity-8 dark:opacity-15" />
      </div>

      <StorefrontHeader />

      <div className="relative z-10 max-w-md mx-auto px-3 pt-header pb-40">

        {/* Page Title */}
        <div className="mb-6">
          <p className="text-[7px] font-extralight uppercase tracking-[0.55em] text-muted-foreground/35 mb-0.5">Your</p>
          <h1 className="font-heading text-[13px] uppercase tracking-widest text-foreground/80 flex items-center gap-2">
            Cart
            {count > 0 && (
              <span className="text-[8px] px-2 py-0.5 rounded-full bg-foreground/10 text-foreground/50 font-inter font-medium">
                {count}
              </span>
            )}
          </h1>
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="text-center pt-20 pb-8">
            <ShoppingBag className="w-12 h-12 text-foreground/10 mx-auto mb-4" />
            <p className="font-heading text-[10px] uppercase tracking-widest text-foreground/30 mb-2">
              Your Cart is Empty
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-4 text-[8px] uppercase tracking-widest text-foreground/40 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Continue Shopping
            </Link>
          </div>
        )}

        {/* Cart Items */}
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -30, scale: 0.95 }}
              transition={{ duration: 0.28 }}
              className="flex items-center gap-3.5 mb-3 p-3 rounded-2xl"
              style={{
                background: "hsla(var(--glass-bg), 0.55)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid hsla(var(--glass-border), 0.08)",
              }}
            >
              {/* Product Image */}
              <Link href={`/products/${item.handle}`} className="flex-shrink-0">
                <div className="relative w-16 h-20 rounded-xl overflow-hidden shadow-sm">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
              </Link>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-extralight uppercase tracking-[0.2em] text-foreground/80 line-clamp-2 mb-0.5 leading-snug">
                  {item.title}
                </p>
                {item.size && (
                  <p className="text-[7px] font-extralight uppercase tracking-widest text-foreground/35 mb-1.5">
                    Size: {item.size}
                  </p>
                )}
                <p className="text-[9px] font-inter font-semibold tracking-wider text-foreground/60">
                  ₹{(parseFloat(item.price) * item.quantity).toLocaleString("en-IN")}
                </p>
              </div>

              {/* Quantity + Remove */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div
                  className="flex items-center gap-1.5"
                  style={{
                    background: "hsla(var(--glass-bg), 0.6)",
                    border: "1px solid hsla(var(--glass-border), 0.1)",
                    borderRadius: "999px",
                    padding: "3px 8px",
                  }}
                >
                  <button
                    onClick={() => update(item.id, item.quantity - 1)}
                    className="w-5 h-5 flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors active:scale-90"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-[9px] font-inter font-semibold tracking-wider text-foreground/80 min-w-[20px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => update(item.id, item.quantity + 1)}
                    className="w-5 h-5 flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors active:scale-90"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
                <button
                  onClick={() => remove(item.id)}
                  className="text-foreground/20 hover:text-rose-400 transition-colors active:scale-90 p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Summary & Checkout */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            {/* Order Summary */}
            <div
              className="rounded-2xl p-4 mb-3"
              style={{
                background: "hsla(var(--glass-bg), 0.45)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid hsla(var(--glass-border), 0.08)",
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[8px] font-extralight uppercase tracking-widest text-foreground/40">Subtotal</span>
                <span className="text-[9px] font-inter font-semibold tracking-wider text-foreground/70">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[8px] font-extralight uppercase tracking-widest text-foreground/40">Shipping</span>
                <span className="text-[8px] font-extralight text-foreground/35">Calculated at checkout</span>
              </div>
              <div className="h-[0.5px] bg-foreground/[0.06] my-2" />
              <div className="flex justify-between items-center">
                <span className="font-heading text-[10px] uppercase tracking-widest text-foreground/70">Total</span>
                <span className="font-heading text-[12px] text-foreground/85 font-inter font-bold">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Error */}
            {checkoutError && (
              <div className="mb-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/15">
                <p className="text-[8.5px] text-red-400/80 text-center leading-relaxed">{checkoutError}</p>
              </div>
            )}

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full py-3.5 rounded-2xl text-[9px] font-bold uppercase tracking-[0.35em] active:scale-[0.98] transition-all mb-2 flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                background: "hsl(var(--foreground))",
                color: "hsl(var(--background))",
                boxShadow: "0 8px 32px -8px hsla(var(--foreground), 0.3)",
              }}
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Preparing Checkout…
                </>
              ) : (
                "Proceed to Checkout"
              )}
            </button>
            <button
              onClick={clear}
              className="w-full py-2.5 rounded-2xl text-[8px] font-extralight uppercase tracking-widest text-foreground/30 hover:text-foreground/60 transition-colors"
            >
              Clear Cart
            </button>
          </motion.div>
        )}
      </div>

      <StorefrontNav />

      {/* In-App Checkout WebView */}
      {checkoutUrl && (
        <CheckoutWebView
          checkoutUrl={checkoutUrl}
          onSuccess={handleOrderSuccess}
          onClose={() => setCheckoutUrl(null)}
        />
      )}

      {/* Order Success Screen */}
      <AnimatePresence>
        {showSuccess && <OrderSuccess onContinue={handleSuccessContinue} />}
      </AnimatePresence>
    </div>
  );
}
