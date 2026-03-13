"use client";

import { useEffect, useState } from "react";
import {
  PackageSearch,
  ExternalLink,
  RefreshCw,
  Loader2,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
} from "lucide-react";

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  sku: string | null;
  barcode: string | null;
  inventory_quantity: number;
  option1: string | null;
  option2: string | null;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  status: string;
  product_type: string;
  vendor: string;
  tags: string;
  image: { src: string } | null;
  variants: ShopifyVariant[];
}

const SHOPIFY_DOMAIN =
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "8tiahf-bk.myshopify.com";

export default function ProductsPage() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">("all");
  const [updating, setUpdating] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadProducts = async () => {
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

  useEffect(() => {
    loadProducts();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleStatus = async (product: ShopifyProduct) => {
    const newStatus = product.status === "active" ? "draft" : "active";
    setUpdating(product.id);
    try {
      const res = await fetch(`/api/shopify/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, status: newStatus } : p
        )
      );
      showToast(`"${product.title}" set to ${newStatus}`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = products
    .filter((p) => statusFilter === "all" || p.status === statusFilter)
    .filter(
      (p) =>
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.vendor.toLowerCase().includes(search.toLowerCase()) ||
        p.variants.some((v) =>
          (v.sku || "").toLowerCase().includes(search.toLowerCase())
        )
    );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 glass-card rounded-xl px-5 py-3 text-sm text-foreground border border-foreground/10 flex items-center gap-2 shadow-xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
            Products
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your Shopify product catalog — {products.length} products.
          </p>
        </div>
        <button
          onClick={loadProducts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 glass glass-hover rounded-xl text-sm font-medium text-foreground disabled:opacity-50 w-fit border border-foreground/5 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-foreground/20 transition-all"
            placeholder="Search products, SKUs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "draft"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm capitalize ${
                statusFilter === s
                  ? "bg-foreground text-background"
                  : "glass glass-hover text-muted-foreground border border-foreground/5"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="glass-card rounded-2xl p-4 border border-red-500/20 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Product List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="glass-card rounded-2xl p-12 text-center flex justify-center border border-foreground/5">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-foreground/5">
            <PackageSearch className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No products found</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              {search ? "Try a different search term." : "No products in your Shopify store."}
            </p>
          </div>
        ) : (
          filtered.map((product) => {
            const totalStock = product.variants.reduce(
              (acc, v) => acc + (v.inventory_quantity || 0),
              0
            );
            const isUpdating = updating === product.id;

            return (
              <div
                key={product.id}
                className="glass-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 border border-foreground/5 shadow-xl shadow-foreground/[0.02]"
              >
                {/* Left: Image + Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-16 h-16 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image.src}
                        alt={product.title}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <PackageSearch className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground truncate">
                      {product.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1.5 text-[10px] font-medium uppercase tracking-wider">
                      {product.vendor && (
                        <span className="text-muted-foreground bg-foreground/5 px-2 py-0.5 rounded-md border border-foreground/5">
                          {product.vendor}
                        </span>
                      )}
                      {product.product_type && (
                        <span className="text-muted-foreground bg-foreground/5 px-2 py-0.5 rounded-md border border-foreground/5">
                          {product.product_type}
                        </span>
                      )}
                      <span className="text-muted-foreground bg-foreground/5 px-2 py-0.5 rounded-md border border-foreground/5">
                        {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {/* Variant SKUs */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {product.variants.slice(0, 4).map((v) => (
                        <span
                          key={v.id}
                          className={`text-xs px-2 py-0.5 rounded border ${
                            v.inventory_quantity < 5
                              ? "border-red-500/30 text-red-500 bg-red-500/10 font-bold"
                              : "border-foreground/10 text-muted-foreground bg-foreground/5"
                          }`}
                        >
                          {v.option1 || v.title}: {v.inventory_quantity}
                        </span>
                      ))}
                      {product.variants.length > 4 && (
                        <span className="text-xs text-muted-foreground/60 px-2 py-0.5">
                          +{product.variants.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Stats + Actions */}
                <div className="flex items-center gap-4 md:gap-8 shrink-0">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">
                      Stock
                    </p>
                    <p
                      className={`text-xl font-bold ${
                        totalStock < 10 ? "text-red-500" : "text-foreground"
                      }`}
                    >
                      {totalStock}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">
                      Price
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      ₹{parseFloat(product.variants[0]?.price || "0").toLocaleString("en-IN")}
                    </p>
                  </div>

                  {/* Status Toggle */}
                  <button
                    onClick={() => toggleStatus(product)}
                    disabled={isUpdating}
                    title={product.status === "active" ? "Set to Draft" : "Set to Active"}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${
                      product.status === "active"
                        ? "bg-emerald-500/10 text-emerald-500 hover:bg-red-500/10 hover:text-red-500 border border-emerald-500/20"
                        : "bg-foreground/5 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500 border border-foreground/10"
                    }`}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : product.status === "active" ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                    {product.status}
                  </button>

                  {/* Open in Shopify */}
                  <a
                    href={`https://${SHOPIFY_DOMAIN}/admin/products/${product.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 glass glass-hover border border-foreground/5 rounded-lg transition-all"
                    title="Open in Shopify Admin"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
