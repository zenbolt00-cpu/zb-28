"use client";

import { motion } from "framer-motion";

const fadeIn = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.3 }
  }
};

export default function StoryPage() {
  return (
    <div className="min-h-screen bg-transparent text-foreground selection:bg-foreground selection:text-background flex flex-col overflow-x-hidden">
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center -mt-20">
          <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen bg-gradient-to-b from-transparent to-background/50">
             {/* Optional background abstract element */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-foreground/5 rounded-full blur-3xl opacity-50" />
          </div>
          
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="relative z-10 text-center px-6 max-w-4xl"
          >
            <motion.p variants={fadeIn} className="text-xs sm:text-sm tracking-[0.4em] uppercase text-muted-foreground/60 mb-6 font-semibold">
              The Genesis
            </motion.p>
            <motion.h1 variants={fadeIn} className="font-heading text-6xl sm:text-7xl md:text-8xl xl:text-9xl uppercase tracking-tighter leading-none mb-8">
              Redefining <br/> <span className="text-foreground/40 italic">The Code.</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed mt-6">
              Zica Bella was born from a singular, uncompromising vision: to elevate emerging Indian street culture into a global luxury phenomenon.
            </motion.p>
          </motion.div>
        </section>

        {/* The Founders Section */}
        <section className="py-32 px-6 sm:px-12 md:px-24">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-32 items-center">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.h2 variants={fadeIn} className="font-rocaston text-3xl sm:text-5xl tracking-[0.2em] uppercase leading-tight">
                Two Visionaries.<br/> One Rebellion.
              </motion.h2>
              <motion.div variants={fadeIn} className="w-12 h-px bg-foreground/20" />
              <motion.p variants={fadeIn} className="text-muted-foreground leading-relaxed font-light text-sm sm:text-base">
                Frustrated by the disconnect between fast-fashion imitation and authentic streetwear, the founders of Zica Bella set out to build exactly what they couldn't find—garments with true weight, uncompromising silhouettes, and a narrative grounded in modern Indian youth culture.
              </motion.p>
              <motion.p variants={fadeIn} className="text-muted-foreground leading-relaxed font-light text-sm sm:text-base">
                What started as late-night sketches and a relentless obsession with high-GSM fabrics quickly evolved into a cult-favorite luxury label. Every acid wash, every seam, and every drop is meticulously curated to disrupt the ordinary.
              </motion.p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative aspect-[3/4] w-full max-w-md mx-auto"
            >
              {/* Glassmorphic placeholder for founder image */}
              <div className="absolute inset-0 bg-foreground/[0.03] backdrop-blur-2xl border border-foreground/10 rounded-3xl overflow-hidden flex flex-col items-center justify-center p-8 text-center glass">
                 <div className="w-16 h-px bg-foreground/20 mb-8" />
                 <p className="font-rocaston tracking-[0.3em] uppercase text-xs text-foreground/40 mb-2">Original Archive</p>
                 <h3 className="font-heading text-5xl uppercase text-foreground/20">Z.B.</h3>
                 <div className="w-16 h-px bg-foreground/20 mt-8" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* The Ethos Section */}
        <section className="py-32 bg-foreground text-background">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="space-y-12"
            >
              <motion.span variants={fadeIn} className="text-xs tracking-[0.4em] uppercase font-semibold text-background/50">Our Ethos</motion.span>
              <motion.h2 variants={fadeIn} className="font-heading text-5xl md:text-7xl uppercase tracking-widest leading-snug">
                Zero Compromise.<br/> Maximum Impact.
              </motion.h2>
              <motion.p variants={fadeIn} className="text-background/70 leading-relaxed font-light text-sm md:text-lg max-w-2xl mx-auto mt-6">
                We believe streetwear isn't just clothing; it's architecture for the human form. By merging heavy-weight luxury Indian cottons with avant-garde draping, we engineer pieces designed to outlast trends and speak volumes in any room.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Final Call to Action */}
        <section className="py-32 px-6 flex flex-col items-center justify-center text-center">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="font-rocaston text-3xl md:text-5xl tracking-[0.2em] uppercase mb-12"
          >
            Join The Movement.
          </motion.p>
          <motion.a 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            href="/collections"
            className="px-12 py-4 bg-foreground text-background text-xs sm:text-sm uppercase tracking-[0.3em] font-bold rounded-full hover:scale-105 transition-transform"
          >
            View The Archive
          </motion.a>
        </section>
      </main>
    </div>
  );
}
