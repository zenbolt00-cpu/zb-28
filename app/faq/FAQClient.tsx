"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

interface FAQ {
  q: string;
  a: string;
}

interface FAQClientProps {
  general: FAQ[];
  seo: FAQ[];
}

export default function FAQClient({ general, seo }: FAQClientProps) {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  const renderSection = (title: string, items: FAQ[], prefix: string) => (
    <div className="space-y-4">
      <h2 className="text-[10px] tracking-[0.2em] font-medium uppercase text-muted-foreground/50 mb-6 border-b border-foreground/5 pb-2 font-sans">
        {title}
      </h2>
      <div className="space-y-1">
        {items.map((item, index) => {
          const id = `${prefix}-${index}`;
          const isOpen = openIndex === id;

          return (
            <div 
              key={index} 
              className={`group border-b border-foreground/5 transition-all duration-300 ${
                isOpen ? "bg-foreground/[0.02]" : "hover:bg-foreground/[0.01]"
              }`}
            >
              <button
                onClick={() => toggleAccordion(id)}
                className="w-full flex items-center justify-between py-6 px-4 text-left focus:outline-none"
              >
                <span className={`font-sans text-sm sm:text-base tracking-[0.01em] transition-colors pr-8 ${isOpen ? 'text-foreground font-medium' : 'text-foreground/70 font-normal'}`}>
                  {item.q}
                </span>
                <motion.div
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`w-6 h-6 flex-shrink-0 flex items-center justify-center transition-colors ${isOpen ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  <Plus className="w-4 h-4 font-light" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="px-4 pb-8 text-sm sm:text-base text-muted-foreground leading-relaxed font-light font-sans max-w-3xl">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent text-foreground selection:bg-foreground selection:text-background flex flex-col font-sans">
      <main className="flex-1 flex flex-col pt-32 pb-24 px-6 sm:px-12 max-w-4xl mx-auto w-full">
        {/* Header text */}
        <div className="mb-20 space-y-4">
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-foreground font-sans">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base font-light max-w-xl leading-relaxed">
            Everything you need to know about Zica Bella, our products, and our premium streetwear philosophy.
          </p>
        </div>

        {/* Accordion Wrapper */}
        <div className="space-y-16">
          {renderSection("General & Orders", general, "gen")}
          {renderSection("Brand & Styling Guide", seo, "seo")}
        </div>

        {/* Contact Fallback */}
        <div className="mt-24 py-12 px-8 rounded-[2rem] bg-foreground/[0.02] border border-foreground/5 text-center space-y-6">
          <h3 className="text-xl font-medium tracking-tight font-sans">Still looking for answers?</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed font-light">
            Our team is available to assist you with any specific inquiries regarding our collections or your orders.
          </p>
          <div className="pt-2">
            <a 
              href="mailto:support@zicabella.com" 
              className="inline-block px-8 py-3.5 bg-foreground text-background text-xs tracking-wider uppercase font-medium rounded-full hover:scale-105 transition-transform"
            >
              Contact Support
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
