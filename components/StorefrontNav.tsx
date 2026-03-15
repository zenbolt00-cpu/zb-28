"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/",       icon: Home,        label: "Home",    isCart: false },
  { href: "/search", icon: Search,      label: "Search",  isCart: false },
  { href: "/cart",   icon: ShoppingBag, label: "Cart",    isCart: true  },
  { href: "/login",  icon: User,        label: "Profile", isCart: false },
];

export default function StorefrontNav() {
  const pathname = usePathname();
  const { count } = useCart();
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

  return (
    <div
      className="fixed bottom-0 left-0 w-full z-50 pb-safe pointer-events-none transition-all duration-300"
      style={{ transform: hidden ? "translateY(120%)" : "translateY(0)", opacity: hidden ? 0 : 1 }}
    >
      <div className="max-w-md mx-auto px-5 pb-5">
        <nav
          className="flex justify-around items-center py-2 px-3 pointer-events-auto rounded-[2rem]"
          style={{
            background: "hsla(var(--glass-bg), 0.65)",
            backdropFilter: "blur(40px) saturate(200%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
            boxShadow: "inset 0 0 0 1px hsla(var(--glass-border), 0.10), inset 0 1px 0 hsla(255,255,255,0.07), 0 8px 32px -4px rgba(0,0,0,0.2)",
          }}
        >
          {navItems.map(({ href, icon: Icon, label, isCart }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`relative flex flex-col items-center gap-0.5 px-5 py-2 rounded-2xl transition-all duration-400 active:scale-75 ${
                  isActive ? "text-foreground" : "text-foreground/30 hover:text-foreground/60"
                }`}
              >
                <Icon
                  className="w-[18px] h-[18px]"
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span
                  className="text-[7px] uppercase tracking-[0.12em] transition-all"
                  style={{
                    fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                    fontWeight: isActive ? 500 : 300,
                    opacity: isActive ? 0.7 : 0.4,
                  }}
                >
                  {label}
                </span>
                {isActive && (
                  <span
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: "hsla(var(--foreground), 0.5)" }}
                    aria-hidden
                  />
                )}
                {isCart && count > 0 && (
                  <span
                    className="absolute top-1.5 right-3 w-3.5 h-3.5 rounded-full bg-foreground flex items-center justify-center text-background font-bold shadow"
                    style={{ fontSize: "7px", lineHeight: 1 }}
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
