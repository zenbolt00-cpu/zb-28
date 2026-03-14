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

export default function SpotlightSection({ 
  title = "AUTHENTIC STREETWEAR", 
  subtitle = "Luxury Indian streetwear for modern men. Redefining bold everyday style." 
}: { 
  title?: string; 
  subtitle?: string; 
}) {
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
        <h2 className="font-heading text-[32px] tracking-tight text-foreground mb-4 uppercase">{title}</h2>
        <p className="text-[11px] text-muted-foreground max-w-[280px] mx-auto leading-relaxed tracking-wider font-extralight uppercase">
          {subtitle}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-x-3 gap-y-12 group/grid">
        {(products.length > 0 ? products : Array(6).fill(null)).slice(0, 6).map((product, idx) => (
          <Link 
            key={product?.id || idx} 
            href={product ? `/products/${product.handle || product.id}` : "#"}
            className="flex flex-col items-center gap-5 group/item active:scale-[0.98] transition-all duration-700"
          >
            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-foreground/[0.03] border border-foreground/[0.06] group-hover/item:border-foreground/20 transition-all duration-700 shadow-sm group-hover/item:shadow-xl">
              {product?.images?.[0]?.src ? (
                <NextImage 
                  src={product.images[0].src} 
                  alt={product.title} 
                  fill 
                  className="object-cover opacity-90 group-hover/item:opacity-100 group-hover/item:scale-105 transition-all duration-1000 ease-out"
                />
              ) : (
                <div className="w-full h-full bg-foreground/[0.02] flex items-center justify-center">
                  <span className="text-[7px] text-muted-foreground/20 uppercase tracking-[0.3em] font-light">ZB Studio</span>
                </div>
              )}
              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-700" />
            </div>
            <div className="flex flex-col items-center gap-1.5 px-1">
              <span className="text-[8px] font-bold tracking-[0.25em] text-foreground/80 uppercase group-hover/item:text-foreground transition-colors text-center line-clamp-1">
                {AUTHENTIC_HEADINGS[idx] || product?.title || "ZICA BELLA"}
              </span>
              <div className="h-[1px] w-0 group-hover/item:w-full bg-foreground/20 transition-all duration-700 ease-out" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
