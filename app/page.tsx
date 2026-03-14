import { fetchProducts, fetchEnabledCollections, fetchPolicies } from "@/lib/shopify-admin";
import prisma from "@/lib/db";
import NextImage from "next/image";
import Link from "next/link";
import { ChevronRight, Instagram, Youtube, Music2, Disc } from "lucide-react";
import CollectionCarousel from "@/components/CollectionCarousel";
import PremiumTreeRoot from "@/components/PremiumTreeRoot";
import ProductCard from "@/components/ProductCard";
import { ShopifyProduct } from "@/lib/shopify-admin";
import NeuralProductMesh from "@/components/NeuralProductMesh";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Gracefully handle Shopify API errors — show empty state instead of crashing
  const [products, collections, shop, policies] = await Promise.all([
    fetchProducts(24).catch(() => [] as ShopifyProduct[]),
    fetchEnabledCollections('header').catch(() => []),
    prisma.shop.findFirst().catch(() => null),
    fetchPolicies().catch(() => []),
  ]);

  const s = shop as any;

  const heroTitle      = s?.heroTitle       || "Redefine The Standard";
  const heroSubtitle   = s?.heroSubtitle    || "Explore the latest drops tailored for the relentless.";
  const heroButtonText = s?.heroButtonText  || "Discover";
  const heroImage      = s?.heroImage       || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop";
  const heroVideo      = s?.heroVideo;
  const latestTitle    = s?.latestCurationTitle    || "Latest Curation";
  const latestSubtitle = s?.latestCurationSubtitle || "Season Drop";
  const archiveTitle   = s?.archiveTitle    || "The Archive";
  const archiveSubtitle = s?.archiveSubtitle || "Organic Evolution";
  const blueprintTitle = s?.blueprintTitle  || "The Blueprint";
  const blueprintSub   = s?.blueprintSubtitle || "Technique & Motion";
  const collectionsMedia = s?.collectionsMedia;
  const featuredMedia  = s?.featuredMedia;
  const featuredMediaImage = s?.featuredMediaImage;
  const footerVideo    = s?.footerVideo;
  const kineticHandles = s?.kineticMeshProducts ? s.kineticMeshProducts.split(',').map((h: string) => h.trim()) : [];

  const socialLinks = [
    { url: s?.instagramUrl, icon: Instagram, label: "Instagram" },
    { url: s?.appleUrl,     icon: Disc,      label: "Apple Music" },
    { url: s?.spotifyUrl,   icon: Music2,    label: "Spotify" },
    { url: s?.youtubeUrl,   icon: Youtube,   label: "YouTube" },
  ].filter((item) => item.url);

  return (
    <>
      <div className="relative z-10 max-w-[410px] mx-auto px-2 pb-32 pt-header">

        {/* ═══ HERO ═══ */}
        <section className="relative w-full h-[98svh] sm:aspect-[4/5] sm:h-auto rounded-[1.2rem] overflow-hidden -mt-4 sm:mt-2 mb-3 group shadow-xl bg-muted z-10">
          {heroVideo ? (
            <video src={heroVideo} autoPlay loop muted playsInline
              className="absolute inset-0 w-full h-full object-cover transition-all duration-1000"
            />
          ) : (
            <NextImage src={heroImage} alt="Hero" fill priority
              className="object-cover brightness-90 group-hover:brightness-100 transition-all duration-1000"
            />
          )}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%)" }}
          />
          {s?.showHeroText && (
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/25 to-transparent">
              <h1 className="font-heading text-[14px] mb-2 leading-snug uppercase tracking-wide text-white">
                {heroTitle}
              </h1>
              <p className="text-[7px] text-white/55 max-w-[88%] mb-5 font-extralight leading-relaxed tracking-widest uppercase">
                {heroSubtitle}
              </p>
              <button className="px-8 py-2.5 bg-white text-black text-[8px] font-extralight uppercase tracking-[0.4em] rounded-full hover:bg-white/90 active:scale-95 transition-all shadow-lg">
                {heroButtonText}
              </button>
            </div>
          )}
        </section>

        {/* ═══ SECTION LABEL: Latest ═══ */}
        {s?.showLatestCuration && (
          <div className="flex justify-between items-end mb-3 px-1.5 mt-6">
            <div>
              <p className="text-[7px] font-extralight uppercase tracking-[0.5em] text-muted-foreground/35 mb-1">{latestSubtitle}</p>
              <h2 className="font-heading text-[10px] uppercase tracking-[0.18em] text-foreground/75">{latestTitle}</h2>
            </div>
            <Link href="/search" className="flex items-center gap-1 text-[8px] uppercase tracking-widest text-muted-foreground/50 hover:text-foreground transition-colors mb-[2px]">
              View all <ChevronRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        )}

        {/* ═══ PRODUCT GRID 1 ═══ */}
        <section className="mb-6 px-[1px]">
          <div className="grid grid-cols-2 gap-x-1 gap-y-5">
            {products.slice(0, 4).map((p: ShopifyProduct, idx: number) => (
              <ProductCard key={p.id} product={p} priority={idx < 4} />
            ))}
          </div>
        </section>

        {/* ═══ ABOVE-COLLECTION MEDIA ═══ */}
        {collectionsMedia && (
          <section className="mb-4 relative w-full aspect-video rounded-[1rem] overflow-hidden bg-muted shadow-lg border border-foreground/5">
            <video src={collectionsMedia} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
          </section>
        )}

        {/* ═══ COLLECTIONS CAROUSEL ═══ */}
        <section className="py-12 -mx-2">
          {s?.showArchive && (
            <div className="flex justify-center mb-6 px-4">
              <span className="text-[7px] font-extralight uppercase tracking-[0.9em] text-muted-foreground/22">— {archiveTitle} —</span>
            </div>
          )}
          <CollectionCarousel collections={collections} />
          {s?.showArchive && (
            <div className="flex justify-center mt-6 mb-2">
              <span className="text-[7px] font-extralight uppercase tracking-[0.4em] text-muted-foreground/18">{archiveSubtitle}</span>
            </div>
          )}
        </section>

        {/* ═══ PRODUCT GRID 2 ═══ */}
        <section className="mb-6 px-[1px]">
          <div className="grid grid-cols-2 gap-x-1 gap-y-5">
            {products.slice(4, 8).map((p: ShopifyProduct) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* ═══ FEATURED MEDIA ═══ */}
        {(featuredMedia || featuredMediaImage || heroVideo) && (
          <section className="mb-4 relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden bg-muted border border-foreground/[0.03]">
            {featuredMedia || heroVideo ? (
              <video 
                src={featuredMedia || heroVideo} 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="w-full h-full object-cover" 
              />
            ) : featuredMediaImage ? (
              <NextImage
                src={featuredMediaImage}
                alt="Featured Highlight"
                fill
                className="w-full h-full object-cover"
                priority
              />
            ) : null}
            
            {s?.showBlueprint && (
              <div className="absolute inset-x-0 bottom-0 p-8 text-center z-10">
                <h3 className="font-heading text-[10px] uppercase tracking-[0.3em] text-foreground mb-1.5">{blueprintSub}</h3>
                <p className="text-[8px] font-extralight uppercase tracking-[0.2em] text-foreground/40">{blueprintTitle}</p>
              </div>
            )}
          </section>
        )}

        {/* ═══ KINETIC MESH ═══ */}
        <section className="mb-6 -mx-2">
          <NeuralProductMesh 
            products={kineticHandles.length > 0 
              ? products.filter((p: ShopifyProduct) => kineticHandles.includes(p.handle))
              : products.slice(8, 16)
            } 
          />
        </section>

        {/* ═══ PRODUCT GRID 3 ═══ */}
        <section className="mb-12 px-[1px]">
          <div className="grid grid-cols-2 gap-x-1 gap-y-5">
            {products.slice(12, 16).map((p: ShopifyProduct) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* ═══ NEW PREMIUM SPOTLIGHT (Image-based as requested) ═══ */}
        <section className="mb-12 relative w-full aspect-[4/5] rounded-[2.5rem] overflow-hidden group shadow-2xl border border-white/10">
          <NextImage 
            src={heroImage || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1020&auto=format&fit=crop"} 
            alt="Spotlight" 
            fill 
            className="object-cover transition-transform duration-[2s] group-hover:scale-110" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-center">
            <h4 className="text-[9px] uppercase tracking-[0.6em] text-white/50 mb-3 animate-pulse">Eternal Collection</h4>
            <h2 className="font-heading text-[22px] text-white mb-6 leading-tight tracking-tight">
              THE ART OF <br /> PERSISTENCE
            </h2>
            <button className="island-blur border-white/20 px-10 py-3 rounded-full text-[9px] uppercase tracking-[0.4em] text-white hover:bg-white/10 active:scale-95 transition-all">
              Explore Now
            </button>
          </div>
        </section>

        {/* ═══ VIDEO FEATURE (Missing Section Restore) ═══ */}
        {footerVideo && (
          <section className="mb-12 relative w-full aspect-video rounded-[1.5rem] overflow-hidden shadow-xl border border-foreground/5">
            <video 
              src={footerVideo} 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover grayscale opacity-60 contrast-125" 
            />
            <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]">
              <div className="text-center">
                <p className="text-[8px] uppercase tracking-[0.8em] text-foreground/40 mb-2 font-light">Zica Bella Motion</p>
                <div className="w-12 h-0.5 bg-foreground/10 mx-auto" />
              </div>
            </div>
          </section>
        )}

      </div>
    </>
  );
}
