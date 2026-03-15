"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const faqs = [
  {
    category: "About & Products",
    questions: [
      {
        q: "What is Zica Bella?",
        a: "Zica Bella is a premium Indian luxury streetwear brand offering oversized T-shirts, baggy jeans, acid-wash apparel, and bold urban fashion inspired by global street culture."
      },
      {
        q: "Are the products unisex?",
        a: "Yes, Zica Bella apparel is designed to be unisex and suitable for all genders, focusing on universal streetwear silhouettes."
      },
      {
        q: "Are your drops limited?",
        a: "Yes, many Zica Bella drops are limited edition to ensure exclusivity and may not be restocked once sold out."
      }
    ]
  },
  {
    category: "Sizing & Fit",
    questions: [
      {
        q: "How does the sizing work?",
        a: "Most Zica Bella T-shirts are designed with an intended oversized streetwear fit. For a true oversized look, select your regular size. Sizing down will give a more fitted, relaxed look."
      },
      {
        q: "Do you have a size guide?",
        a: "Yes, a detailed size chart with exact measurements is available on every product page to help you find your perfect fit."
      }
    ]
  },
  {
    category: "Shipping & Orders",
    questions: [
      {
        q: "Do you offer Cash on Delivery (COD)?",
        a: "Yes, Cash on Delivery (COD) is available on eligible orders across India."
      },
      {
        q: "How long does delivery take?",
        a: "Delivery usually takes 3–7 business days depending on your location in India."
      },
      {
        q: "Can I cancel or change my order?",
        a: "Address changes or cancellations may be possible before dispatch. Please contact customer support immediately with your order details."
      }
    ]
  },
  {
    category: "Returns & Exchanges",
    questions: [
      {
        q: "What is your return policy?",
        a: "Eligible products can be returned according to our return policy. Items must be unworn, unwashed, and have original tags attached."
      },
      {
        q: "How are refunds processed?",
        a: "Refunds are usually processed within standard banking timelines after the returned item is received and approved by our quality team."
      }
    ]
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-transparent text-foreground selection:bg-foreground selection:text-background flex flex-col">
      
      <main className="flex-1 flex flex-col items-center pt-32 pb-24 px-6 sm:px-12">
        <div className="w-full max-w-3xl">
          {/* Header text */}
          <div className="text-center mb-16 space-y-4">
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl tracking-widest uppercase">FAQ</h1>
            <p className="text-muted-foreground tracking-widest text-xs sm:text-sm uppercase font-light">
              Frequently Asked Questions
            </p>
          </div>

          {/* Accordion Wrapper */}
          <div className="space-y-12">
            {faqs.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-4">
                <h2 className="font-rocaston text-lg tracking-[0.2em] uppercase text-muted-foreground/60 mb-6 border-b border-foreground/10 pb-2">
                  {group.category}
                </h2>
                
                <div className="space-y-2">
                  {group.questions.map((item, index) => {
                    const id = `${groupIndex}-${index}`;
                    const isOpen = openIndex === id;

                    return (
                      <div 
                        key={index} 
                        className={`group border border-foreground/5 bg-foreground/[0.02] rounded-2xl overflow-hidden transition-all duration-500 hover:border-foreground/10 ${
                          isOpen ? "bg-foreground/[0.04] border-foreground/20" : ""
                        }`}
                      >
                        <button
                          onClick={() => toggleAccordion(id)}
                          className="w-full flex items-center justify-between px-6 py-5 text-left focus:outline-none"
                        >
                          <span className={`font-sans text-sm sm:text-base tracking-wide font-medium transition-colors ${isOpen ? 'text-foreground' : 'text-foreground/80'}`}>
                            {item.q}
                          </span>
                          <motion.div
                            animate={{ rotate: isOpen ? 45 : 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-foreground/10 text-foreground' : 'bg-transparent text-muted-foreground group-hover:bg-foreground/5'}`}
                          >
                            <Plus className="w-4 h-4" />
                          </motion.div>
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                              <div className="px-6 pb-6 pt-2 text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
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
            ))}
          </div>

          {/* Contact Fallback */}
          <div className="mt-24 p-8 sm:p-12 rounded-[2.5rem] bg-foreground/5 border border-foreground/5 text-center space-y-4 glass">
            <h3 className="font-rocaston text-xl tracking-[0.2em] uppercase">Still have questions?</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
              If you couldn't find the answer you were looking for, our support team is available to assist you.
            </p>
            <div className="pt-4">
              <a 
                href="mailto:support@zicabella.com" 
                className="inline-block px-8 py-3 bg-foreground text-background text-xs tracking-widest uppercase font-semibold rounded-full hover:scale-105 transition-transform"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
