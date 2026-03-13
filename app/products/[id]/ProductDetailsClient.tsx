"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ShoppingBag, Loader2, Bookmark, X } from "lucide-react";
import { ShopifyProduct } from "@/lib/shopify-admin";
import { parseShopifyRichText, matchKey } from "@/lib/utils";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/cart-context";
import { useBookmarks } from "@/lib/bookmark-context";
import { useRecentlyViewed } from "@/lib/recently-viewed-context";
import dynamic from "next/dynamic";

const CheckoutWebView = dynamic(() => import("@/components/CheckoutWebView"), { ssr: false });
const OrderSuccess = dynamic(() => import("@/components/OrderSuccess"), { ssr: false });

interface ShopSettings {
  showProductVideo: boolean;
  showSizeChart: boolean;
  showBrand: boolean;
  showShippingReturn: boolean;
  showCare: boolean;
  showSizeFit: boolean;
  showDetails: boolean;
  pdpBackground?: string;
}

export default function ProductDetailsClient({ 
  product, 
  shopSettings, 
  recommendedProducts = [],
  allImages = []
}: { 
  product: ShopifyProduct; 
  shopSettings?: ShopSettings | null;
  recommendedProducts?: ShopifyProduct[];
  allImages?: any[];
}) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("details");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);
  const [activeImg, setActiveImg] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [winHeight, setWinHeight] = useState(800);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);

  // Refs for scroll sync — avoids fragile querySelector
  const bgScrollRef = useRef<HTMLDivElement>(null);
  const galleryScrollRef = useRef<HTMLDivElement>(null);

  const { add: addToCart } = useCart();
  const { toggleBookmark, isBookmarked, setIsOpen } = useBookmarks();
  const { addProduct: recordVisit, recentlyViewed } = useRecentlyViewed();

  useEffect(() => {
    setWinHeight(window.innerHeight);
    recordVisit(product);
  }, [product, recordVisit]);

  // Optimized Scroll Effects for Safari
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scroll = window.scrollY;
          setScrollPos(scroll);
          
          const overlay = document.getElementById('pdp-blur-overlay-internal');
          if (overlay) {
            const opacity = Math.min(scroll / 600, 0.4);
            overlay.style.backgroundColor = `rgba(0,0,0, ${opacity})`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Robust helper to get metafield by key (case-insensitive, space/hyphen agnostic)
  const getMeta = (key: string) => {
    if (!product.metafields) return null;
    const found = product.metafields.find(m => matchKey(m.key, key));
    return found?.value;
  };

  const sizes = product.variants
    ?.map(v => v.option1) // Assuming option1 is Size
    .filter((v, i, a) => v && a.indexOf(v) === i) || [];

  const handleAddToBag = () => {
    if (!selectedSize && sizes.length > 0) {
      alert("Please select a size first!");
      return;
    }

    const variant = product.variants.find(v => v.option1 === selectedSize) || product.variants[0];

    addToCart({
      productId: product.id.toString(),
      handle: product.handle,
      variantId: variant.id.toString(),
      title: product.title,
      size: selectedSize,
      price: variant.price,
      image: product.image?.src || product.images[0]?.src || "/placeholder.png"
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = async () => {
    if (!selectedSize && sizes.length > 0) {
      alert("Please select a size first!");
      return;
    }

    const variant = product.variants.find((v) => v.option1 === selectedSize) || product.variants[0];

    setIsCheckingOut(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/shopify/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ variantId: variant.id.toString(), quantity: 1 }],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) throw new Error(data.error || "Checkout failed");
      setCheckoutUrl(data.checkoutUrl);
    } catch (err: any) {
      setCheckoutError(err.message || "Something went wrong");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const initialPrice = product.variants?.[0]?.price || "0.00";
  const comparePrice = product.variants?.[0]?.compare_at_price;
  const productVideoUrl = getMeta('product-video');
  const sizeChartImageUrl = getMeta('size-chart-image');
  
  const tabs = [
    { id: 'details', label: 'Description', show: shopSettings?.showDetails ?? true },
    { id: 'more-details', label: 'Details', show: (shopSettings?.showDetails ?? true) && !!getMeta('DETAILS') },
    { id: 'size-fit', label: 'Size & Fit', show: (shopSettings?.showSizeFit ?? true) && !!getMeta('SIZE & FIT') },
    { id: 'care', label: 'Care', show: (shopSettings?.showCare ?? true) && !!getMeta('CARE') },
    { id: 'shipping', label: 'Shipping & Return', show: (shopSettings?.showShippingReturn ?? true) && !!getMeta('SHIPPING & RETURN') },
    { id: 'brand', label: 'Brand', show: (shopSettings?.showBrand ?? true) && !!getMeta('BRAND') },
  ].filter(t => t.show);

  return (
    <>
      {/* FIXED SNAP BACKGROUND */}
      <div className="fixed top-0 left-0 w-full h-[100dvh] z-0 overflow-hidden bg-background">
        <div
          ref={bgScrollRef}
          className={`h-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pointer-events-auto transition-transform duration-500`}
          style={{ 
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            pointerEvents: scrollPos > 50 ? 'none' : 'auto',
            touchAction: scrollPos > 50 ? 'auto' : 'pan-x' 
          }}
          onScroll={(e) => {
            const target = e.currentTarget;
            const index = Math.round(target.scrollLeft / target.clientWidth);
            if (activeImg !== index) setActiveImg(index);
          }}
        >
          {allImages.map((img, i) => {
            // Memory Optimization: Only render current image and its neighbors
            const isNear = Math.abs(activeImg - i) <= 1;
            if (!isNear) return <div key={`bg-${i}`} className="w-full h-full flex-shrink-0 snap-start" />;
            
            return (
              <div 
                key={`bg-${img.src}`} 
                className="w-full h-full flex-shrink-0 snap-start relative"
                onClick={() => setIsGalleryOpen(true)}
              >
                <Image
                  src={img.src}
                  alt={product.title}
                  fill
                  className="object-cover transition-opacity duration-700"
                  priority={i === activeImg}
                  sizes="100vw"
                  quality={90}
                />
              </div>
            );
          })}
        </div>
        <div id="pdp-blur-overlay-internal" className="absolute inset-0 z-10 pointer-events-none" />
      </div>

      <main className="relative z-20 pt-[82dvh] sm:pt-[75dvh]">
        <div 
          className="min-h-[120vh] rounded-t-[1.1rem] px-2 pt-7 pb-32 border-t border-foreground/[0.08] shadow-2xl"
          style={{ 
            background: "hsla(var(--glass-bg), 0.94)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 -20px 80px -10px hsla(var(--glass-shadow), 0.35)"
          }}
        >
          {/* Image Variants/Thumbnails - Vibrant Glass Theme */}
          <div className="flex overflow-x-auto gap-2.5 mb-4 pb-1 hide-scrollbar snap-x px-1">
            {allImages.map((img, i) => (
              <button
                key={`thumb-${img.src || i}`}
                onClick={() => {
                  setActiveImg(i);
                  // Use ref for reliable scroll sync
                  bgScrollRef.current?.scrollTo({ left: i * window.innerWidth, behavior: 'smooth' });
                }}
                className={`relative w-[52px] h-[52px] rounded-[0.8rem] overflow-hidden flex-shrink-0 snap-start border transition-all duration-500 shadow-sm outline-none ${
                  activeImg === i 
                    ? "border-foreground/50 scale-105 shadow-lg shadow-foreground/5 opacity-100 ring-1 ring-foreground/10" 
                    : "border-foreground/5 opacity-60 hover:opacity-90"
                }`}
              >
                <Image src={img.src} alt="variant" fill className="object-cover" sizes="60px" quality={75} />
              </button>
            ))}
          </div>

          <div className="flex justify-between items-start mb-4 px-1" onClick={() => setIsGalleryOpen(true)}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-[20px] sm:text-[24px] font-bold tracking-tighter leading-[1] text-foreground">
                  {product.title}
                </h1>
                {comparePrice && parseFloat(comparePrice) > parseFloat(initialPrice) && (
                  <div className="bg-foreground text-background px-1.5 py-[1px] rounded-[2px] leading-none mb-1">
                    <span className="text-[6px] font-bold uppercase tracking-tighter whitespace-nowrap">Sale</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-foreground/40 tracking-tight">₹{parseFloat(initialPrice).toLocaleString('en-IN')}</span>
                {comparePrice && parseFloat(comparePrice) > parseFloat(initialPrice) && (
                  <span className="text-[10px] font-light text-foreground/15 line-through tracking-wider">₹{parseFloat(comparePrice).toLocaleString('en-IN')}</span>
                )}
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmark(product);
                setIsOpen(true);
              }}
              className="w-8 h-8 rounded-full bg-foreground/5 border border-foreground/5 flex items-center justify-center hover:bg-foreground/10 transition-all active:scale-90"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked(product.id.toString()) ? "text-primary fill-primary" : "text-foreground/40"}`} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Size Section - Ultra Tiny */}
            {sizes.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[7px] font-bold uppercase tracking-[0.4em] text-foreground/20">Select Size</span>
                  {(shopSettings?.showSizeChart ?? true) && sizeChartImageUrl && (
                    <button onClick={() => setShowSizeChart(true)} className="text-[7px] font-bold text-foreground/20 hover:text-foreground transition-all uppercase tracking-[0.2em] border-b border-foreground/5">
                      Guide
                    </button>
                  )}
                </div>
                <div className="flex overflow-x-auto gap-1.5 pb-0.5 hide-scrollbar snap-x">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-5 py-2 rounded-[0.5rem] text-[8px] font-bold uppercase tracking-widest transition-all snap-start border ${
                        selectedSize === size
                          ? "bg-foreground text-background border-transparent shadow-sm scale-[1.02]"
                          : "bg-foreground/[0.03] border-foreground/5 text-foreground/25 hover:bg-foreground/[0.06]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-0.5">
              <button
                onClick={handleAddToBag}
                disabled={isAdded}
                className="w-full py-3.5 rounded-[0.8rem] flex items-center justify-center text-[9px] font-bold text-foreground/80 uppercase tracking-[0.25em] hover:text-foreground transition-all active:scale-[0.99] shadow-sm"
                style={{
                  background: isAdded ? "hsla(var(--glass-bg), 0.5)" : "hsla(var(--glass-bg), 0.3)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: isAdded ? "1px solid hsla(var(--foreground), 0.1)" : "1px solid hsla(var(--glass-border), 0.08)",
                  color: isAdded ? "hsla(var(--foreground), 0.4)" : "inherit"
                }}
              >
                <AnimatePresence mode="wait">
                  {isAdded ? (
                    <motion.span
                      key="added"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-2"
                    >
                      Added to Bag!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="add"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      Add to Bag
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              <button
                onClick={handleBuyNow}
                disabled={isCheckingOut}
                className="w-full py-3.5 rounded-[0.8rem] text-background text-[9px] font-bold uppercase tracking-[0.25em] hover:opacity-90 transition-all active:scale-[0.99] shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                style={{
                  background: "hsl(var(--foreground))",
                  boxShadow: "0 8px 32px -8px hsla(var(--foreground), 0.3)"
                }}
              >
                {isCheckingOut ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Preparing…</>
                ) : (
                  "Buy Now"
                )}
              </button>
              {checkoutError && (
                <p className="text-[8px] text-red-400/80 text-center mt-1 px-2">{checkoutError}</p>
              )}
            </div>

            <div 
              className="mt-1 p-3 rounded-[1.2rem]"
              style={{
                background: "hsla(var(--glass-bg), 0.2)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid hsla(var(--glass-border), 0.06)"
              }}
            >
              <div className="flex overflow-x-auto hide-scrollbar gap-1.5 mb-3.5 px-0.5">
                {tabs.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`shrink-0 px-3 py-1.5 rounded-full text-[7px] font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? "bg-foreground/10 text-foreground/90 shadow-inner" : "text-foreground/30 hover:text-foreground/60 bg-transparent"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
              <div 
                className="rounded-[0.9rem] p-3.5"
                style={{
                  background: "hsla(var(--glass-bg), 0.3)",
                  boxShadow: "inset 0 2px 10px hsla(var(--glass-shadow), 0.05)"
                }}
              >
                {activeTab === "details" ? (
                  <div className="relative">
                    <div className={`text-[9.5px] font-light leading-[1.6] tracking-wide text-foreground/60 space-y-3 ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`} dangerouslySetInnerHTML={{ __html: product.body_html || "" }} />
                    <button onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} className="mt-3.5 px-4 py-1.5 rounded-full text-[7px] font-bold uppercase tracking-[0.2em] transition-all"
                      style={{
                        background: "hsla(var(--glass-bg), 0.4)",
                        border: "1px solid hsla(var(--glass-border), 0.1)",
                        color: "hsla(var(--foreground), 0.6)"
                      }}
                    >
                      {isDescriptionExpanded ? "Collapse -" : "Expand +"}
                    </button>
                  </div>
                ) : (
                  tabs.map(tab => activeTab === tab.id && (
                    <div key={tab.id} className="animate-in fade-in duration-700 text-[9.5px] font-light leading-[1.6] text-foreground/60" dangerouslySetInnerHTML={{ __html: parseShopifyRichText(getMeta(tab.label.toUpperCase())) }} />
                  ))
                )}
              </div>
            </div>

            {/* Video Reference */}
            {(shopSettings?.showProductVideo ?? true) && productVideoUrl && (
              <div className="mt-4">
                <span className="text-[7.5px] font-bold uppercase tracking-[0.4em] text-foreground/20 ml-1 mb-4 block">Experimental Reference</span>
                <div className="aspect-[9/16] rounded-[2.2rem] overflow-hidden bg-foreground/[0.02] border border-foreground/[0.05] shadow-inner">
                  <video key={productVideoUrl} autoPlay loop muted={isMuted} playsInline className="w-full h-full object-cover">
                    <source src={productVideoUrl} type="video/mp4" />
                  </video>
                </div>
              </div>
            )}

            {/* Recommended Products */}
            {recommendedProducts.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center justify-between mb-8 px-1">
                  <h2 className="text-[9.5px] font-bold tracking-[0.4em] uppercase text-foreground/30 font-rocaston">Curated Pairs</h2>
                  <Link href="/" className="text-[7.5px] font-bold uppercase tracking-widest text-foreground/20 hover:text-foreground">View Collection</Link>
                </div>
                <div className="grid grid-cols-2 gap-x-1 gap-y-8">
                  {recommendedProducts.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              </div>
            )}

            {/* Recently Viewed */}
            {recentlyViewed.length > 1 && (
              <div className="mt-12 pt-12 border-t border-foreground/[0.05]">
                <div className="flex items-center justify-between mb-8 px-1">
                  <h2 className="text-[9.5px] font-bold tracking-[0.4em] uppercase text-foreground/30 font-rocaston">Recently Viewed</h2>
                </div>
                <div className="grid grid-cols-2 gap-x-1 gap-y-8">
                  {recentlyViewed.filter(p => p.id !== product.id).slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {showSizeChart && sizeChartImageUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60" onClick={() => setShowSizeChart(false)}>
          <div className="relative w-full max-w-sm glass border border-foreground/10 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <span className="text-[8px] font-bold uppercase tracking-widest text-foreground/40">Sizing Reference</span>
              <button onClick={() => setShowSizeChart(false)} className="px-4 py-1.5 rounded-full bg-foreground/5 text-[7px] uppercase tracking-widest font-bold">Dismiss</button>
            </div>
            <img src={sizeChartImageUrl} alt="Size Guide" className="w-full rounded-2xl shadow-inner border border-foreground/5" />
          </div>
        </div>
      )}

      {/* FULL SCREEN GALLERY MODAL */}
      <AnimatePresence>
        {isGalleryOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[200] bg-background flex flex-col"
          >
            {/* Gallery Header */}
            <div className="flex justify-between items-center p-6 pt-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-tighter text-foreground mb-0.5">{product.title}</span>
                <span className="text-[8px] font-medium text-foreground/30 uppercase tracking-widest">{activeImg + 1} of {allImages.length}</span>
              </div>
              <button 
                onClick={() => {
                  setIsGalleryOpen(false);
                }}
                className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center active:scale-90 transition-all"
              >
                <X className="w-4.5 h-4.5 text-foreground/60" />
              </button>
            </div>

            {/* Gallery Main Carousel */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
              <div
                ref={galleryScrollRef}
                className="w-full h-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar"
                style={{ scrollSnapType: 'x mandatory' }}
                onScroll={(e) => {
                  const target = e.currentTarget;
                  const index = Math.round(target.scrollLeft / target.clientWidth);
                  if (activeImg !== index) {
                    setActiveImg(index);
                    // Sync bg scroll via ref
                    bgScrollRef.current?.scrollTo({ left: index * window.innerWidth, behavior: 'auto' });
                  }
                }}
              >
                {allImages.map((img, i) => (
                  <div key={`gallery-${img.src}`} className="w-full h-full flex-shrink-0 snap-start flex items-center justify-center p-2">
                    <div className="relative w-full h-[80dvh]">
                      <Image 
                        src={img.src} 
                        alt={product.title} 
                        fill 
                        className="object-contain" 
                        sizes="100vw"
                        priority={i === activeImg}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gallery Nav Thumbnails */}
            <div className="p-8 pb-12 flex justify-center gap-2">
              {allImages.map((_, i) => (
                <button
                  key={`gal-thumb-${i}`}
                  onClick={() => {
                    galleryScrollRef.current?.scrollTo({ left: i * window.innerWidth, behavior: 'smooth' });
                  }}
                  className={`w-1 h-1 rounded-full transition-all duration-500 ${activeImg === i ? "w-4 bg-foreground" : "bg-foreground/20"}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* In-App Checkout WebView (Buy Now) */}
      {checkoutUrl && (
        <CheckoutWebView
          checkoutUrl={checkoutUrl}
          onSuccess={() => { setCheckoutUrl(null); setShowSuccess(true); }}
          onClose={() => setCheckoutUrl(null)}
        />
      )}

      {/* Order Success Screen */}
      <AnimatePresence>
        {showSuccess && (
          <OrderSuccess
            onContinue={() => {
              setShowSuccess(false);
              setCheckoutUrl(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
