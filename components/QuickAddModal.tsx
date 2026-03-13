"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ShoppingBag, Check } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { ShopifyProduct } from "@/lib/shopify-admin";

interface Props {
  product: ShopifyProduct;
  onClose: () => void;
}

export default function QuickAddModal({ product, onClose }: Props) {
  const { add } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const sizes = product.variants
    ?.map((v) => ({ size: v.option1 ?? "One Size", variantId: String(v.id) }))
    .filter((v, i, a) => a.findIndex((x) => x.size === v.size) === i) || [];

  const price = product.variants?.[0]?.price || "0";
  const image = product.images?.[0]?.src || "/placeholder.png";

  // Auto-select if single size
  useEffect(() => {
    if (sizes.length === 1) setSelectedSize(sizes[0].size);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizes.length]);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleAdd = () => {
    if (sizes.length > 1 && !selectedSize) return;
    const variant = sizes.find((s) => s.size === (selectedSize ?? sizes[0]?.size));
    add({
      productId: String(product.id),
      variantId: variant?.variantId ?? String(product.variants?.[0]?.id),
      title: product.title,
      size: selectedSize,
      price,
      image,
    });
    setAdded(true);
    setTimeout(() => { setAdded(false); onClose(); }, 900);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.40)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      onClick={handleBackdrop}
    >
      <div
        className="w-full max-w-md rounded-t-[2.2rem] overflow-hidden flex flex-col"
        style={{
          background: "hsla(var(--glass-bg), 0.96)",
          backdropFilter: "blur(40px) saturate(200%)",
          WebkitBackdropFilter: "blur(40px) saturate(200%)",
          border: "1px solid hsla(var(--glass-border), 0.14)",
          boxShadow: "0 -16px 60px -12px hsla(var(--glass-shadow), 0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full bg-foreground/15" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-2 pb-4">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0">
            <Image src={image} alt={product.title} fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-extralight uppercase tracking-[0.22em] text-foreground/80 line-clamp-2 leading-relaxed">
              {product.title}
            </p>
            <p className="text-[9px] font-inter font-medium text-foreground/50 tracking-widest mt-0.5">
              ₹{parseFloat(price).toLocaleString("en-IN")}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-foreground/40 hover:text-foreground transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Size Selection */}
        {sizes.length > 1 && (
          <div className="px-5 mb-4">
            <p className="text-[7px] font-extralight uppercase tracking-[0.45em] text-foreground/35 mb-2">Select Size</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map(({ size }) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-[0.95rem] text-[10px] font-semibold uppercase tracking-widest transition-all ${
                    selectedSize === size
                      ? "bg-foreground text-background shadow-md"
                      : "bg-white/5 border border-white/10 text-foreground/50 hover:bg-white/10"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add Button */}
        <div className="px-5 pb-32">
          <button
            onClick={handleAdd}
            disabled={sizes.length > 1 && !selectedSize}
            className={`w-full py-3 rounded-2xl text-[9px] font-extralight uppercase tracking-[0.35em] transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 ${
              added
                ? "bg-green-500 text-white"
                : sizes.length > 1 && !selectedSize
                  ? "bg-foreground/10 text-foreground/30 cursor-not-allowed"
                  : "bg-foreground text-background hover:opacity-90"
            }`}
          >
            {added ? (
              <><Check className="w-3.5 h-3.5" /> Added</>
            ) : (
              <><ShoppingBag className="w-3.5 h-3.5" /> Add to Cart</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
