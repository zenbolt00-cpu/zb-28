"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Loader2, Bookmark, X } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/cart-context";

import dynamic from "next/dynamic";

const CheckoutWebView = dynamic(() => import("@/components/CheckoutWebView"), { ssr: false });
const OrderSuccess = dynamic(() => import("@/components/OrderSuccess"), { ssr: false });

export interface AccessoryItem {
  id: string;
  title: string;
  price: string;
  description: string;
  image: string;
  gallery: string[];
  link: string;
}

export default function AccessoryDetailsClient({ item }: { item: AccessoryItem }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("details");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);
  const [activeImg, setActiveImg] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const { add: addToCart } = useCart();
  
  const allImages = useMemo(() => {
    const images = [];
    if (item.image) images.push({ src: item.image });
    if (item.gallery && Array.isArray(item.gallery)) {
      item.gallery.forEach(url => {
        if (url && url !== item.image) images.push({ src: url });
      });
    }
    if (images.length === 0) images.push({ src: "/placeholder.png" });
    return images;
  }, [item]);

  const handleAddToBag = () => {
    addToCart({
      productId: `acc-${item.id}`,
      handle: `acc-${item.id}`,
      variantId: `acc-${item.id}-var`,
      title: item.title,
      size: 'One Size',
      price: item.price || "0.00",
      image: item.image || "/placeholder.png"
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = async () => {
    addToCart({
      productId: `acc-${item.id}`,
      handle: `acc-${item.id}`,
      variantId: `acc-${item.id}-var`,
      title: item.title,
      size: 'One Size',
      price: item.price || "0.00",
      image: item.image || "/placeholder.png"
    });

    router.push("/checkout");
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const galleryScrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const index = Math.round(scrollLeft / clientWidth);
    if (index !== activeImg) setActiveImg(index);
  };

  const tabs = [
    { id: 'details', label: 'Description' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'care', label: 'Care' }
  ];

  return (
    <>
      {/* Native Standard Glass Box Image Carousel */}
      <div className="relative z-10 px-2 pt-[73px] pb-2">
        <div 
          className="relative aspect-[4/6.4] w-full max-w-[500px] mx-auto rounded-[2rem] overflow-hidden shadow-xl border border-foreground/[0.04] group transition-all duration-300"
          style={{
            background: "hsla(var(--glass-bg), 0.1)",
            backdropFilter: "blur(30px)",
            WebkitBackdropFilter: "blur(30px)",
          }}
        >
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar touch-manipulation"
          >
            {allImages.map((img, i) => (
              <div 
                key={`${i}-${img.src}`} 
                onClick={() => setIsGalleryOpen(true)}
                className="relative w-full h-full flex-shrink-0 snap-center snap-always transition-opacity duration-300 cursor-zoom-in"
              >
                <Image
                  src={img.src}
                  alt={item.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 500px"
                  quality={100}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="relative z-20 mt-[1px] product-page px-[1px] pb-[1px]">
        <div 
          className="min-h-[60vh] rounded-[1.2rem] px-[5px] pt-4 pb-[6px] border border-foreground/[0.05]"
          style={{ 
            background: "hsla(var(--glass-bg), 0.94)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 20px 80px -10px hsla(var(--glass-shadow), 0.35)"
          }}
        >
          {/* Image Variants/Thumbnails */}
          <div className="flex overflow-x-auto gap-2.5 mb-3 pb-1 hide-scrollbar snap-x px-1">
            {allImages.map((img, i) => (
              <button
                key={`thumb-${img.src || i}`}
                onClick={() => {
                  setActiveImg(i);
                  scrollRef.current?.scrollTo({
                    left: i * scrollRef.current.clientWidth,
                    behavior: 'smooth'
                  });
                }}
                className={`relative w-[42px] h-[42px] rounded-[0.6rem] overflow-hidden flex-shrink-0 snap-start border transition-all duration-500 shadow-sm outline-none ${
                  activeImg === i 
                    ? "border-foreground/50 scale-105 shadow-lg shadow-foreground/5 opacity-100 ring-1 ring-foreground/10" 
                    : "border-foreground/5 opacity-60 hover:opacity-90"
                }`}
              >
                <Image src={img.src} alt="variant" fill className="object-cover" sizes="60px" quality={75} />
              </button>
            ))}
          </div>

          <div className="flex justify-between items-start mb-2 px-1">
            <div className="flex-1">
              <h1 className="text-[11px] sm:text-[12px] font-bold tracking-[0.25em] uppercase leading-tight text-foreground/90 font-heading mb-1">
                {item.title}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-foreground/40 tracking-tight">₹{parseFloat(item.price || "0").toLocaleString('en-IN')}</span>
              </div>
            </div>
            <button className="w-8 h-8 rounded-full bg-foreground/5 border border-foreground/5 flex items-center justify-center hover:bg-foreground/10 transition-all active:scale-90">
              <Bookmark className="w-3.5 h-3.5 text-foreground/40" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            
            <div className="grid grid-cols-2 gap-2 mt-0.5">
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
                      Added!
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
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> ...</>
                ) : (
                  "Buy Now"
                )}
              </button>
            </div>

            <div 
              className="mt-2 p-2.5 rounded-[1.2rem]"
              style={{
                background: "hsla(var(--glass-bg), 0.2)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid hsla(var(--glass-border), 0.06)"
              }}
            >
              <div className="flex overflow-x-auto hide-scrollbar gap-1.5 mb-2 px-0.5">
                {tabs.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`shrink-0 px-3 py-1.5 rounded-full text-[7px] font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? "bg-foreground/10 text-foreground/90 shadow-inner" : "text-foreground/30 hover:text-foreground/60 bg-transparent"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
              <div 
                className="rounded-[0.9rem] p-2.5"
                style={{
                  background: "hsla(var(--glass-bg), 0.3)",
                  boxShadow: "inset 0 2px 10px hsla(var(--glass-shadow), 0.05)"
                }}
              >
                {activeTab === "details" && (
                  <div className="relative">
                    <p className={`text-[9.5px] font-light leading-[1.6] tracking-wide text-foreground/60 whitespace-pre-wrap ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
                      {item.description || "An elegant accessory."}
                    </p>
                    <button 
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} 
                      className="mt-3 px-3 py-1 rounded-full text-[6px] font-bold uppercase tracking-[0.15em] transition-all bg-foreground/5 border border-foreground/5 text-foreground/40 hover:text-foreground"
                    >
                      {isDescriptionExpanded ? "View Less" : "View More"}
                    </button>
                  </div>
                )}
                {activeTab === "shipping" && (
                  <p className="text-[9.5px] font-light leading-[1.6] tracking-wide text-foreground/60">
                    Complimentary shipping on all orders. Returns are accepted within 7 days of delivery for unworn accessories in their original packaging.
                  </p>
                )}
                {activeTab === "care" && (
                  <p className="text-[9.5px] font-light leading-[1.6] tracking-wide text-foreground/60">
                    Handle with care. Avoid direct contact with varying temperatures, liquids, and rough surfaces to maintain the piece's integrity.
                  </p>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </main>

      {/* FULL SCREEN GALLERY MODAL */}
      <AnimatePresence>
        {isGalleryOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[200] bg-background flex flex-col"
          >
            <div className="flex justify-between items-center p-6 pt-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-tighter text-foreground mb-0.5">{item.title}</span>
                <span className="text-[8px] font-medium text-foreground/30 uppercase tracking-widest">{activeImg + 1} of {allImages.length}</span>
              </div>
              <button 
                onClick={() => setIsGalleryOpen(false)}
                className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center active:scale-90 transition-all"
              >
                <X className="w-4.5 h-4.5 text-foreground/60" />
              </button>
            </div>

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
                  }
                }}
              >
                {allImages.map((img, i) => (
                  <div key={`gallery-${img.src}`} className="w-full h-full flex-shrink-0 snap-start flex items-center justify-center p-2">
                    <div className="relative w-full h-[80dvh]">
                      <Image 
                        src={img.src} 
                        alt={item.title} 
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
