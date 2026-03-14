"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { ShopifyProduct } from "@/lib/shopify-admin";

const AUTHENTIC_HEADINGS = [
  "ROGUE WINTER",
  "BLUE DOMINION",
  "VINTAGE DUSK",
  "URBAN ARMOUR",
  "ZIPCORE DENIM",
  "GRAPHIC SOUL"
];

export default function SpotlightSection() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shopify/products?pageSize=6")
      .then(res => res.json())
      .then(data => {
        if (data.products) setProducts(data.products);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="mt-16 mb-20 px-4">
        <div className="grid grid-cols-3 gap-x-2 gap-y-10 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-4">
              <div className="aspect-square w-full rounded-2xl bg-foreground/5" />
              <div className="h-2 w-16 bg-foreground/5 rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-16 mb-20 px-4">
      <div className="text-center mb-12">
        <h2 className="font-heading text-[32px] tracking-tight text-foreground mb-4 uppercase">AUTHENTIC STREETWEAR</h2>
        <p className="text-[11px] text-muted-foreground max-w-[280px] mx-auto leading-relaxed tracking-wider font-extralight uppercase">
          Luxury Indian streetwear for modern men. Redefining bold everyday style.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-x-2 gap-y-10 group/grid">
        {(products.length > 0 ? products : Array(6).fill(null)).slice(0, 6).map((product, idx) => (
          <Link 
            key={product?.id || idx} 
            href={product ? `/products/${product.handle || product.id}` : "#"}
            className="flex flex-col items-center gap-4 group/item active:scale-95 transition-all duration-500"
          >
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-foreground/[0.02] flex items-center justify-center border border-foreground/[0.03] group-hover/item:border-foreground/10 transition-colors">
              {product?.images?.[0]?.src ? (
                <NextImage 
                  src={product.images[0].src} 
                  alt={product.title} 
                  fill 
                  className="object-contain p-2 mix-blend-multiply dark:mix-blend-normal opacity-90 group-hover/item:opacity-100 group-hover/item:scale-110 transition-all duration-700"
                />
              ) : (
                <div className="w-full h-full bg-foreground/5 flex items-center justify-center">
                  <span className="text-[8px] text-muted-foreground/30 uppercase tracking-widest">No Image</span>
                </div>
              )}
            </div>
            <span className="text-[9px] font-medium tracking-[0.15em] text-foreground/70 uppercase group-hover/item:text-foreground transition-colors text-center line-clamp-1 px-1">
              {AUTHENTIC_HEADINGS[idx] || product?.title || "ZICA BELLA"}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
