import { fetchCollectionByHandle, fetchEnabledCollections } from "@/lib/shopify-admin";
import { ShopifyProduct } from "@/lib/shopify-admin";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { notFound } from "next/navigation";

import CollectionHeaderClient from "@/components/CollectionHeaderClient";

export const dynamic = "force-dynamic";

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: { handle: string };
  searchParams: { sort?: string; min?: string; max?: string };
}) {
  const { collection, products: rawProducts } = await fetchCollectionByHandle(
    params.handle,
    48
  );
  
  const allCollections = await fetchEnabledCollections('page');

  if (!collection) notFound();

  const sortBy = searchParams.sort || "featured";
  const minPrice = parseFloat(searchParams.min || "0");
  const maxPrice = parseFloat(searchParams.max || "999999");

  // ... rest of filtering logic ...
  let products = rawProducts.filter((p) => {
    const price = parseFloat(p.variants?.[0]?.price || "0");
    return price >= minPrice && price <= maxPrice;
  });

  if (sortBy === "price-asc") {
    products = [...products].sort(
      (a, b) => parseFloat(a.variants?.[0]?.price || "0") - parseFloat(b.variants?.[0]?.price || "0")
    );
  } else if (sortBy === "price-desc") {
    products = [...products].sort(
      (a, b) => parseFloat(b.variants?.[0]?.price || "0") - parseFloat(a.variants?.[0]?.price || "0")
    );
  } else if (sortBy === "newest") {
    products = [...products].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  }

  return (
    <div className="min-h-screen">

      <div className="relative z-10 max-w-md mx-auto px-2 pb-32 pt-header">

        {/* Back navigation */}
        <div className="mb-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[7px] uppercase tracking-[0.15em] text-muted-foreground/45 hover:text-foreground/70 transition-colors mb-4 active:scale-95" style={{ fontFamily: "'HeadingPro', sans-serif" }}>
            <ChevronLeft className="w-3 h-3" />
            Collections
          </Link>

          <CollectionHeaderClient 
            currentHandle={params.handle}
            currentTitle={collection.title}
            allCollections={allCollections}
            currentImage={collection.image?.src}
          />
        </div>

        {/* Filter/Sort Bar */}
        <form method="GET" className="mb-8">
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "Featured",  value: "featured"   },
              { label: "Newest",    value: "newest"     },
              { label: "Price ↑",   value: "price-asc"  },
              { label: "Price ↓",   value: "price-desc" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="submit"
                name="sort"
                value={opt.value}
                className={`px-2.5 py-1.5 rounded-full text-[7px] uppercase tracking-[0.1em] transition-all ${
                  sortBy === opt.value
                    ? "bg-foreground text-background"
                    : "text-foreground/45 border border-foreground/10"
                }`}
                style={
                  sortBy !== opt.value
                    ? { 
                        background: "hsla(var(--glass-bg), 0.5)", 
                        backdropFilter: "blur(12px)", 
                        WebkitBackdropFilter: "blur(12px)",
                        fontFamily: "'HeadingPro', sans-serif" 
                      }
                    : { fontFamily: "'HeadingPro', sans-serif" }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </form>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-heading text-[10px] uppercase tracking-widest text-foreground/25">
              No products found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-1 gap-y-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
