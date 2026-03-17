"use client";

import { useEffect, useState } from "react";
import {
  PackageSearch,
  Boxes,
  Loader2,
  RefreshCw,
  Plus,
  Minus,
  Check,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

export default function InventoryPage() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<Record<number, number>>({});
  const [deltas, setDeltas] = useState<Record<number, number>>({});
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
      await fetch("/api/shopify/sync", { method: "HEAD" }).catch(() => null);
      const locRes = await fetch("/api/shopify/products?limit=1");
      const locData = await locRes.json();
      if (locData.products?.[0]?.variants?.[0]) {
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
      if (!locationId || locationId === "auto") {
        await fetch("/api/shopify/products?limit=1");
      }

      const res = await fetch("/api/shopify/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryItemId: variant.inventory_item_id,
          locationId: 0,
          delta,
        }),
      });

      if (!res.ok) {
        await fetch("/api/shopify/sync", { method: "POST" });
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

  const [editingSku, setEditingSku] = useState<Record<number, string>>({});
  const [savingSku, setSavingSku] = useState<Record<number, boolean>>({});

  const handleSkuChange = (variantId: number, value: string) => {
    setEditingSku(prev => ({ ...prev, [variantId]: value }));
  };

  const saveSku = async (variantId: number, currentSku: string) => {
    const newSku = editingSku[variantId];
    if (newSku === undefined || newSku === currentSku) {
      setEditingSku(prev => {
        const n = { ...prev };
        delete n[variantId];
        return n;
      });
      return;
    }

    setSavingSku(prev => ({ ...prev, [variantId]: true }));
    try {
      const res = await fetch(`/api/shopify/variants/${variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: newSku }),
      });

      if (res.ok) {
        setProducts(prev => prev.map(p => ({
          ...p,
          variants: p.variants.map(v => v.id === variantId ? { ...v, sku: newSku } : v)
        })));
        showToast(`SKU updated to ${newSku}`);
        setEditingSku(prev => {
          const n = { ...prev };
          delete n[variantId];
          return n;
        });
      } else {
        const err = await res.json();
        showToast(`Error: ${err.error}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setSavingSku(prev => ({ ...prev, [variantId]: false }));
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-5 h-5 text-foreground/40 animate-spin" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-foreground/40">Loading Inventory...</span>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="pb-20 space-y-6 relative z-10"
    >
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-8 left-1/2 z-50 bg-background border border-foreground/[0.05] rounded-md px-4 py-2 text-[10px] font-medium text-foreground shadow-sm flex items-center gap-2 uppercase tracking-wide"
          >
            <Check className="w-3 h-3 text-green-500" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative z-10">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            Inventory
          </h1>
          <p className="text-[11px] text-foreground/50 tracking-wide max-w-xl">
            Track and adjust stock levels across variants. Click SKU to edit.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           <button
            onClick={fetchProducts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-background border border-foreground/[0.05] text-foreground rounded-md text-[10px] font-medium uppercase tracking-[0.15em] hover:bg-foreground/[0.02] disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={runSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-md text-[10px] font-medium uppercase tracking-[0.15em] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {syncing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Zap className="w-3 h-3" />
            )}
            Force Sync
          </button>
        </div>
      </div>

       {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 text-[10px] font-medium uppercase tracking-widest text-red-600 dark:text-red-400 mb-6">
          Error: {error}
        </div>
      )}

      <div className="space-y-4 relative z-10">
        {products.length === 0 ? (
          <div className="bg-background border border-foreground/[0.05] rounded-xl p-12 text-center shadow-sm">
            <PackageSearch className="w-8 h-8 text-foreground/20 mx-auto mb-4" />
             <h3 className="text-[12px] font-medium text-foreground tracking-tight">No Products Found</h3>
          </div>
        ) : (
          products.map((product) => {
            const totalStock = product.variants.reduce(
              (acc, v) => acc + (v.inventory_quantity || 0),
              0
            );
 
            return (
               <motion.div
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-background border border-foreground/[0.05] rounded-xl p-5 shadow-sm"
              >
                {/* Product Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-md bg-foreground/[0.02] border border-foreground/[0.05] flex items-center justify-center shrink-0 overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image.src}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <PackageSearch className="w-5 h-5 text-foreground/20" />
                    )}
                  </div>
                   <div>
                    <h3 className="text-[13px] font-semibold text-foreground tracking-tight mb-1">{product.title}</h3>
                    <div className="flex items-center gap-3 text-[9px] font-medium text-foreground/50 uppercase tracking-widest">
                      <span>{product.variants.length} SKU{product.variants.length !== 1 ? "s" : ""}</span>
                      <div className="w-1 h-1 rounded-full bg-foreground/20" />
                      <span className={`flex items-center gap-1 ${totalStock < 10 ? "text-red-500" : ""}`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${totalStock < 10 ? "bg-red-500 animate-pulse" : "bg-foreground/20"}`} />
                        {totalStock} UNIT{totalStock !== 1 ? "S" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Variants List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {product.variants.map((variant) => {
                    const pendingDelta = deltas[variant.id] || 0;
                    const isLoading = !!adjusting[variant.id];
                    const isSavingSku = !!savingSku[variant.id];
                    const displayQty = (variant.inventory_quantity || 0) + pendingDelta;
                    const isLowStock = displayQty < 5;
                    const currentEditingSku = editingSku[variant.id];

                    return (
                      <div
                        key={variant.id}
                        className="bg-foreground/[0.01] border border-foreground/[0.05] rounded-md p-3 flex flex-col justify-between"
                      >
                         <div className="mb-4">
                          <p className="text-[11px] font-medium text-foreground line-clamp-1 mb-1">
                            {variant.title === 'Default Title' ? 'Standard' : variant.title}
                          </p>
                          <div className="flex items-center gap-2 group">
                            {currentEditingSku !== undefined ? (
                              <div className="flex items-center gap-1 w-full">
                                <input
                                  autoFocus
                                  type="text"
                                  value={currentEditingSku}
                                  onChange={(e) => handleSkuChange(variant.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveSku(variant.id, variant.sku || '');
                                    if (e.key === 'Escape') setEditingSku(prev => {
                                      const n = { ...prev };
                                      delete n[variant.id];
                                      return n;
                                    });
                                  }}
                                  className="text-[9px] w-full bg-background border border-foreground/10 rounded px-1 py-0.5 font-mono outline-none focus:border-foreground/30"
                                />
                                <button 
                                  onClick={() => saveSku(variant.id, variant.sku || '')}
                                  disabled={isSavingSku}
                                  className="text-foreground/40 hover:text-foreground"
                                >
                                  {isSavingSku ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5" />}
                                </button>
                              </div>
                            ) : (
                              <p 
                                onClick={() => handleSkuChange(variant.id, variant.sku || '')}
                                className="text-[9px] text-foreground/40 font-mono cursor-edit hover:text-foreground transition-colors py-0.5"
                              >
                                SKU: {variant.sku || 'NONE'}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          {/* Controls */}
                          <div className="flex items-center gap-0.5 bg-background border border-foreground/[0.05] rounded-md p-0.5">
                            <button
                              onClick={() => handleDelta(variant.id, -1)}
                              disabled={isLoading}
                              className="w-7 h-7 flex items-center justify-center rounded-sm text-foreground/60 hover:bg-foreground/[0.02] hover:text-foreground disabled:opacity-50 transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            
                            <div className="flex flex-col items-center justify-center w-8 text-center">
                               <span className={`text-[12px] font-semibold ${isLowStock ? "text-red-500" : "text-foreground"}`}>
                                 {displayQty}
                               </span>
                            </div>
                            
                             <button
                              onClick={() => handleDelta(variant.id, 1)}
                              disabled={isLoading}
                              className="w-7 h-7 flex items-center justify-center rounded-sm text-foreground/60 hover:bg-foreground/[0.02] hover:text-foreground disabled:opacity-50 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                           {/* Apply */}
                           <AnimatePresence>
                              {pendingDelta !== 0 && (
                                <motion.button
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  onClick={() => applyAdjustment(variant, product.title)}
                                  disabled={isLoading}
                                  className="w-8 h-8 bg-foreground text-background rounded-md flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity"
                                >
                                  {isLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                </motion.button>
                              )}
                           </AnimatePresence>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
