"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/lib/cart-context";

const navItems = [
  { href: "/",        icon: Home,       label: "Home",    isCart: false },
  { href: "/search",  icon: Search,     label: "Search",  isCart: false },
  { href: "/cart",    icon: ShoppingBag,label: "Cart",    isCart: true  },
  { href: "/login",   icon: User,       label: "Login",   isCart: false },
];

export default function StorefrontNav() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 pb-safe pointer-events-none">
      <div className="max-w-md mx-auto px-6 pb-8">
        <nav className="flex justify-around items-center py-3 px-4 rounded-[2rem] pointer-events-auto ios-tab-bar border border-foreground/[0.08] shadow-2xl">
          {navItems.map(({ href, icon: Icon, label, isCart }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`relative p-2.5 rounded-full transition-all duration-500 active:scale-75 ${
                  isActive ? "text-foreground bg-foreground/5" : "text-foreground/35 hover:text-foreground/70"
                }`}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 1.8} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-foreground shadow-[0_0_8px_rgba(var(--foreground),0.5)]" aria-hidden />
                )}
                {isCart && count > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-foreground flex items-center justify-center text-background font-inter font-bold shadow-lg"
                    style={{ fontSize: "7px", lineHeight: 1 }}>
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
