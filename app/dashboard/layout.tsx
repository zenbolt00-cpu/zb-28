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
  Smartphone,
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
  ];

  const aestheticNav = [
    { name: "Storefront", href: "/dashboard/storefront", icon: Monitor },
    { name: "Chat Management", href: "/dashboard/community/chat", icon: MessageSquare },
    { name: "Community", href: "/dashboard/community", icon: Users },
    { name: "Blogs", href: "/dashboard/blogs", icon: Newspaper },
  ];

  const integrationNav = [
    { name: "App Integration", href: "/dashboard/app-integration", icon: Smartphone },
  ];

  const NavLink = ({ item }: { item: any }) => {
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
    const Icon = item.icon;
    return (
      <Link 
        href={item.href}
        className={`group flex items-center gap-4 px-6 py-3 rounded-2xl transition-all duration-500 relative overflow-hidden ${
          isActive 
            ? "text-foreground bg-foreground/10 shadow-lg border border-foreground/10" 
            : "text-foreground/40 hover:text-foreground/80 hover:bg-foreground/5"
        }`}
      >
        <Icon className={`w-4.5 h-4.5 transition-colors duration-300 ${isActive ? 'text-foreground' : 'opacity-40 group-hover:opacity-100'}`} strokeWidth={isActive ? 2 : 1.5} />
        <span className="text-[12px] font-medium relative z-10">
          {item.name}
        </span>
        {isActive && (
          <motion.div 
            layoutId="activeNav"
            className="absolute inset-0 bg-gradient-to-r from-foreground/5 to-transparent -z-10"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </Link>
    );
  };

  const isLoginPage = pathname === '/dashboard/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex text-foreground bg-background dark:bg-[#0A0A0A] font-sans selection:bg-foreground/20 selection:text-foreground">
      
      {/* Apple Liquid Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-background" aria-hidden="true">
        <div className="absolute inset-0 bg-center opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: "url('/grid.svg')" }} />
        {/* Local liquid gradient for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--primary),0.05),transparent_70%),radial-gradient(circle_at_bottom_right,rgba(var(--primary),0.05),transparent_70%)] opacity-60" />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-background/60 backdrop-blur-md z-[55] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Premium Floating Glass */}
      <aside className={`fixed inset-y-0 left-0 w-72 m-4 rounded-[2.5rem] glass overflow-hidden border border-foreground/5 shadow-3xl z-[60] flex flex-col transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:pointer-events-auto`}>
        <div className="flex flex-col h-full px-6 py-10">
          
           {/* Brand Identity */}
          <div className="mb-10 lg:mb-12 px-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-foreground/5 text-foreground rounded-2xl flex items-center justify-center shadow-lg border border-foreground/10 transition-transform hover:scale-105 duration-700 backdrop-blur-md group">
                 <Image
                  src="/zb-logo-220px.png"
                  alt="Logo"
                  width={30}
                  height={30}
                  priority
                  className="dark:brightness-200 dark:grayscale dark:contrast-200"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-foreground/90 font-inter">Zica Bella</span>
                <span className="text-[10px] text-foreground/40 mt-1 font-medium select-none font-inter">System Configurator</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2">
            <div>
              <div className="mb-3 px-4">
                 <span className="text-[10px] font-semibold text-foreground/30 font-inter">Core Services</span>
              </div>
              <div className="space-y-0.5">
                {[...coreNav].map(item => <NavLink key={item.name} item={item} />)}
              </div>
            </div>
             
            <div>
              <div className="mb-3 px-4">
                 <span className="text-[10px] font-semibold text-foreground/30 font-inter">Logistics</span>
              </div>
              <div className="space-y-0.5">
                {[...operationalNav].map(item => <NavLink key={item.name} item={item} />)}
              </div>
            </div>
             
            <div>
              <div className="mb-3 px-4">
                 <span className="text-[10px] font-semibold text-foreground/30 font-inter">Experience</span>
              </div>
              <div className="space-y-0.5">
                {[...aestheticNav].map(item => <NavLink key={item.name} item={item} />)}
              </div>
            </div>
             
            <div>
              <div className="mb-3 px-4">
                 <span className="text-[10px] font-semibold text-foreground/30 font-inter">Integration</span>
              </div>
              <div className="space-y-0.5">
                {[...integrationNav].map(item => <NavLink key={item.name} item={item} />)}
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-foreground/[0.04]">
            <Link
              href="/dashboard/settings"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500 ${
                pathname === '/dashboard/settings'
                  ? "bg-foreground text-background shadow-lg shadow-black/10"
                  : "text-foreground/40 hover:text-foreground hover:bg-foreground/[0.03]"
              }`}
            >
              <Settings className="w-4 h-4" strokeWidth={pathname === '/dashboard/settings' ? 2 : 1.5} />
              <span className="text-[12px] font-medium font-inter">Settings</span>
            </Link>
          </div>
        </div>
      </aside>

       {/* Main Experience Stage */}
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen relative z-10 overflow-hidden">
        
        {/* Header - Floating Island Style */}
        <header className="h-14 lg:h-16 flex items-center justify-between px-4 lg:px-8 m-2 lg:mx-8 lg:my-6 rounded-3xl glass shadow-2xl sticky top-2 lg:top-6 z-40 border border-foreground/5">
          <div className="flex items-center gap-3 lg:gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-2xl bg-foreground/5 text-foreground/50 hover:text-foreground transition-colors border border-foreground/10"
            >
               <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 min-w-0">
               <h2 className="text-[14px] lg:text-[16px] font-semibold text-foreground font-inter truncate whitespace-nowrap">
                 {pathname === '/dashboard' ? 'Overview' : pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
               </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-6">
            <div className="flex items-center gap-2 lg:gap-4">
               <ThemeToggle />
               <div className="hidden sm:block w-[1px] h-4 bg-foreground/10 mx-1" />
              <button className="hidden sm:flex w-9 h-9 items-center justify-center rounded-2xl bg-foreground/5 text-foreground/30 hover:text-foreground transition-all border border-foreground/5">
                <Bell className="w-4.5 h-4.5" />
              </button>
            </div>
 
            <Link href="/dashboard/settings" className="flex items-center gap-2 lg:gap-3 p-1 lg:p-1.5 pl-3 lg:pl-4 bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 transition-all rounded-full cursor-pointer group shadow-inner">
              <span className="hidden sm:inline text-[12px] font-medium text-foreground/60 group-hover:text-foreground transition-colors font-inter">Admin</span>
              <div className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center shadow-2xl transition-transform group-hover:scale-105 duration-500">
                <span className="text-[10px] font-medium font-inter">KT</span>
              </div>
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 px-4 lg:px-12 py-6 lg:py-12 overflow-y-auto custom-scrollbar relative w-full">
          <div className="max-w-[1500px] w-full mx-auto relative min-h-screen">
            {children}
          </div>
        </div>

      </main>
    </div>
  );
}
