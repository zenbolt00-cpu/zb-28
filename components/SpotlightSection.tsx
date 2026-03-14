"use client";

import Link from "next/link";
import NextImage from "next/image";
import { ArrowRight } from "lucide-react";

const SPOTLIGHT_ITEMS = [
  {
    title: "Air Jordan 1",
    image: "https://images.unsplash.com/photo-1584735175315-9d5df238006d?q=80&w=400&h=400&auto=format",
    href: "/search?q=jordan"
  },
  {
    title: "Air Force 1",
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=400&h=400&auto=format",
    href: "/search?q=air+force"
  },
  {
    title: "Graphic Tees",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400&h=400&auto=format",
    href: "/search?q=graphic"
  },
  {
    title: "Pegasus 41",
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=400&h=400&auto=format",
    href: "/search?q=pegasus"
  },
  {
    title: "Tights",
    image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=400&h=400&auto=format",
    href: "/search?q=tights"
  },
  {
    title: "Metcon",
    image: "https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=400&h=400&auto=format",
    href: "/search?q=metcon"
  }
];

export default function SpotlightSection() {
  return (
    <section className="mt-16 mb-20 px-4">
      <div className="text-center mb-12">
        <h2 className="font-heading text-[32px] tracking-tight text-foreground mb-4 uppercase">SPOTLIGHT</h2>
        <p className="text-[11px] text-muted-foreground max-w-[280px] mx-auto leading-relaxed tracking-wider font-extralight uppercase">
          Classic silhouettes and cutting-edge innovation to build your game from the ground up.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-x-2 gap-y-10 group/grid">
        {SPOTLIGHT_ITEMS.map((item, idx) => (
          <Link 
            key={idx} 
            href={item.href}
            className="flex flex-col items-center gap-4 group/item active:scale-95 transition-all duration-500"
          >
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-foreground/[0.02] flex items-center justify-center border border-foreground/[0.03] group-hover/item:border-foreground/10 transition-colors">
              <NextImage 
                src={item.image} 
                alt={item.title} 
                fill 
                className="object-contain p-2 mix-blend-multiply dark:mix-blend-normal opacity-90 group-hover/item:opacity-100 group-hover/item:scale-110 transition-all duration-700"
              />
            </div>
            <span className="text-[9px] font-medium tracking-[0.15em] text-foreground/70 uppercase group-hover/item:text-foreground transition-colors">
              {item.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
