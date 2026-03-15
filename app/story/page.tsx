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
            <motion.p variants={fadeIn} className="text-xs sm:text-sm tracking-widest uppercase text-muted-foreground/50 mb-6 font-medium font-sans">
              The Genesis
            </motion.p>
            <motion.h1 variants={fadeIn} className="font-sans text-5xl sm:text-6xl md:text-7xl xl:text-8xl tracking-tight leading-tight mb-8 font-medium">
              Redefining <br/> <span className="text-foreground/40 text-4xl sm:text-5xl md:text-6xl xl:text-7xl">The Code.</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed font-sans mt-6">
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
              <motion.h2 variants={fadeIn} className="font-sans text-3xl sm:text-4xl tracking-tight leading-snug font-medium">
                Two Visionaries.<br/> One Rebellion.
              </motion.h2>
              <motion.div variants={fadeIn} className="w-8 h-px bg-foreground/10" />
              <motion.p variants={fadeIn} className="text-muted-foreground leading-relaxed font-light text-sm sm:text-base font-sans">
                Frustrated by the disconnect between fast-fashion imitation and authentic streetwear, the founders of Zica Bella set out to build exactly what they couldn't find—garments with true weight, uncompromising silhouettes, and a narrative grounded in modern Indian youth culture.
              </motion.p>
              <motion.p variants={fadeIn} className="text-muted-foreground leading-relaxed font-light text-sm sm:text-base font-sans">
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
                 <div className="w-12 h-px bg-foreground/10 mb-8" />
                 <p className="font-sans tracking-widest uppercase text-[10px] text-muted-foreground mb-3">Original Archive</p>
                 <h3 className="font-sans text-3xl text-foreground/30 font-light">Z.B.</h3>
                 <div className="w-12 h-px bg-foreground/10 mt-8" />
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
              <motion.span variants={fadeIn} className="text-[10px] tracking-widest uppercase font-medium text-background/50 font-sans">Our Ethos</motion.span>
              <motion.h2 variants={fadeIn} className="font-sans text-4xl md:text-5xl tracking-tight leading-snug font-medium">
                Zero Compromise.<br/> Maximum Impact.
              </motion.h2>
              <motion.p variants={fadeIn} className="text-background/70 leading-relaxed font-light text-sm md:text-base max-w-2xl mx-auto font-sans">
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
            className="font-sans text-2xl md:text-3xl tracking-tight font-medium mb-12"
          >
            Join the Movement
          </motion.p>
          <motion.a 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            href="/collections"
            className="px-10 py-3.5 bg-foreground text-background text-xs uppercase tracking-wider font-semibold rounded-full hover:scale-105 transition-transform"
          >
            View The Archive
          </motion.a>
        </section>
      </main>
    </div>
  );
}
