"use client";

import { X, Plus, Minus, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  title: string;
  url: string;
  items?: MenuItem[];
}

export default function MenuDrawer({ isOpen, onClose }: MenuDrawerProps) {
  const [mainMenu, setMainMenu] = useState<MenuItem[]>([]);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/shopify/menu")
        .then(res => res.json())
        .then(data => {
          // Combine both menus if they exist, ensuring they are arrays
          const mainItems = Array.isArray(data.mainMenu?.items) ? data.mainMenu.items : [];
          const secondaryItems = Array.isArray(data.secondaryMenu?.items) ? data.secondaryMenu.items : [];
          setMainMenu([...mainItems, ...secondaryItems]);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching menu:", err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  const toggleAccordion = (title: string) => {
    setActiveAccordion(activeAccordion === title ? null : title);
  };

  const isSpecial = (title: string) => {
    return title.toLowerCase().includes('special') || title.toLowerCase().includes('valentine');
  };

  const cleanUrl = (url: string) => {
    if (!url) return "/";
    try {
      // If it's a full shopify URL, make it relative
      if (url.includes(".myshopify.com")) {
        const parts = url.split(".myshopify.com");
        return parts[parts.length - 1] || "/";
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/60"
          />

          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-full max-w-[320px] z-[100] flex flex-col bg-background/80 backdrop-blur-3xl -webkit-backdrop-blur-3xl border-r border-foreground/[0.08] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-end p-5">
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-foreground/5 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-foreground/60" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-7 pb-10 hide-scrollbar">
              {loading ? (
                <div className="space-y-6 pt-4">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-7 w-3/4 bg-foreground/5 animate-pulse rounded-md" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-6 pt-2">
                  <nav className="flex flex-col">
                    {mainMenu.map((item, idx) => {
                      const hasChildren = item.items && item.items.length > 0;
                      const isOpen = activeAccordion === item.title;
                      const special = isSpecial(item.title);

                      return (
                        <div key={`${item.title}-${idx}`} className="flex flex-col">
                          {hasChildren ? (
                            <div>
                              <button
                                onClick={() => toggleAccordion(item.title)}
                                className="w-full flex items-center justify-between py-3.5 group"
                              >
                                <span className={`text-[19px] font-bold tracking-tight text-foreground/90 group-hover:text-foreground transition-colors`}>
                                  {item.title}
                                </span>
                                {isOpen ? (
                                  <Minus className="w-4 h-4 text-foreground/30" />
                                ) : (
                                  <Plus className="w-4 h-4 text-foreground/30" />
                                )}
                              </button>
                              
                              <AnimatePresence>
                                {isOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "circOut" }}
                                    className="overflow-hidden border-l border-foreground/5 ml-1 pl-4 mb-2"
                                  >
                                    <div className="flex flex-col gap-3 py-2">
                                      {item.items?.map((sub, sidx) => (
                                        <Link
                                          key={`${sub.title}-${sidx}`}
                                          href={cleanUrl(sub.url)}
                                          onClick={onClose}
                                          className="text-[14px] font-medium text-foreground/60 hover:text-foreground transition-colors"
                                        >
                                          {sub.title}
                                        </Link>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ) : (
                            <Link 
                              href={cleanUrl(item.url)} 
                              onClick={onClose}
                              className={`py-3.5 text-[19px] font-bold tracking-tight transition-colors ${
                                special ? "text-[#FFB6C1] hover:opacity-80" : "text-foreground/90 hover:text-foreground"
                              }`}
                            >
                              {item.title}
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </nav>

                  {/* Footer Links Section */}
                  <div className="mt-8 pt-12 border-t border-foreground/5 flex flex-col gap-4">
                    <Link 
                      href="/our-story" 
                      onClick={onClose}
                      className="text-[17px] font-bold tracking-tight text-foreground/80 hover:text-foreground transition-colors"
                    >
                      Our Story
                    </Link>
                    <Link 
                      href="/collaborations" 
                      onClick={onClose}
                      className="text-[17px] font-bold tracking-tight text-foreground/80 hover:text-foreground transition-colors"
                    >
                      Collaborations
                    </Link>
                    <Link 
                      href="/login" 
                      onClick={onClose}
                      className="flex items-center gap-3 text-[17px] font-bold tracking-tight text-foreground/80 hover:text-foreground transition-colors mt-2"
                    >
                      <User className="w-5 h-5 text-foreground/60" />
                      Login / Profile
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
