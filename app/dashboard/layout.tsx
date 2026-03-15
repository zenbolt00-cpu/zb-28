"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  ArrowLeftRight, 
  Undo2, 
  ScanLine,
  Settings,
  Bell,
  Users,
  ShoppingBag,
  Newspaper,
} from "lucide-react";

import { useRealtimeSync } from "@/lib/hooks/useRealtime";
import ThemeToggle from "@/components/ThemeToggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useRealtimeSync();

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: BarChart3 },
    { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
    { name: "Customers", href: "/dashboard/customers", icon: Users },
    { name: "Products", href: "/dashboard/products", icon: ShoppingBag },
    { name: "Collections", href: "/dashboard/collections", icon: Package },
    { name: "Inventory", href: "/dashboard/inventory", icon: Package },
    { name: "Community", href: "/dashboard/featured-users", icon: Users },
    { name: "Blogs", href: "/dashboard/blogs", icon: Newspaper },
    { name: "Returns", href: "/dashboard/returns", icon: Undo2 },
    { name: "Exchanges", href: "/dashboard/exchanges", icon: ArrowLeftRight },
    { name: "Scanner", href: "/dashboard/scanner", icon: ScanLine },
  ];

  return (
    <div className="min-h-screen flex text-foreground bg-background transition-colors duration-500">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 glass border-r border-foreground/10 z-50 flex flex-col">
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-foreground/5">
          <Link href="/dashboard" className="flex items-center gap-3.5 group">
            <div className="relative w-10 h-10 flex-shrink-0 bg-foreground/5 rounded-xl flex items-center justify-center border border-foreground/10 group-hover:border-foreground/20 transition-all duration-300 shadow-inner">
              <Image
                src="/zica-bella-logo_8.png"
                alt="Logo"
                fill
                className="object-contain p-1.5 transition-all"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-rocaston text-sm tracking-[0.2em] text-foreground leading-none mb-0.5">ZICA BELLA</span>
              <span className="text-[7px] font-extralight uppercase tracking-[0.4em] text-muted-foreground/30">Admin Portal</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <div className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  isActive 
                    ? "bg-foreground/10 text-foreground ring-1 ring-foreground/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
        
        {/* Settings */}
        <div className="p-3 border-t border-foreground/10">
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
              pathname === '/dashboard/settings'
                ? 'bg-foreground/10 text-foreground ring-1 ring-foreground/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="h-14 glass z-40 sticky top-0 flex flex-shrink-0 items-center justify-between px-8 border-b border-foreground/5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground/80 capitalize">
              {pathname.split('/').filter(Boolean).pop() || 'Overview'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-foreground/10 transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            {/* Admin avatar */}
            <div className="h-7 w-7 rounded-full bg-blue-500/80 flex flex-shrink-0 items-center justify-center border border-foreground/20">
              <span className="text-[10px] font-bold text-white tracking-wider">AD</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
