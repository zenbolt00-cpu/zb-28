import { searchProducts, fetchCollections } from "@/lib/shopify-admin";
import { Search } from "lucide-react";
import { ShopifyProduct } from "@/lib/shopify-admin";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; min?: string; max?: string };
}) {
  const query = searchParams.q?.trim() || "";
  const sortBy = searchParams.sort || "relevance";
  const minPrice = parseFloat(searchParams.min || "0");
  const maxPrice = parseFloat(searchParams.max || "999999");

  let products: ShopifyProduct[] = [];
  if (query) {
    try {
      const raw = await searchProducts(query, 48);
      products = raw.filter((p) => {
        const price = parseFloat(p.variants?.[0]?.price || "0");
        return price >= minPrice && price <= maxPrice;
      });

      if (sortBy === "price-asc") {
        products.sort((a, b) => parseFloat(a.variants?.[0]?.price || "0") - parseFloat(b.variants?.[0]?.price || "0"));
      } else if (sortBy === "price-desc") {
        products.sort((a, b) => parseFloat(b.variants?.[0]?.price || "0") - parseFloat(a.variants?.[0]?.price || "0"));
      }
    } catch (e) {
      console.error("Search failed:", e);
      products = [];
    }
  }

  const collections = await fetchCollections().catch(() => []);

  return (
    <div className="min-h-screen">

      <div className="relative z-10 max-w-md mx-auto px-2 pb-32 pt-header">

        {/* Search Bar */}
        <form method="GET" action="/search" className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search Zica Bella…"
              autoFocus={!query}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-foreground placeholder-foreground/30 focus:outline-none transition-all"
              style={{
                background: "hsla(var(--glass-bg), 0.55)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid hsla(var(--glass-border), 0.1)",
              }}
            />
          </div>

          {/* Filters row */}
          {query && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {[
                { label: "Relevance", value: "relevance" },
                { label: "Price ↑", value: "price-asc" },
                { label: "Price ↓", value: "price-desc" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="submit"
                  name="sort"
                  value={opt.value}
                  className={`px-3 py-1.5 rounded-full text-[9px] uppercase tracking-widest transition-all ${
                    sortBy === opt.value
                      ? "bg-foreground text-background"
                      : "text-foreground/50 border border-foreground/10 hover:border-foreground/20"
                  }`}
                  style={sortBy !== opt.value ? { background: "hsla(var(--glass-bg), 0.4)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" } : {}}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Results header */}
        {query && (
          <div className="flex justify-between items-center mb-5">
            <div>
              <h1 className="font-heading text-[11px] text-foreground/80 uppercase tracking-widest">
                "{query}"
              </h1>
              <p className="text-[8px] text-muted-foreground/50 mt-0.5 font-inter font-medium uppercase tracking-widest">
                {products.length} {products.length === 1 ? "result" : "results"}
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!query && (
          <div className="text-center pt-20 pb-8">
            <Search className="w-12 h-12 text-foreground/10 mx-auto mb-4" />
            <p className="font-heading text-[10px] uppercase tracking-widest text-foreground/30">
              Find Your Style
            </p>
            <p className="text-[8px] font-extralight text-muted-foreground/30 mt-2 tracking-widest uppercase">
              Search by product name or type
            </p>
          </div>
        )}

        {/* No results */}
        {query && products.length === 0 && (
          <div className="text-center pt-12">
            <p className="font-heading text-[10px] uppercase tracking-widest text-foreground/30">No results found</p>
            <p className="text-[8px] font-extralight text-muted-foreground/30 mt-2 uppercase tracking-widest">
              Try a different search term
            </p>
          </div>
        )}

        {/* Product Grid */}
        {products.length > 0 && (
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
