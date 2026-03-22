"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, Package } from "lucide-react";

function RequestFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const type = searchParams.get('type');
  const orderId = searchParams.get('orderId');
  const itemId = searchParams.get('itemId');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const customerId = localStorage.getItem("customerId");
      const res = await fetch("/api/portal/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          shopDomain:
            process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
            "8tiahf-bk.myshopify.com",
          orderId,
          itemId,
          type,
          reason,
          newProductId: type === 'exchange' ? 'dummy_new_product_id' : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request");

      setSuccess(true);
      setTimeout(() => {
        router.push("/portal/dashboard");
      }, 3000);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to submit request";
        setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!type || !orderId || !itemId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Invalid link. Missing required parameters.</p>
        <button onClick={() => router.push("/portal/dashboard")} className="mt-4 text-black underline">
          Go back
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-16 animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
        <p className="text-gray-500">Your {type} request has been received. Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reason for {type}
        </label>
        <textarea
          required
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={`Please explain why you want to ${type} this item...`}
          className="w-full px-4 py-3 bg-white/50 border border-gray-300 rounded-xl focus:ring-black focus:border-black outline-none transition-colors"
        />
      </div>

      {type === 'exchange' && (
        <div className="p-4 bg-gray-50 border rounded-xl">
          <p className="text-sm font-medium text-gray-700 mb-2 border-b pb-2">Select Replacement Size/Color</p>
          <p className="text-xs text-gray-500 mt-2 text-center py-4 bg-gray-100/50 border border-dashed rounded-lg">Product selection catalog placeholder</p>
          {/* In a real app, you would fetch and list variants of the same product here */}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? "Submitting..." : `Submit ${type === 'return' ? 'Return' : 'Exchange'} Request`}
        </button>
      </div>
    </form>
  );
}

export default function NewRequestPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      <nav className="nav-glass sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 justify-between items-center">
            <button 
              onClick={() => router.push("/portal/dashboard")}
              className="text-[10px] font-rocaston tracking-[0.2em] text-muted-foreground hover:text-foreground flex items-center transition-all bg-foreground/5 px-4 py-2 rounded-xl border border-foreground/5"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-2" />
              BACK TO ORDERS
            </button>
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 overflow-hidden bg-foreground/5 p-1 border border-foreground/10 rounded-full">
                <img
                  src="https://cdn.shopify.com/s/files/1/0955/5394/5881/files/zica-bella-logo_834c1ed2-2f09-4f73-bb9f-152a03f59ad2.png?v=1773354221"
                  alt="Logo"
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
              <span className="font-rocaston text-sm tracking-[0.2em] text-foreground">ZICA BELLA</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white p-8 rounded-3xl border shadow-sm">
          <div className="flex items-center space-x-4 mb-8">
            <div className="h-12 w-12 bg-foreground/5 rounded-2xl flex items-center justify-center border border-foreground/10">
              <Package className="w-5 h-5 text-foreground/80 dark:text-foreground/60" />
            </div>
            <div>
              <h1 className="font-rocaston text-xl tracking-[0.15em] text-foreground leading-none mb-2">CREATE REQUEST</h1>
              <p className="text-muted-foreground text-[9px] font-extralight uppercase tracking-[0.3em]">REFINING YOUR PURCHASE EXPERIENCE.</p>
            </div>
          </div>

          <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>}>
            <RequestFormContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
