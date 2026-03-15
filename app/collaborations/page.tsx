"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const collaborations = [
  {
    id: 1,
    title: "Zica Bella × Urban Sole",
    category: "Sneaker Drop Event",
    date: "Aero City, New Delhi — October 2025",
    description: "An exclusive invite-only exhibition merging heavy-weight denim aesthetics with rare sneaker curation. The event featured a live DJ set and limited-edition graphic tees designed specifically for the sneakerhead community.",
    imagePlaceholder: "Z.B. × U.S."
  },
  {
    id: 2,
    title: "The Midnight Genesis Studio",
    category: "Pop-Up Experience",
    date: "Bandra West, Mumbai — July 2025",
    description: "A 48-hour pop-up transforming an abandoned warehouse into an immersive Zica Bella showroom. Acid-wash textures and neon installations provided the backdrop for our most successful physical launch to date.",
    imagePlaceholder: "PROJECT M-G"
  },
  {
    id: 3,
    title: "Zica Bella × Vertex Sound",
    category: "Capsule Collection",
    date: "Bangalore — March 2025",
    description: "A crossover between underground techno and luxury streetwear. We designed the official merchandise for Vertex Sound's India tour, featuring utility silhouettes and audio-responsive reflective prints.",
    imagePlaceholder: "AUDIO REACTIVE"
  }
];

export default function CollaborationsPage() {
  return (
    <div className="min-h-screen bg-transparent text-foreground selection:bg-foreground selection:text-background flex flex-col">
      
      <main className="flex-1 pt-32 pb-24 px-6 sm:px-12 max-w-7xl mx-auto w-full">
        {/* Header text */}
        <div className="mb-24 space-y-6 max-w-2xl">
            <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-sans text-4xl sm:text-5xl md:text-6xl tracking-tight font-medium"
          >
            Collaborations <br/> & Events
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="text-muted-foreground text-sm sm:text-base font-light leading-relaxed max-w-lg font-sans mt-4"
          >
            We don't just create garments; we curate culture. Explore our physical pop-ups, cross-brand capsules, and live experiences shaping the Indian streetwear landscape.
          </motion.p>
        </div>

        {/* Collborations List */}
        <div className="space-y-32">
          {collaborations.map((collab, index) => (
            <motion.div 
              key={collab.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="group flex flex-col md:flex-row gap-8 md:gap-16 items-start"
            >
              {/* Media Placeholder (Apple Glass UI) */}
              <div className="w-full md:w-1/2 aspect-[4/3] bg-foreground/[0.02] border border-foreground/5 rounded-[2rem] overflow-hidden relative glass">
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center transition-transform duration-700 group-hover:scale-105">
                   <div className="w-8 h-px bg-foreground/10 mb-6" />
                   <p className="font-sans text-xl sm:text-2xl tracking-tighter font-medium text-foreground/30">
                     {collab.imagePlaceholder}
                   </p>
                   <div className="w-8 h-px bg-foreground/10 mt-6" />
                </div>
              </div>

              {/* Content */}
              <div className="w-full md:w-1/2 flex flex-col justify-center h-full space-y-5 py-4 font-sans">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-foreground/[0.03] border border-foreground/5 text-[10px] uppercase tracking-wider font-medium text-foreground/60">
                      {collab.category}
                    </span>
                  </div>
                  <h2 className="font-sans text-2xl sm:text-3xl tracking-tight font-medium leading-tight">
                    {collab.title}
                  </h2>
                </div>
                
                <p className="text-xs tracking-widest text-muted-foreground/60 font-medium uppercase">
                  {collab.date}
                </p>
                
                <p className="text-sm sm:text-base text-muted-foreground font-light leading-relaxed">
                  {collab.description}
                </p>

                <div className="pt-2">
                  <button className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-foreground hover:opacity-70 transition-opacity">
                    View Gallery <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
