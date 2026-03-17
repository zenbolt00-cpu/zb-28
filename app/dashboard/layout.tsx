"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  ArrowLeftRight, 
  Undo2, 
  ScanLine,
  Settings,
  Bell,
  Monitor,
  BoxSelect,
  Layers,
  Users,
  ShoppingBag,
  Newspaper,
  Search,
  Menu,
  FileText,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useRealtimeSync } from "@/lib/hooks/useRealtime";
import ThemeToggle from "@/components/ThemeToggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  useRealtimeSync();

  // Close sidebar on path change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const coreNav = [
    { name: "Overview", href: "/dashboard", icon: BarChart3 },
    { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
    { name: "Customers", href: "/dashboard/customers", icon: Users },
    { name: "Products", href: "/dashboard/products", icon: ShoppingBag },
  ];

  const operationalNav = [
    { name: "Collections", href: "/dashboard/collections", icon: Package },
    { name: "Inventory", href: "/dashboard/inventory", icon: BoxSelect },
    { name: "Scanner", href: "/dashboard/inventory/scanner", icon: ScanLine },
    { name: "Scanner Records", href: "/dashboard/scanner-records", icon: FileText },
    { name: "Returns", href: "/dashboard/returns", icon: Undo2 },
    { name: "Exchanges", href: "/dashboard/exchanges", icon: ArrowLeftRight },
    { name: "Accessories", href: "/dashboard/accessories", icon: ShoppingBag },
  ];

  const aestheticNav = [
    { name: "Storefront", href: "/dashboard/storefront", icon: Monitor },
    { name: "Visuals", href: "/dashboard/3d-content", icon: Layers },
    { name: "Chat Management", href: "/dashboard/community/chat", icon: MessageSquare },
    { name: "Community", href: "/dashboard/community", icon: Users },
    { name: "Blogs", href: "/dashboard/blogs", icon: Newspaper },
  ];

  const NavLink = ({ item }: { item: any }) => {
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
    const Icon = item.icon;
    return (
      <Link 
        href={item.href}
        className={`group flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-300 ${
          isActive 
            ? "bg-foreground text-background" 
            : "text-foreground/60 hover:text-foreground hover:bg-foreground/[0.03]"
        }`}
      >
        <Icon className={`w-3.5 h-3.5 ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100 transition-opacity'}`} strokeWidth={1.5} />
        <span className={`text-[10px] uppercase tracking-[0.15em] font-medium`}>
          {item.name}
        </span>
      </Link>
    );
  };

  const isLoginPage = pathname === '/dashboard/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex text-foreground bg-[#FAFAFA] dark:bg-[#0A0A0A] font-sans selection:bg-foreground/20 selection:text-foreground">
      
      {/* Siri Aura Glow Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Existing Grid */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.02] dark:opacity-[0.04]" />
        
        {/* Siri Glowing Orbs */}
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[140px] mix-blend-normal dark:mix-blend-screen" style={{ animation: 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
        <div className="absolute top-[10%] -right-[20%] w-[50%] h-[70%] bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-[150px] mix-blend-normal dark:mix-blend-screen" style={{ animation: 'pulse 12s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
        <div className="absolute -bottom-[20%] left-[10%] w-[70%] h-[60%] bg-pink-500/10 dark:bg-pink-600/15 rounded-full blur-[160px] mix-blend-normal dark:mix-blend-screen" style={{ animation: 'pulse 10s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[55] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Ultra-Minimal Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 border-r border-foreground/[0.05] bg-background/80 backdrop-blur-xl z-[60] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:pointer-events-auto`}>
        <div className="flex flex-col h-full px-4 py-8">
          
          {/* Brand Identity */}
          <div className="mb-10 px-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-foreground text-background rounded-md flex items-center justify-center">
                 <Image
                  src="/zica-bella-logo_8.png"
                  alt="Logo"
                  width={14}
                  height={14}
                  className="invert dark:invert-0"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase leading-none">Zica Bella</span>
                <span className="text-[8px] tracking-[0.3em] uppercase text-foreground/40 mt-1">Admin OS</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2">
            <div>
              <div className="mb-3 px-2">
                 <span className="text-[8px] font-bold text-foreground/30 uppercase tracking-[0.3em]">Core Flow</span>
              </div>
              <div className="space-y-0.5">
                {[...coreNav].map(item => <NavLink key={item.name} item={item} />)}
              </div>
            </div>
             
            <div>
              <div className="mb-3 px-2">
                 <span className="text-[8px] font-bold text-foreground/30 uppercase tracking-[0.3em]">Operations</span>
              </div>
              <div className="space-y-0.5">
                {[...operationalNav].map(item => <NavLink key={item.name} item={item} />)}
              </div>
            </div>
             
            <div>
              <div className="mb-3 px-2">
                 <span className="text-[8px] font-bold text-foreground/30 uppercase tracking-[0.3em]">Aesthetics</span>
              </div>
              <div className="space-y-0.5">
                {[...aestheticNav].map(item => <NavLink key={item.name} item={item} />)}
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-foreground/[0.05]">
            <Link
              href="/dashboard/settings"
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-300 ${
                pathname === '/dashboard/settings'
                  ? "bg-foreground text-background"
                  : "text-foreground/60 hover:text-foreground hover:bg-foreground/[0.03]"
              }`}
            >
              <Settings className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-[0.15em] font-medium">Settings</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Experience Stage */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen relative z-10 w-full overflow-hidden">
        
        {/* Minimal Top Navigation */}
        <header className="h-16 flex items-center justify-between px-6 lg:px-12 border-b border-foreground/[0.03] bg-background/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-md hover:bg-foreground/[0.05] transition-colors"
            >
               <Menu className="w-4 h-4 text-foreground/60" />
            </button>
            <div className="flexitems-center gap-2">
               <span className="text-[10px] text-foreground/30 uppercase tracking-[0.2em] hidden sm:block">System /</span>
               <h2 className="text-[11px] font-bold tracking-[0.2em] text-foreground uppercase pt-[1px] hidden sm:block">
                 {pathname === '/dashboard' ? 'Overview' : pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ')}
               </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="relative group cursor-pointer">
                <Search className="w-3.5 h-3.5 text-foreground/40 group-hover:text-foreground transition-colors" />
              </div>
              <div className="w-[1px] h-3 bg-foreground/10 mx-2" />
               <ThemeToggle />
              <button className="text-foreground/40 hover:text-foreground transition-colors">
                <Bell className="w-3.5 h-3.5" />
              </button>
            </div>
 
            <Link href="/dashboard/settings" className="flex items-center gap-2 p-1 pl-3 bg-foreground/[0.02] border border-foreground/[0.05] hover:bg-foreground/[0.04] transition-colors rounded-full cursor-pointer">
              <span className="text-[9px] font-medium tracking-[0.1em] text-foreground/60 uppercase">Karthik</span>
              <div className="h-5 w-5 rounded-full bg-foreground text-background flex items-center justify-center">
                <span className="text-[7px] font-bold tracking-widest">KT</span>
              </div>
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 px-6 lg:px-12 py-10 overflow-y-auto custom-scrollbar relative z-10 w-full">
          <div className="max-w-[1400px] w-full mx-auto relative min-h-screen">
            {children}
          </div>
        </div>

      </main>
    </div>
  );
}
