"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const activeItem = scrollRef.current.querySelector('[data-active="true"]');
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentHandle]);

  return (
    <div 
      className="mb-3 px-1.5 py-2 rounded-[2rem] border border-foreground/[0.03] overflow-hidden group"
      style={{ 
        background: "hsla(var(--glass-bg), 0.25)",
        backdropFilter: "blur(30px) saturate(210%)"
      }}
    >
      {/* High-Fidelity Carousel — Uniform Navigation */}
      <div className="relative">
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-3 pb-1 hide-scrollbar snap-x px-3 items-center"
        >
          {allCollections.map((col: any) => {
            const isActive = col.handle === currentHandle;
            return (
              <Link 
                key={col.handle} 
                href={`/collections/${col.handle}`}
                data-active={isActive}
                className={`relative shrink-0 snap-center transition-all duration-1000 w-[82vw] ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-70 blur-[0.2px]'}`}
              >
                <div className={`relative aspect-[21/9] rounded-[1.5rem] overflow-hidden border transition-all duration-1000 ${isActive ? 'border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-1 ring-white/20' : 'border-foreground/5 shadow-none'}`}>
                  {col.image?.src ? (
                    <Image 
                      src={col.image.src} 
                      alt={col.title} 
                      fill 
                      className={`object-cover transition-transform duration-[3000ms] ${isActive ? 'scale-105' : 'scale-100'}`} 
                      priority={isActive}
                    />
                  ) : (
                    <div className="w-full h-full bg-foreground/[0.05] flex items-center justify-center">
                      <span className="text-[6px] font-black uppercase tracking-widest opacity-10">{col.title}</span>
                    </div>
                  )}
                  
                  {/* Persistent Rocaston Title Overlay */}
                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${isActive ? 'bg-black/25' : 'bg-black/40'}`}>
                    <span 
                      className={`text-[11px] sm:text-[13px] font-rocaston font-bold uppercase tracking-[0.4em] text-white/95 text-center px-4 leading-relaxed transition-all duration-1000 ${isActive ? 'drop-shadow-2xl scale-100' : 'opacity-80 scale-95'}`}
                    >
                      {col.title}
                    </span>
                  </div>

                  {/* Glass Selection Shine */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/10 pointer-events-none" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
