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
      <div className="max-w-md mx-auto px-6 pb-6">
        <nav className="flex justify-around items-center py-2.5 px-3 rounded-full pointer-events-auto island-blur">
          {navItems.map(({ href, icon: Icon, label, isCart }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`relative p-2 rounded-full transition-all duration-300 active:scale-90 ${
                  isActive ? "text-foreground" : "text-foreground/35 hover:text-foreground/70"
                }`}
              >
                <Icon className="w-[16px] h-[16px]" strokeWidth={isActive ? 2.2 : 1.8} />
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-foreground" aria-hidden />
                )}
                {isCart && count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-foreground flex items-center justify-center text-background font-inter font-bold"
                    style={{ fontSize: "6.5px", lineHeight: 1 }}>
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
