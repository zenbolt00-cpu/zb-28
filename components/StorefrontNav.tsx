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
      }}
    >
      <div className="w-full px-4 sm:max-w-xl sm:mx-auto mb-[1px]">
        <nav
          className="grid grid-cols-5 items-center py-2.5 px-1 pointer-events-auto rounded-[2.25rem]"
          style={{
            background: "hsla(var(--glass-bg), 0.8)",
            backdropFilter: "blur(40px) saturate(210%)",
            WebkitBackdropFilter: "blur(40px) saturate(210%)",
            border: "1px solid hsla(var(--glass-border), 0.08)",
            boxShadow: "0 10px 40px -10px rgba(0,0,0,0.35), inset 0 0.5px 0 0 hsla(var(--foreground), 0.05)",
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
                className={`relative flex flex-col items-center justify-center h-9 w-full transition-all duration-300 active:scale-75 ${
                  isActive ? "text-foreground" : "text-foreground/25 hover:text-foreground/50"
                }`}
              >
                {isProfile && profileImage ? (
                  <div className={`w-[19px] h-[19px] rounded-full overflow-hidden border ${isActive ? 'border-foreground/40' : 'border-transparent'}`}>
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <Icon
                    className="w-[18px] h-[18px]"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                )}
                
                {/* Minimal Dot Indicator instead of text labels */}
                {isActive && (
                  <motion.span
                    layoutId="active-nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: "hsla(var(--foreground), 0.8)" }}
                    aria-hidden
                  />
                )}
                
                {isCart && count > 0 && (
                  <span
                    className="absolute top-1 right-1/2 translate-x-3 w-3.5 h-3.5 rounded-full bg-foreground flex items-center justify-center text-background font-black shadow-lg border-[0.5px] border-background"
                    style={{ fontSize: "6.5px", lineHeight: 1 }}
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
