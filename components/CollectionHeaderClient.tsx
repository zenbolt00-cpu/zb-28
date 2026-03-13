"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

interface CollectionHeaderClientProps {
  currentHandle: string;
  currentTitle: string;
  allCollections: any[];
  currentImage?: string;
}

export default function CollectionHeaderClient({ 
  currentHandle, 
  currentTitle, 
  allCollections,
  currentImage
}: CollectionHeaderClientProps) {
  return (
    <div 
      className="mb-6 p-4 rounded-[2.5rem] island-blur border border-foreground/[0.03]"
      style={{ 
        background: "hsla(var(--glass-bg), 0.65)",
        backdropFilter: "blur(40px) saturate(210%) brightness(1.02)"
      }}
    >
      {/* Minimal Collection Branding (Compact Banner Overlay) */}
      <div className="mb-5 flex justify-center select-none">
        <div className="relative w-40 h-20 rounded-2xl overflow-hidden shadow-xl shadow-black/5 border border-foreground/[0.04]">
          {currentImage ? (
            <Image 
              src={currentImage} 
              alt={currentTitle} 
              fill 
              className="object-cover transition-transform duration-700 hover:scale-110" 
              priority
            />
          ) : (
            <div className="w-full h-full bg-foreground/[0.03] flex items-center justify-center p-4">
              <span className="font-heading text-[10px] uppercase tracking-[0.2em] text-foreground/15 text-center leading-tight">
                {currentTitle}
              </span>
            </div>
          )}
          
          {/* Subtle Glass Polish Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-black/5 opacity-50 pointer-events-none" />
        </div>
      </div>

      {/* Collection Selection Pills */}
      <div className="relative">
        <div className="flex overflow-x-auto gap-1.5 pb-0.5 hide-scrollbar snap-x">
          {allCollections.map((col: any) => {
            const isActive = col.handle === currentHandle;
            return (
              <Link 
                key={col.handle} 
                href={`/collections/${col.handle}`}
                className="relative shrink-0 snap-start"
              >
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  className={`px-3.5 py-1.5 rounded-full text-[7px] uppercase font-bold tracking-[0.1em] transition-all duration-300 flex items-center justify-center ${
                    isActive 
                      ? "text-background" 
                      : "text-foreground/40 hover:text-foreground/70 bg-foreground/[0.03] border border-foreground/[0.01]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-foreground rounded-full z-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{col.title}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
