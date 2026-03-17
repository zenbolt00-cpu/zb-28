"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, User, MessageCircle } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

export default function StorefrontNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { count } = useCart();

  const navItems = [
    { href: "/",       icon: Home,        label: "Home",    isCart: false },
    { href: "/search", icon: Search,      label: "Search",  isCart: false },
    { href: "/chat",   icon: MessageCircle, label: "Chat",    isCart: false },
    { href: "/cart",   icon: ShoppingBag, label: "Cart",    isCart: true  },
    { href: session ? "/profile" : "/login",  icon: User,        label: "Profile", isCart: false },
  ];
  const [hidden, setHidden] = useState(false);

  // Hide when QuickAdd modal opens, restore when it closes
  useEffect(() => {
    const hide = () => setHidden(true);
    const show = () => setHidden(false);
    window.addEventListener("quickadd:open", hide);
    window.addEventListener("quickadd:close", show);
    return () => {
      window.removeEventListener("quickadd:open", hide);
      window.removeEventListener("quickadd:close", show);
    };
  }, []);

    const isChatPage = pathname === "/chat";
  
    return (
      <div
        className="fixed bottom-0 left-0 w-full z-50 transition-all duration-300 pointer-events-none"
        style={{ 
          transform: (hidden || isChatPage) ? "translateY(120%)" : "translateY(0)", 
          opacity: (hidden || isChatPage) ? 0 : 1,
          paddingBottom: "env(safe-area-inset-bottom, 0px)"
        }}
      >
      <div className="w-full px-2 sm:max-w-xl sm:mx-auto mb-3">
        <nav
          className="flex justify-around items-center py-2 px-7 pointer-events-auto rounded-[2.5rem]"
          style={{
            background: "hsla(var(--glass-bg), 0.78)",
            backdropFilter: "blur(40px) saturate(210%)",
            WebkitBackdropFilter: "blur(40px) saturate(210%)",
            border: "1px solid hsla(var(--glass-border), 0.1)",
            boxShadow: "0 12px 48px -12px rgba(0,0,0,0.4), inset 0 1px 1px hsla(var(--foreground), 0.08)",
          }}
        >
          {navItems.map(({ href, icon: Icon, label, isCart }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            const isProfile = label === "Profile" && session;
            const profileImage = session?.user?.image || (session as any)?.customer?.image;

            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl transition-all duration-400 active:scale-75 ${
                  isActive ? "text-foreground" : "text-foreground/30 hover:text-foreground/60"
                }`}
              >
                {isProfile && profileImage ? (
                  <div className={`w-[18px] h-[18px] rounded-full overflow-hidden border ${isActive ? 'border-foreground/60' : 'border-transparent'}`}>
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <Icon
                    className="w-[17px] h-[17px]"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                )}
                <span
                   className="text-[6.5px] uppercase tracking-[0.16em] transition-all"
                  style={{
                    fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                    fontWeight: isActive ? 600 : 400,
                    opacity: isActive ? 0.9 : 0.5,
                  }}
                >
                  {label}
                </span>
                {isActive && (
                  <motion.span
                    layoutId="active-nav-indicator"
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full"
                    style={{ background: "hsla(var(--foreground), 0.8)" }}
                    aria-hidden
                  />
                )}
                {isCart && count > 0 && (
                  <span
                    className="absolute top-0.5 right-1 w-3 h-3 rounded-full bg-foreground flex items-center justify-center text-background font-black shadow-md border-[0.5px] border-background"
                    style={{ fontSize: "6px", lineHeight: 1 }}
                  >
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
