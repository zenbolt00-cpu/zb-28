"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { ShopifyProduct } from "@/lib/shopify-admin";

// Lazy-load modal to avoid SSR issues
const QuickAddModal = dynamic(() => import("./QuickAddModal"), { ssr: false });

interface Props {
  product: ShopifyProduct;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const image = product.images?.[0]?.src || "/placeholder.png";
  const variant = product.variants?.[0];
  const price = variant?.price || "0";
  const compareAtPrice = variant?.compare_at_price;
  const isOnSale = compareAtPrice && parseFloat(compareAtPrice) > parseFloat(price);

  // Use handle for SEO-friendly URLs — falls back to id if handle unavailable
  const productSlug = product.handle || product.id;

  const handleOpenModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setTimeout(() => {
      setShowModal(true);
      setIsAdding(false);
    }, 300);
  };

  return (
    <>
      <div className="group relative w-full">
        {/* Sale Banner */}
        {isOnSale && (
          <div className="absolute top-2 left-2 z-10">
            <div
              className="px-1.5 py-[1px] rounded-[2px] leading-none"
              style={{
                background: "hsla(var(--foreground), 0.85)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <span className="text-[6px] font-bold uppercase tracking-tighter text-background">Sale</span>
            </div>
          </div>
        )}

        {/* Image */}
        <Link href={`/products/${productSlug}`} className="block">
          <div className="aspect-[3/4.2] relative rounded-[0.8rem] overflow-hidden bg-muted mb-1.5 shadow-sm">
            <Image
              src={image}
              alt={product.title}
              fill
              priority={priority}
              sizes="(max-width: 768px) 50vw, 360px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            {/* Hover glass overlay */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.12) 100%)",
              }}
            />
          </div>
        </Link>

        {/* Info row with "+" button */}
        <div className="flex justify-between items-start leading-tight px-1">
          <div className="flex-1 min-w-0 pr-1.5 flex flex-col gap-0.5">
            <p className="text-[7.5px] sm:text-[8px] font-normal uppercase tracking-[0.12em] text-foreground/80 leading-[1.2] truncate">
              {product.title}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[7.5px] font-light tracking-[0.05em] text-foreground/30 uppercase">
                rs. {parseFloat(price).toLocaleString("en-IN")}
              </p>
              {isOnSale && compareAtPrice && (
                <p className="text-[7px] font-light tracking-[0.05em] text-foreground/20 uppercase line-through">
                  rs. {parseFloat(compareAtPrice).toLocaleString("en-IN")}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleOpenModal}
            aria-label="Quick add to cart"
            className="w-5 h-5 rounded-md flex items-center justify-center transition-all duration-300 active:scale-95 flex-shrink-0 bg-transparent hover:bg-foreground/5 mt-0.5"
          >
            {isAdding ? (
              <div className="w-2.5 h-2.5 rounded-full border border-foreground/30 border-t-foreground/80 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5 text-foreground/60 transition-colors group-hover:text-foreground/90" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* Quick-Add Modal */}
      {showModal && (
        <QuickAddModal product={product} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
