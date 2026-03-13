"use client";

import { useEffect, useState } from "react";
import {
  PackageSearch,
  Boxes,
  Loader2,
  RefreshCw,
  Plus,
  Minus,
  CheckCircle2,
  Zap,
} from "lucide-react";

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  sku: string | null;
  barcode: string | null;
  inventory_quantity: number;
  inventory_item_id: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  status: string;
  product_type: string;
  vendor: string;
  image: { src: string } | null;
  variants: ShopifyVariant[];
}

interface AdjustState {
  productId: number;
  variantId: number;
  inventoryItemId: number;
  delta: number;
  loading: boolean;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<Record<number, number>>({}); // variantId -> loading flag
  const [deltas, setDeltas] = useState<Record<number, number>>({}); // variantId -> pending delta
  const [locationId, setLocationId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shopify/products?limit=250");
      const data = await res.json();
      setProducts(data.products || []);
      if (data.error) setError(`Shopify API: ${data.error}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocation = async () => {
    try {
      const res = await fetch("/api/shopify/sync", { method: "HEAD" }).catch(() => null);
      // Get location via products sync to retrieve first location ID
      const locRes = await fetch("/api/shopify/products?limit=1");
      const locData = await locRes.json();
      if (locData.products?.[0]?.variants?.[0]) {
        // We'll let the adjust endpoint resolve location automatically
        setLocationId("auto");
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchProducts();
    fetchLocation();
  }, []);

  const handleDelta = (variantId: number, change: number) => {
    setDeltas((prev) => ({
      ...prev,
      [variantId]: (prev[variantId] || 0) + change,
    }));
  };

  const applyAdjustment = async (
    variant: ShopifyVariant,
    productTitle: string
  ) => {
    const delta = deltas[variant.id] || 0;
    if (delta === 0) return;

    setAdjusting((prev) => ({ ...prev, [variant.id]: 1 }));
    try {
      // We need a locationId. Fetch locations if not set.
      const locId = locationId;
      if (!locId || locId === "auto") {
        const lRes = await fetch("/api/shopify/products?limit=1");
        // Use adjust endpoint which auto-resolves location from inventory item
        // Pass locationId as 0 and let server resolve
      }

      const res = await fetch("/api/shopify/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryItemId: variant.inventory_item_id,
          locationId: 0, // server will resolve first location
          delta,
        }),
      });

      // If server needs a real location, fall back to fetching locations first
      if (!res.ok) {
        // Try to get locations from sync first then retry
        const syncRes = await fetch("/api/shopify/sync", { method: "POST" });
      }

      if (res.ok) {
        const data = await res.json();
        const newQty = data.inventoryLevel?.available ?? (variant.inventory_quantity + delta);
        setProducts((prev) =>
          prev.map((p) => ({
            ...p,
            variants: p.variants.map((v) =>
              v.id === variant.id
                ? { ...v, inventory_quantity: newQty }
                : v
            ),
          }))
        );
        setDeltas((prev) => ({ ...prev, [variant.id]: 0 }));
        showToast(
          `${productTitle} (${variant.option1 || variant.title}): ${delta > 0 ? "+" : ""}${delta} → ${newQty}`
        );
      } else {
        const errData = await res.json();
        showToast(`Error: ${errData.error}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setAdjusting((prev) => {
        const n = { ...prev };
        delete n[variant.id];
        return n;
      });
    }
  };

  const runSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/shopify/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        const s = data.synced;
        showToast(`Sync complete: ${s.products} products, ${s.orders} orders, ${s.customers} customers`);
        await fetchProducts();
      } else {
        showToast(`Sync error: ${data.error}`);
      }
    } catch (err: any) {
      showToast(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {toast && (
        <div className="fixed top-6 right-6 z-50 glass-card rounded-xl px-5 py-3 text-sm text-white border border-white/10 flex items-center gap-2 shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          {toast}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Inventory</h1>
          <p className="text-gray-400 text-sm">
            Real-time stock levels — adjust and sync directly with Shopify.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={runSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-colors"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {syncing ? "Syncing…" : "Full Sync"}
          </button>
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 glass glass-hover rounded-xl text-sm font-medium text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-card rounded-2xl p-4 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="glass-card rounded-2xl p-12 text-center flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <PackageSearch className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white">No products found</h3>
            <p className="text-gray-400 mt-2 text-sm">Click "Full Sync" to import from Shopify.</p>
          </div>
        ) : (
          products.map((product) => {
            const totalStock = product.variants.reduce(
              (acc, v) => acc + (v.inventory_quantity || 0),
              0
            );

            return (
              <div
                key={product.id}
                className="glass-card rounded-2xl p-6 space-y-5"
              >
                {/* Product Header */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image.src}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <PackageSearch className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white">{product.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}</span>
                      <span>·</span>
                      <span className={`font-medium ${totalStock < 10 ? "text-red-400" : "text-green-400"}`}>
                        {totalStock} total units
                      </span>
                    </div>
                  </div>
                </div>

                {/* Variants with Adjust Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {product.variants.map((variant) => {
                    const pendingDelta = deltas[variant.id] || 0;
                    const isLoading = !!adjusting[variant.id];
                    const displayQty = variant.inventory_quantity + pendingDelta;

                    return (
                      <div
                        key={variant.id}
                        className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">
                            {variant.option1}
                            {variant.option2 ? ` / ${variant.option2}` : ""}
                            {variant.option3 ? ` / ${variant.option3}` : ""}
                          </p>
                          {variant.sku && (
                            <p className="text-xs text-gray-500 mt-0.5">SKU: {variant.sku}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDelta(variant.id, -1)}
                              disabled={isLoading}
                              className="w-8 h-8 flex items-center justify-center glass glass-hover rounded-lg text-white disabled:opacity-40"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span
                              className={`text-xl font-bold min-w-[2.5rem] text-center ${
                                displayQty < 5 ? "text-red-400" : "text-white"
                              }`}
                            >
                              {displayQty}
                              {pendingDelta !== 0 && (
                                <span
                                  className={`text-xs font-normal ml-1 ${
                                    pendingDelta > 0 ? "text-green-400" : "text-red-400"
                                  }`}
                                >
                                  ({pendingDelta > 0 ? "+" : ""}{pendingDelta})
                                </span>
                              )}
                            </span>
                            <button
                              onClick={() => handleDelta(variant.id, 1)}
                              disabled={isLoading}
                              className="w-8 h-8 flex items-center justify-center glass glass-hover rounded-lg text-white disabled:opacity-40"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {pendingDelta !== 0 && (
                            <button
                              onClick={() => applyAdjustment(variant, product.title)}
                              disabled={isLoading}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                            >
                              {isLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              Apply
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
