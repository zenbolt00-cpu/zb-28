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
      <div className="max-w-[380px] mx-auto px-6 pb-8">
        <nav className="flex justify-around items-center py-3.5 px-4 rounded-[2.5rem] pointer-events-auto island-blur backdrop-blur-[40px] bg-white/70 dark:bg-black/40 border-white/20 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
          {navItems.map(({ href, icon: Icon, label, isCart }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`relative p-3 rounded-2xl transition-all duration-500 ease-spring active:scale-90 ${
                  isActive 
                    ? "text-foreground bg-foreground/5" 
                    : "text-foreground/40 hover:text-foreground/70 hover:bg-foreground/3"
                }`}
              >
                <Icon className={`w-[19px] h-[19px] transition-transform duration-500 ${isActive ? 'scale-110' : 'scale-100'}`} 
                  strokeWidth={isActive ? 2.5 : 1.5} 
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-foreground shadow-[0_0_8px_rgba(0,0,0,0.1)]" aria-hidden />
                )}
                {isCart && count > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-sm"
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
