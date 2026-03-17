import { fetchEnabledCollections } from "@/lib/shopify-admin";
import prisma from "@/lib/db";
import Link from "next/link";
import { ChevronLeft, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface AccessoryItem {
  id: string;
  title?: string;
  price?: string;
  description?: string;
  image?: string;
  gallery?: string[];
  link?: string;
}

export default async function AccessoriesCollectionPage() {
  // Get ring items from shop settings
  const shop = await prisma.shop.findFirst().catch(() => null);
  const s = (shop as any) || {};

  let items: AccessoryItem[] = [];
  try {
    const rawItems = s?.ringCarouselItems;
    if (rawItems) {
      const parsed = JSON.parse(rawItems);
      if (Array.isArray(parsed)) items = parsed;
    }
  } catch (e) {
    // empty
  }

  const ringCarouselTitle = s?.ringCarouselTitle || "RING COLLECTION";

  const allCollections = await fetchEnabledCollections("page").catch(() => []);

  const formatPrice = (price?: string) => {
    if (!price) return null;
    const num = parseFloat(price);
    if (isNaN(num)) return price;
    return "₹" + num.toLocaleString("en-IN");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative z-10 max-w-md mx-auto px-2 pb-32 pt-header">

        {/* Back nav */}
        <div className="mb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[7px] uppercase tracking-[0.15em] text-muted-foreground/45 hover:text-foreground/70 transition-colors mb-4 active:scale-95"
          >
            <ChevronLeft className="w-3 h-3" />
            Collections
          </Link>

          {/* Header Card */}
          <div
            className="mb-6 p-4 rounded-[2.5rem] border border-foreground/[0.03]"
            style={{
              background: "hsla(var(--glass-bg), 0.65)",
              backdropFilter: "blur(40px) saturate(210%) brightness(1.02)",
            }}
          >
            {/* Banner */}
            <div className="mb-5 select-none">
              <div
                className="relative w-full h-36 rounded-2xl overflow-hidden border border-foreground/[0.04]"
                style={{ background: "rgba(0,0,0,0.04)" }}
              >
                {items[0]?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={items[0].image}
                    alt={ringCarouselTitle}
                    className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal p-4"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-heading text-[10px] uppercase tracking-[0.2em] text-foreground/15">
                      {ringCarouselTitle}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3">
                  <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-white/70">{ringCarouselTitle}</span>
                </div>
              </div>
            </div>

            {/* Collection Pills */}
            <div className="flex overflow-x-auto gap-1.5 pb-0.5 hide-scrollbar snap-x">
              <Link
                href="/collections/accessories"
                className="relative shrink-0 snap-start px-3.5 py-1.5 rounded-full text-[7px] uppercase font-bold tracking-[0.1em] text-background bg-foreground"
              >
                Accessories
              </Link>
              {allCollections.slice(0, 6).map((col: any) => (
                <Link
                  key={col.handle}
                  href={`/collections/${col.handle}`}
                  className="shrink-0 snap-start px-3.5 py-1.5 rounded-full text-[7px] uppercase font-bold tracking-[0.1em] text-foreground/40 hover:text-foreground/70 bg-foreground/[0.03] border border-foreground/[0.01] transition-colors"
                >
                  {col.title}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-heading text-[10px] uppercase tracking-widest text-foreground/25">
              No accessories configured yet
            </p>
            <Link
              href="/dashboard/accessories"
              className="inline-flex items-center gap-1.5 mt-4 text-[8px] uppercase tracking-widest text-foreground/40 hover:text-foreground/70 transition-colors"
            >
              Manage accessories <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-1 gap-y-5">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/accessories/${item.id}`}
                className="group flex flex-col"
              >
                {/* Image */}
                <div className="aspect-square rounded-[1.25rem] overflow-hidden bg-foreground/[0.02] border border-foreground/[0.03] flex items-center justify-center p-3 mb-2">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.title || "Ring"}
                      className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-foreground/[0.03]" />
                  )}
                </div>

                {/* Meta */}
                <div className="px-1">
                  {item.title && (
                    <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-foreground/70 truncate group-hover:text-foreground transition-colors">
                      {item.title}
                    </p>
                  )}
                  {item.price && (
                    <p className="text-[8px] font-medium text-foreground/40 mt-0.5">
                      {formatPrice(item.price)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
