"use client";

import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShopifyProduct } from "@/lib/shopify-admin";

export default function PremiumTreeRoot({ products, showText = true }: { products: ShopifyProduct[], showText?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 55,
    damping: 26,
    restDelta: 0.001,
  });

  // ── Trunk & Growth ──────────────────────────────────────
  const growthProgress = useTransform(smoothProgress, [0.05, 0.75], [0, 1]);
  const trunkOpacity = useTransform(smoothProgress, [0.05, 0.15, 0.85, 0.95], [0, 1, 1, 0]);
  const trunkScale   = useTransform(smoothProgress, [0.08, 0.45], [0.6, 1]);

  // ── Title ──────────────────────────────────────────────
  const titleOpacity = useTransform(smoothProgress, [0.05, 0.20, 0.80, 0.95], [0, 1, 1, 0]);
  const titleY       = useTransform(smoothProgress, [0.05, 0.25], [40, 0]);

  // ── Main Product sliding along trunk ──────────────────
  const productY       = useTransform(smoothProgress, [0.15, 0.70], [540, -20]);
  const productOpacity = useTransform(smoothProgress, [0.15, 0.28, 0.60, 0.75], [0, 1, 1, 0]);
  const productScale   = useTransform(smoothProgress, [0.15, 0.30, 0.60, 0.75], [0.1, 1, 1, 0.1]);
  const blurAmount     = useTransform(smoothProgress, [0.10, 0.25, 0.65, 0.75], [16, 0, 0, 16]);
  const blurFilter     = useTransform(blurAmount, (v) => `blur(${v}px)`);

  // ── Branches ──────────────────────────────────────────
  const branchOpacity = useTransform(smoothProgress, [0.30, 0.45, 0.88, 0.98], [0, 1, 1, 0]);
  const branchPath    = useTransform(smoothProgress, [0.35, 0.80], [0, 1]);

  if (!products.length) return null;

  const mainProduct  = products[0];
  const sideProducts = products.slice(1, 12); // Show more products

  return (
    <div ref={containerRef} className="relative w-full h-[700vh] flex flex-col items-center">
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">

        {/* Title */}
        <motion.div
          style={{ opacity: titleOpacity, y: titleY }}
          className="absolute top-12 sm:top-24 text-center z-20 px-6 pointer-events-none"
        >
          <span className="text-[7px] font-extralight uppercase tracking-[0.6em] text-foreground/20">
            ZICA BELLA EVOLUTION
          </span>
          <h2 className="font-heading text-[12px] sm:text-sm uppercase tracking-[0.25em] text-foreground/80 mt-2 font-light">
            THE ORGANIC CYCLE
          </h2>
        </motion.div>

        {/* 3D Organic Tree Visualization */}
        <div className="relative w-full max-w-[95vw] sm:max-w-[700px] aspect-[4/5] sm:aspect-square flex items-center justify-center px-2">
          <svg viewBox="0 0 400 500" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="treeGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.05" />
                <stop offset="50%" stopColor="currentColor" stopOpacity="0.15" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.25" />
              </linearGradient>
            </defs>

            {/* ── Main Trunk - Organic Multi-line ── */}
            {[0.5, -0.5, 0].map((offset, i) => (
              <motion.path
                key={`trunk-${i}`}
                d={`
                  M ${200 + offset} 490
                  C ${215 + offset} 450, ${185 + offset} 410, ${200 + offset} 370
                  C ${215 + offset} 330, ${186 + offset} 295, ${200 + offset} 255
                  C ${214 + offset} 215, ${186 + offset} 178, ${200 + offset} 138
                  C ${215 + offset} 98,  ${184 + offset} 62,  ${200 + offset} 22
                `}
                fill="none"
                stroke="url(#treeGradient)"
                strokeWidth={i === 2 ? "1.8" : "0.8"}
                strokeLinecap="round"
                strokeDasharray={i === 2 ? "" : "2 4"}
                style={{
                  pathLength: growthProgress,
                  opacity: trunkOpacity,
                  scaleX: trunkScale,
                  originY: "bottom",
                }}
              />
            ))}

            {/* ── Organic Branches ── */}
            {[
               { d: "M 200 365 C 170 350, 140 330, 90 325 C 60 320, 30 330, 20 320", w: "1.2" },
               { d: "M 200 325 C 230 310, 260 290, 310 285 C 340 280, 370 290, 380 280", w: "1.2" },
               { d: "M 200 245 C 160 230, 130 210, 80 205 C 50 200, 20 210, 10 200", w: "1.0" },
               { d: "M 200 200 C 240 180, 270 160, 320 155 C 350 150, 380 160, 390 150", w: "1.0" },
               { d: "M 200 140 C 170 120, 140 100, 100 95 C 70 90, 40 100, 30 90", w: "0.8" },
               { d: "M 200 100 C 230 80, 260 60, 300 55 C 330 50, 360 60, 370 50", w: "0.8" },
            ].map((b, i) => (
              <motion.path
                key={`branch-${i}`}
                d={b.d}
                fill="none"
                stroke="currentColor"
                strokeWidth={b.w}
                strokeLinecap="round"
                className="text-foreground/15"
                style={{ pathLength: branchPath, opacity: branchOpacity }}
              />
            ))}

            {/* ── Leaf Elements (Buds of Growth) ── */}
            {[
              [110, 322], [295, 280], [112, 198], [292, 154], [120, 100], [286, 60],
              [50, 310], [355, 270], [50, 182], [356, 138], [54, 77], [352, 40]
            ].map(([cx, cy], i) => (
              <motion.circle
                key={`leaf-${i}`}
                cx={cx} cy={cy} r="1.5"
                fill="currentColor"
                className="text-foreground/10"
                style={{ scale: branchPath, opacity: branchOpacity }}
              />
            ))}
          </svg>

          {/* Main scrolling product */}
          <motion.div
            style={{
              opacity: productOpacity,
              scale: productScale,
              y: productY,
              x: "-50%",
              left: "50%",
              filter: blurFilter,
            }}
            className="absolute z-50 pointer-events-auto flex flex-col items-center"
          >
            <ProductBubble product={mainProduct} size="large" />
          </motion.div>

          {/* Side Products (Side Growth) */}
          <div className="absolute inset-0 z-30 pointer-events-none">
            {sideProducts.map((p, i) => (
              <TreePoint key={p.id} product={p} index={i} total={sideProducts.length} smoothProgress={smoothProgress} showText={showText} />
            ))}
          </div>
        </div>

        {/* Ambient background evolution */}
        <div className="absolute inset-0 pointer-events-none -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--foreground-rgb),0.02)_0%,transparent_70%)]" />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
function TreePoint({
  product,
  index,
  total,
  smoothProgress,
  showText = true,
}: {
  product: ShopifyProduct;
  index: number;
  total: number;
  smoothProgress: MotionValue<number>;
  showText?: boolean;
}) {
  const positions = [
    { left: "8%",   top: "64%", start: 0.35, end: 0.75 },
    { right: "8%",  top: "56%", start: 0.40, end: 0.80 },
    { left: "14%",  top: "40%", start: 0.45, end: 0.85 },
    { right: "14%", top: "30%", start: 0.50, end: 0.90 },
    { left: "35%",  top: "12%", start: 0.60, end: 0.95 },
    { right: "35%", top: "12%", start: 0.62, end: 0.97 },
    { left: "2%",   top: "50%", start: 0.42, end: 0.82 },
    { right: "2%",  top: "42%", start: 0.46, end: 0.86 },
    { left: "10%",  top: "20%", start: 0.55, end: 0.92 },
    { right: "10%", top: "15%", start: 0.58, end: 0.94 },
    { left: "45%",  top: "4%",  start: 0.65, end: 0.98 },
  ];
  const pos = positions[index] ?? positions[0];

  const opacity = useTransform(
    smoothProgress,
    [pos.start, pos.start + 0.10, pos.end, pos.end + 0.10],
    [0, 1, 1, 0]
  );
  const scale = useTransform(
    smoothProgress,
    [pos.start, pos.start + 0.10, pos.end],
    [0.35, 1, 1]
  );

  return (
    <motion.div
      style={{ opacity, scale, left: pos.left, right: pos.right, top: pos.top }}
      className="absolute pointer-events-auto"
    >
      <ProductBubble product={product} showText={showText} />
    </motion.div>
  );
}

function ProductBubble({
  product,
  size = "small",
  showText = true,
}: {
  product: ShopifyProduct;
  size?: "small" | "large";
  showText?: boolean;
}) {
  const dim    = size === "large" ? "w-[72px] h-[72px] sm:w-[130px] sm:h-[130px]" : "w-[44px] h-[44px] sm:w-[76px] sm:h-[76px]";
  const label  = size === "large" ? "text-[7px] sm:text-[8px]" : "text-[5px] sm:text-[6px]";
  const radius = size === "large" ? "rounded-[1.3rem] sm:rounded-[1.8rem]" : "rounded-[0.9rem] sm:rounded-[1.4rem]";

  return (
    <Link href={`/products/${product.handle}`} className="block group">
      <motion.div
        whileHover={{ scale: 1.1, rotateZ: 3.5, transition: { type: "spring", stiffness: 380, damping: 14 } }}
        whileTap={{ scale: 0.9 }}
        className={`${dim} ${radius} relative shadow-xl`}
        style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 100%)",
          border: "1px solid rgba(255,255,255,0.14)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <div className={`w-full h-full ${radius} overflow-hidden relative`}>
          <Image
            src={product.images?.[0]?.src || "/placeholder.png"}
            alt={product.title}
            fill
            sizes="130px"
            className="object-cover opacity-85 group-hover:opacity-100 transition-all duration-600 group-hover:scale-108"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        </div>

        {showText && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            whileHover={{ opacity: 1, y: 0 }}
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-max pointer-events-none"
          >
            <span
              className={`${label} font-extralight uppercase tracking-[0.32em] text-foreground px-3 py-1 rounded-full`}
              style={{
                background: "hsla(var(--glass-bg), 0.88)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid hsla(var(--glass-border), 0.09)",
              }}
            >
              {product.title}
            </span>
          </motion.div>
        )}
      </motion.div>
    </Link>
  );
}
