"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  Plus, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";


type Address = {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

type PaymentMethod = "UPI" | "CARD" | "COD";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const { items, subtotal, clear } = useCart();
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Review
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [address, setAddress] = useState<Address>({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: (session as any)?.customer?.phone || "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const codFee = 99;
  const shipping = 0; // Standard free shipping
  
  const total = subtotal + (paymentMethod === "COD" ? codFee : 0) + shipping;

  useEffect(() => {
    if (status === "unauthenticated") {
       router.push(`/login?callbackUrl=/checkout`);
    } else if (items.length === 0 && step !== 4) {
      router.push("/cart");
    }
  }, [items, step, router, status, session]);

  // Auto-fetch previous order address if available
  useEffect(() => {
    if (session) {
      const customer = (session as any).customer;
      if (customer?.defaultAddress) {
        try {
          const savedAddr = JSON.parse(customer.defaultAddress);
          setAddress(prev => ({ ...prev, ...savedAddr }));
        } catch (e) {
          console.error("Error parsing saved address", e);
        }
      }
    }
  }, [session]);

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError("");

    try {
      if (paymentMethod === "COD") {
        const res = await fetch("/api/checkout/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address,
            paymentMethod,
            items,
            total,
            subtotal,
            codFee,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          clear();
          router.push(`/orders/${data.orderId}/confirmation`);
        } else {
          setError(data.error || "Failed to place order");
        }
      } else {
        const res = await fetch("/api/checkout/razorpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: total }),
        });

        const orderData = await res.json();
        
        if (!res.ok) throw new Error(orderData.error || "Failed to initiate payment");

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: "INR",
          name: "Zica Bella",
          description: "Order Checkout",
          order_id: orderData.id,
          handler: async function (response: any) {
            const verifyRes = await fetch("/api/checkout/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                address,
                paymentMethod,
                items,
                total,
                subtotal,
                razorpay: response,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              clear();
              router.push(`/orders/${verifyData.orderId}/confirmation`);
            } else {
              setError(verifyData.error || "Payment verification failed");
            }
          },
          prefill: {
            name: address.name,
            email: address.email,
            contact: address.phone,
          },
          theme: {
            color: "#000000",
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      
      {/* Ambient Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-[20%] right-[-5%] w-[60vw] h-[60vw] rounded-full glow-orb-2 opacity-8 dark:opacity-15" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full glow-orb-1 opacity-5 dark:opacity-10" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 pt-20 pb-safe-nav">
        {/* Page Title - Unified Style */}
        <div className="mb-8">
          <p className="text-[7px] font-extralight uppercase tracking-[0.55em] text-muted-foreground/35 mb-0.5 ml-0.5">Your</p>
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-[13px] uppercase tracking-widest text-foreground/80 flex items-center gap-2">
              Checkout
              <span className="text-[8px] px-2 py-0.5 rounded-full bg-foreground/10 text-foreground/70 dark:text-foreground/50 font-inter font-medium">
                Step {step}/2
              </span>
            </h1>
          </div>
        </div>

        <div className="flex justify-center gap-1.5 mb-10">
          {[1, 2].map((s) => (
            <div 
              key={s}
              className={`h-1 rounded-full transition-all duration-500 ${
                s <= step ? "w-8 bg-foreground" : "w-2 bg-foreground/10"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="address"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-lg font-bold tracking-tight">Delivery</h2>
                <p className="text-muted-foreground text-[11px] font-medium">Where should we send your pieces?</p>
              </div>

              <form onSubmit={handleAddressSubmit} className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={address.name}
                    onChange={(e) => setAddress({...address, name: e.target.value})}
                    className="w-full px-4 py-3 bg-muted/30 rounded-xl border-none focus:ring-1 focus:ring-foreground/5 outline-none transition-all text-[13px] placeholder:text-muted-foreground/30"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                        type="email"
                        placeholder="Email"
                        required
                        value={address.email}
                        onChange={(e) => setAddress({...address, email: e.target.value})}
                        className="w-full px-4 py-3 bg-muted/30 rounded-xl border-none focus:ring-1 focus:ring-foreground/5 outline-none transition-all text-[13px] placeholder:text-muted-foreground/30"
                    />
                    <input
                        type="tel"
                        placeholder="Phone"
                        required
                        value={address.phone}
                        onChange={(e) => setAddress({...address, phone: e.target.value})}
                        className="w-full px-4 py-3 bg-muted/30 rounded-xl border-none focus:ring-1 focus:ring-foreground/5 outline-none transition-all text-[13px] placeholder:text-muted-foreground/30"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Street Address, Area, Landmark"
                    required
                    value={address.street}
                    onChange={(e) => setAddress({...address, street: e.target.value})}
                    className="w-full px-4 py-3 bg-muted/30 rounded-xl border-none focus:ring-1 focus:ring-foreground/5 outline-none transition-all text-[13px] placeholder:text-muted-foreground/30"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="City"
                      required
                      value={address.city}
                      onChange={(e) => setAddress({...address, city: e.target.value})}
                      className="w-full px-4 py-3 bg-muted/30 rounded-xl border-none focus:ring-1 focus:ring-foreground/5 outline-none transition-all text-[13px] placeholder:text-muted-foreground/30"
                    />
                    <input
                      type="text"
                      placeholder="ZIP Code"
                      required
                      value={address.zip}
                      onChange={(e) => setAddress({...address, zip: e.target.value})}
                      className="w-full px-4 py-3 bg-muted/30 rounded-xl border-none focus:ring-1 focus:ring-foreground/5 outline-none transition-all text-[13px] placeholder:text-muted-foreground/30"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="State"
                    required
                    value={address.state}
                    onChange={(e) => setAddress({...address, state: e.target.value})}
                    className="w-full px-4 py-3 bg-muted/30 rounded-xl border-none focus:ring-1 focus:ring-foreground/5 outline-none transition-all text-[13px] placeholder:text-muted-foreground/30"
                  />
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    className="w-full py-4 bg-foreground text-background rounded-2xl font-bold uppercase tracking-[0.15em] text-[10px] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    Select Payment
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-lg font-bold tracking-tight">Payment</h2>
                <p className="text-muted-foreground text-[11px] font-medium">Choose how you'd like to pay.</p>
              </div>

              <div className="space-y-2.5">
                {[
                  { id: "UPI", label: "UPI (Google Pay, PhonePe)", description: "Instant, safe, and secure" },
                  { id: "CARD", label: "Credit / Debit Card", description: "Visa, Mastercard, RuPay" },
                  { id: "COD", label: "Cash on Delivery", description: "Pay when you receive. ₹99 fee applies." },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                    className={`w-full p-4 text-left rounded-2xl border transition-all flex items-center justify-between ${
                      paymentMethod === method.id 
                        ? "border-foreground bg-foreground text-background shadow-lg scale-[1.01]" 
                        : "border-border/20 bg-muted/20 text-foreground hover:border-border/50"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-[13px]">{method.label}</p>
                      <p className={`text-[10px] font-medium ${paymentMethod === method.id ? "opacity-60" : "text-muted-foreground/60"}`}>
                        {method.description}
                      </p>
                    </div>
                    {paymentMethod === method.id && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                ))}
              </div>

              <div className="mt-8 p-6 bg-muted/20 rounded-[2rem] space-y-3 border border-border/10">
                <div className="flex justify-between items-center text-[13px] font-medium">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                {paymentMethod === "COD" && (
                  <div className="flex justify-between items-center text-[13px] font-medium">
                    <span className="text-muted-foreground">COD Fee</span>
                    <span className="text-orange-500">+ ₹{codFee}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[13px] font-medium">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-green-500">Free</span>
                </div>
                <div className="pt-3 border-t border-border/10 flex justify-between items-center">
                  <span className="font-bold text-[13px]">Total</span>
                  <span className="text-lg font-black tracking-tight">₹{total.toLocaleString()}</span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3.5 bg-red-500/5 text-red-500 rounded-xl text-[10px] font-bold border border-red-500/10">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </div>
              )}

              <div className="pt-6">
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full py-4 bg-foreground text-background rounded-2xl font-bold uppercase tracking-[0.15em] text-[10px] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-30 border border-foreground"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {paymentMethod === "COD" ? "Place COD Order" : "Complete Order"}
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
                <p className="text-center text-[8px] text-muted-foreground/40 mt-4 uppercase tracking-[0.2em] font-bold">
                  Secure Checkout
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
