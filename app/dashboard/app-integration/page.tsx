"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Smartphone, Wifi, WifiOff, CheckCircle, XCircle, RefreshCw, Loader2,
  ShoppingBag, Users, Package, ShoppingCart, Globe, Zap, Database,
  ArrowRight, Activity, Server, Code, Eye, Settings, Link2, BarChart3, Image as ImageIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface EndpointStatus {
  name: string;
  path: string;
  status: 'ok' | 'error' | 'loading';
  responseTime?: number;
  dataCount?: number;
  icon: any;
}

interface SyncStats {
  productsCount: number;
  collectionsCount: number;
  customersCount: number;
  ordersCount: number;
  lastChecked: string;
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`glass-card rounded-[2rem] overflow-hidden relative z-10 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function StatBlock({ icon: Icon, label, value, sublabel }: { icon: any; label: string; value: string | number; sublabel?: string }) {
  return (
    <div className="flex items-center gap-5 px-8 py-7 border-b border-foreground/5 last:border-0 group/stat hover:bg-foreground/[0.02] transition-all duration-500">
      <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20 border border-foreground/5 group-hover/stat:bg-foreground group-hover/stat:text-background transition-all duration-700 shadow-xl">
        <Icon className="w-5 h-5" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[22px] font-bold text-foreground tracking-tight leading-none mb-1.5">{value}</div>
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/25">{label}</div>
      </div>
      {sublabel && (
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/15 hidden md:block">{sublabel}</span>
      )}
    </div>
  );
}

function EndpointRow({ ep }: { ep: EndpointStatus }) {
  const Icon = ep.icon;
  return (
    <div className="flex items-center gap-5 px-8 py-5 border-b border-foreground/5 last:border-0 group/row hover:bg-foreground/[0.02] transition-all duration-500">
      <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20 border border-foreground/5 group-hover/row:bg-foreground group-hover/row:text-background transition-all duration-700">
        <Icon className="w-4.5 h-4.5" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-foreground/80 mb-1">{ep.name}</div>
        <div className="text-[10px] font-mono text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20 tracking-tight truncate">{ep.path}</div>
      </div>
      <div className="flex items-center gap-3">
        {ep.responseTime !== undefined && (
          <span className="text-[10px] font-bold font-mono text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20">{ep.responseTime}ms</span>
        )}
        {ep.dataCount !== undefined && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/15 bg-foreground/5 px-2.5 py-1 rounded-lg">
            {ep.dataCount} items
          </span>
        )}
        {ep.status === 'loading' ? (
          <Loader2 className="w-4 h-4 text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20 animate-spin" />
        ) : ep.status === 'ok' ? (
          <CheckCircle className="w-4 h-4 text-emerald-500" />
        ) : (
          <XCircle className="w-4 h-4 text-red-400" />
        )}
      </div>
    </div>
  );
}

export default function AppIntegrationPage() {
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    { name: 'Products', path: '/api/app/products', status: 'loading', icon: ShoppingBag },
    { name: 'Collections', path: '/api/app/collections', status: 'loading', icon: Package },
    { name: 'Search', path: '/api/app/search?q=test', status: 'loading', icon: Globe },
    { name: 'App Config', path: '/api/app/config', status: 'loading', icon: Settings },
    { name: 'Customers', path: '/api/app/customers?all=true&limit=5', status: 'loading', icon: Users },
    { name: 'Cart', path: '/api/app/cart?cartId=test', status: 'loading', icon: ShoppingCart },
  ]);

  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [customerPreview, setCustomerPreview] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const [settings, setSettings] = useState<any>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const testEndpoints = useCallback(async () => {
    setTesting(true);
    const results = await Promise.all(
      endpoints.map(async (ep) => {
        const start = Date.now();
        try {
          const res = await fetch(ep.path);
          const elapsed = Date.now() - start;
          const data = await res.json();

          let count: number | undefined;
          if (data.products) count = data.products.length;
          else if (data.collections) count = data.collections.length;
          else if (data.customers) count = data.customers.length;
          else if (data.config) count = Object.keys(data.config).length;

          // Save customer preview data
          if (ep.path.includes('/customers') && data.customers) {
            setCustomerPreview(data.customers.slice(0, 5));
          }

          return { ...ep, status: res.ok ? 'ok' as const : 'error' as const, responseTime: elapsed, dataCount: count };
        } catch {
          return { ...ep, status: 'error' as const, responseTime: Date.now() - start };
        }
      })
    );
    setEndpoints(results);
    setTesting(false);
  }, []);

  const fetchSyncStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [products, collections, customers] = await Promise.all([
        fetch('/api/app/products?limit=250').then(r => r.json()).catch(() => ({ products: [] })),
        fetch('/api/app/collections?all=true').then(r => r.json()).catch(() => ({ collections: [] })),
        fetch('/api/app/customers?all=true&limit=250').then(r => r.json()).catch(() => ({ customers: [] })),
      ]);

      setSyncStats({
        productsCount: products.products?.length || 0,
        collectionsCount: collections.collections?.length || 0,
        customersCount: customers.total || customers.customers?.length || 0,
        ordersCount: 0,
        lastChecked: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      console.error('Error fetching sync stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, []);

  useEffect(() => {
    testEndpoints();
    fetchSyncStats();
    fetchSettings();
  }, [testEndpoints, fetchSyncStats, fetchSettings]);

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    setSaveStatus('idle');
    setSaveMessage('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: settings.id,
          ...settings,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveStatus('success');
        setSaveMessage('Settings saved successfully!');
        // Refresh endpoints to verify
        testEndpoints();
      } else {
        setSaveStatus('error');
        setSaveMessage(data.error || 'Failed to save settings. Check your connection.');
      }
    } catch (err: any) {
      setSaveStatus('error');
      setSaveMessage(`Save failed: ${err.message}`);
    } finally {
      setSavingSettings(false);
      // Auto-dismiss toast after 4 seconds
      setTimeout(() => { setSaveStatus('idle'); setSaveMessage(''); }, 4000);
    }
  };

  const allHealthy = endpoints.every(ep => ep.status === 'ok');
  const avgResponse = endpoints.filter(ep => ep.responseTime).reduce((sum, ep) => sum + (ep.responseTime || 0), 0) / (endpoints.filter(ep => ep.responseTime).length || 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto space-y-10 pb-20 relative z-10"
    >

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 px-4 pt-10 mb-16 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground/50 dark:text-foreground/50 dark:text-foreground/50 dark:text-foreground/50 dark:text-foreground/30 border border-foreground/5 shadow-2xl">
              <Smartphone className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground uppercase tracking-tighter leading-none">
                App Integration
              </h1>
              <p className="text-[11px] text-foreground/50 dark:text-foreground/50 dark:text-foreground/50 dark:text-foreground/50 dark:text-foreground/30 font-bold uppercase tracking-[0.4em] mt-2">
                React Native API Connectivity
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => { testEndpoints(); fetchSyncStats(); }}
          disabled={testing}
          className="flex items-center justify-center gap-3 px-8 py-3 rounded-2xl text-[10px] font-bold tracking-[0.3em] uppercase bg-foreground text-background shadow-xl shadow-foreground/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} strokeWidth={2.5} />
          {testing ? 'Testing...' : 'Run Health Check'}
        </button>
      </div>

      {/* Connection Status Banner */}
      <GlassCard>
        <div className="flex items-center gap-6 px-10 py-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl border transition-all duration-700 ${
            allHealthy 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
              : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
          }`}>
            {allHealthy ? <Wifi className="w-7 h-7" /> : <WifiOff className="w-7 h-7" />}
          </div>
          <div className="flex-1">
            <h2 className="text-[18px] font-bold text-foreground tracking-tight leading-none mb-2">
              {allHealthy ? 'All Systems Operational' : 'Some Endpoints Unreachable'}
            </h2>
            <p className="text-[11px] text-foreground/50 dark:text-foreground/50 dark:text-foreground/50 dark:text-foreground/50 dark:text-foreground/30 font-medium">
              {endpoints.filter(e => e.status === 'ok').length} of {endpoints.length} endpoints connected
              {avgResponse > 0 && ` • Avg response: ${Math.round(avgResponse)}ms`}
            </p>
          </div>
          <div className={`w-3 h-3 rounded-full ${allHealthy ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* API Endpoints */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 px-6 mb-5">
            <Server className="w-4.5 h-4.5 text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20">API Endpoints</h3>
          </div>
          <GlassCard>
            {endpoints.map((ep, i) => (
              <EndpointRow key={i} ep={ep} />
            ))}
          </GlassCard>
        </div>

        {/* Shopify Sync Stats */}
        <div>
          <div className="flex items-center gap-3 px-6 mb-5">
            <Database className="w-4.5 h-4.5 text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20">Shopify Data Sync</h3>
          </div>
          <GlassCard>
            {loadingStats ? (
              <div className="flex items-center justify-center py-16 gap-3">
                <Loader2 className="w-5 h-5 text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20 animate-spin" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20">Syncing...</span>
              </div>
            ) : syncStats ? (
              <>
                <StatBlock icon={ShoppingBag} label="Products" value={syncStats.productsCount} sublabel="From Shopify" />
                <StatBlock icon={Package} label="Collections" value={syncStats.collectionsCount} sublabel="Active" />
                <StatBlock icon={Users} label="Customers" value={syncStats.customersCount} sublabel="Registered" />
                <div className="px-8 py-4 border-t border-foreground/5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-foreground/15">
                    Last synced: {syncStats.lastChecked}
                  </span>
                </div>
              </>
            ) : (
              <div className="px-8 py-12 text-center text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20 text-sm">Unable to fetch sync data</div>
            )}
          </GlassCard>
        </div>

        {/* App Configuration Info */}
        <div>
          <div className="flex items-center gap-3 px-6 mb-5">
            <Zap className="w-4.5 h-4.5 text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20">Proxy Configuration</h3>
          </div>
          <GlassCard>
            <div className="px-8 py-7 border-b border-foreground/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-bold text-foreground/80">React Native App</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg">Connected</span>
              </div>
              <p className="text-[10px] text-foreground/25 font-medium leading-relaxed">
                The ZicaBella React Native app fetches all data through these API proxy endpoints. 
                No Shopify credentials are exposed in the mobile app.
              </p>
            </div>
            <div className="px-8 py-5 border-b border-foreground/5 flex items-center justify-between">
              <div>
                <div className="text-[12px] font-bold text-foreground/80 dark:text-foreground/80 dark:text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 mb-1">API Base URL</div>
                <div className="text-[10px] font-mono text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20">app.zicabella.com/api/app</div>
              </div>
              <Code className="w-4 h-4 text-foreground/15" />
            </div>
            <div className="px-8 py-5 border-b border-foreground/5 flex items-center justify-between">
              <div>
                <div className="text-[12px] font-bold text-foreground/80 dark:text-foreground/80 dark:text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 mb-1">Auth Mode</div>
                <div className="text-[10px] font-mono text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20">Public (no token required)</div>
              </div>
              <Link2 className="w-4 h-4 text-foreground/15" />
            </div>
            <div className="px-8 py-5 flex items-center justify-between">
              <div>
                <div className="text-[12px] font-bold text-foreground/80 dark:text-foreground/80 dark:text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 mb-1">Shopify Admin Token</div>
                <div className="text-[10px] font-mono text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20">Server-side only (secure)</div>
              </div>
              <Activity className="w-4 h-4 text-foreground/15" />
            </div>
          </GlassCard>
        </div>

        {/* Mobile App Settings Form */}
        <div className="lg:col-span-2 mt-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 mb-5">
            <div className="flex items-center gap-3">
              <Settings className="w-4.5 h-4.5 text-foreground/40 dark:text-foreground/20" />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-foreground/40 dark:text-foreground/20">Mobile App Content Settings</h3>
            </div>
            <div className="flex items-center gap-3">
              {saveStatus !== 'idle' && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all ${
                  saveStatus === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'
                }`}>
                  {saveMessage}
                </span>
              )}
              {settings && (
                <button
                  onClick={saveSettings}
                  disabled={savingSettings}
                  className="text-[10px] font-bold uppercase tracking-[0.3em] bg-foreground text-background px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xl shadow-foreground/20"
                >
                  {savingSettings && <Loader2 className="w-3 h-3 animate-spin" />}
                  {savingSettings ? 'Saving...' : 'Save App Settings'}
                </button>
              )}
            </div>
          </div>
          <GlassCard>
            {settings ? (
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                {/* Left Column */}
                <div className="space-y-6">
                   {/* ── Hero Section ── */}
                   <div>
                     <h4 className="flex items-center gap-2 text-[12px] font-bold text-foreground/80 uppercase tracking-widest mb-6 pb-2 border-b border-foreground/5">
                       <Smartphone className="w-4 h-4" /> App Homepage Hero
                     </h4>
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">Hero Image URL</label>
                     <input type="text" value={settings.heroImage || ''} onChange={e => setSettings({...settings, heroImage: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" placeholder="https://..." />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">Hero Video URL</label>
                     <input type="text" value={settings.heroVideo || ''} onChange={e => setSettings({...settings, heroVideo: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" placeholder="https://..." />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">Hero Title</label>
                     <input type="text" value={settings.heroTitle || ''} onChange={e => setSettings({...settings, heroTitle: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" placeholder="e.g. ZICA BELLA" />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">Hero Subtitle</label>
                     <input type="text" value={settings.heroSubtitle || ''} onChange={e => setSettings({...settings, heroSubtitle: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" placeholder="Enter subtitle..." />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">Hero Button Text</label>
                     <input type="text" value={settings.heroButtonText || ''} onChange={e => setSettings({...settings, heroButtonText: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" placeholder="Discover" />
                   </div>
                   <label className="flex items-center gap-3 cursor-pointer">
                     <input type="checkbox" checked={settings.showHeroText ?? false} onChange={e => setSettings({...settings, showHeroText: e.target.checked})} className="w-4 h-4 rounded accent-foreground" />
                     <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60">Show Hero Text Overlay</span>
                   </label>

                   {/* ── Spotlight Section ── */}
                   <div className="pt-4 mt-6 border-t border-foreground/5">
                     <h4 className="flex items-center gap-2 text-[12px] font-bold text-foreground/80 uppercase tracking-widest mb-6 pb-2">
                       <Eye className="w-4 h-4" /> Spotlight Section
                     </h4>
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">Spotlight Title</label>
                     <input type="text" value={settings.spotlightTitle || ''} onChange={e => setSettings({...settings, spotlightTitle: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" placeholder="AUTHENTIC STREETWEAR" />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">Spotlight Subtitle</label>
                     <input type="text" value={settings.spotlightSubtitle || ''} onChange={e => setSettings({...settings, spotlightSubtitle: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" placeholder="Luxury Indian streetwear..." />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">Spotlight Collection Handle</label>
                     <input type="text" value={settings.spotlightCollection || ''} onChange={e => setSettings({...settings, spotlightCollection: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all font-mono" placeholder="tshirts" />
                     <p className="text-[10px] text-foreground/30 mt-1.5 ml-1">The collection handle for the spotlight grid (e.g. tshirts, accessories)</p>
                   </div>

                   {/* ── Flipbook Section ── */}
                   <div className="pt-4 mt-6 border-t border-foreground/5">
                     <h4 className="flex items-center gap-2 text-[12px] font-bold text-foreground/80 uppercase tracking-widest mb-6 pb-2">
                       <ImageIcon className="w-4 h-4" /> Flipbook Section
                     </h4>
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">Flipbook Image URL</label>
                     <input type="text" value={settings.flipbookImage || ''} onChange={e => setSettings({...settings, flipbookImage: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" placeholder="https://..." />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">Flipbook Video URL</label>
                     <input type="text" value={settings.flipbookVideo || ''} onChange={e => setSettings({...settings, flipbookVideo: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" placeholder="https://..." />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">Flipbook Title</label>
                     <input type="text" value={settings.flipbookTitle || ''} onChange={e => setSettings({...settings, flipbookTitle: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" placeholder="Archival Vision" />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">Flipbook Tag</label>
                     <input type="text" value={settings.flipbookTag || ''} onChange={e => setSettings({...settings, flipbookTag: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" placeholder="Core Manifest" />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">Flipbook Description</label>
                     <input type="text" value={settings.flipbookDesc || ''} onChange={e => setSettings({...settings, flipbookDesc: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" placeholder="Engineered for those..." />
                   </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                   {/* ── Community Section ── */}
                   <div>
                     <h4 className="flex items-center gap-2 text-[12px] font-bold text-foreground/80 uppercase tracking-widest mb-6 pb-2 border-b border-foreground/5">
                       <Users className="w-4 h-4" /> Community Section
                     </h4>
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">Community Title</label>
                     <input type="text" value={settings.communityTitle || ''} onChange={e => setSettings({...settings, communityTitle: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" placeholder="Featured Looks" />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">Community Subtitle</label>
                     <input type="text" value={settings.communitySubtitle || ''} onChange={e => setSettings({...settings, communitySubtitle: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" placeholder="Community" />
                   </div>
                   <label className="flex items-center gap-3 cursor-pointer">
                     <input type="checkbox" checked={settings.showCommunity ?? true} onChange={e => setSettings({...settings, showCommunity: e.target.checked})} className="w-4 h-4 rounded accent-foreground" />
                     <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60">Show Community Section</span>
                   </label>

                   {/* ── Ring Carousel ── */}
                   <div className="pt-4 mt-6 border-t border-foreground/5">
                     <h4 className="flex items-center gap-2 text-[12px] font-bold text-foreground/80 uppercase tracking-widest mb-6 pb-2">
                       <BarChart3 className="w-4 h-4" /> Ring Carousel
                     </h4>
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">Ring Carousel Title</label>
                     <input type="text" value={settings.ringCarouselTitle || ''} onChange={e => setSettings({...settings, ringCarouselTitle: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" placeholder="RING COLLECTION" />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">Ring Carousel Items (JSON Array)</label>
                     <input type="text" value={settings.ringCarouselItems || ''} onChange={e => setSettings({...settings, ringCarouselItems: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all font-mono" placeholder='["ring1", "ring2"]' />
                   </div>
                   <label className="flex items-center gap-3 cursor-pointer">
                     <input type="checkbox" checked={settings.showRingCarousel ?? true} onChange={e => setSettings({...settings, showRingCarousel: e.target.checked})} className="w-4 h-4 rounded accent-foreground" />
                     <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60">Show Ring Carousel</span>
                   </label>

                   {/* ── Social Links ── */}
                   <div className="pt-4 mt-6 border-t border-foreground/5">
                     <h4 className="flex items-center gap-2 text-[12px] font-bold text-foreground/80 uppercase tracking-widest mb-6 pb-2">
                       <Globe className="w-4 h-4" /> Social Links
                     </h4>
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">Instagram URL</label>
                     <input type="text" value={settings.instagramUrl || ''} onChange={e => setSettings({...settings, instagramUrl: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" placeholder="https://instagram.com/..." />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">YouTube URL</label>
                     <input type="text" value={settings.youtubeUrl || ''} onChange={e => setSettings({...settings, youtubeUrl: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" placeholder="https://youtube.com/..." />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">Spotify URL</label>
                     <input type="text" value={settings.spotifyUrl || ''} onChange={e => setSettings({...settings, spotifyUrl: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" placeholder="https://spotify.com/..." />
                   </div>

                   {/* ── Collections & Menu ── */}
                   <div className="pt-4 mt-6 border-t border-foreground/5">
                     <h4 className="flex items-center gap-2 text-[12px] font-bold text-foreground/80 uppercase tracking-widest mb-6 pb-2">
                       <Package className="w-4 h-4" /> Collections & Menu
                     </h4>
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">Homepage Featured Collections (JSON)</label>
                     <input type="text" value={settings.enabledCollectionsPage || ''} onChange={e => setSettings({...settings, enabledCollectionsPage: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all font-mono" placeholder='["tshirts", "hoodies"]' />
                     <p className="text-[10px] text-foreground/30 mt-1.5 ml-1">Collections shown in the bottom scroll on the app homepage.</p>
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">App Menu Collections (JSON)</label>
                     <input type="text" value={settings.enabledCollectionsMenu || ''} onChange={e => setSettings({...settings, enabledCollectionsMenu: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all font-mono" placeholder='["accessories", "rings"]' />
                     <p className="text-[10px] text-foreground/30 mt-1.5 ml-1">Collections shown in the app's Explore/Search tabs.</p>
                   </div>

                   {/* ── Section & Feature Toggles ── */}
                   <div className="pt-4 mt-6 border-t border-foreground/5">
                     <h4 className="flex items-center gap-2 text-[12px] font-bold text-foreground/80 uppercase tracking-widest mb-6 pb-2">
                       <Zap className="w-4 h-4" /> Section Toggles
                     </h4>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     {[
                       { key: 'showLatestCuration', label: 'Latest Curation' },
                       { key: 'showArchive', label: 'Archive' },
                       { key: 'showBlueprint', label: 'Blueprint' },
                       { key: 'showProductVideo', label: 'Product Video' },
                       { key: 'showSizeChart', label: 'Size Chart' },
                       { key: 'showBrand', label: 'Brand' },
                       { key: 'showShippingReturn', label: 'Shipping/Returns' },
                       { key: 'showDetails', label: 'Product Details' },
                     ].map(toggle => (
                       <label key={toggle.key} className="flex items-center gap-2 cursor-pointer">
                         <input type="checkbox" checked={settings[toggle.key] ?? true} onChange={e => setSettings({...settings, [toggle.key]: e.target.checked})} className="w-4 h-4 rounded accent-foreground" />
                         <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/60">{toggle.label}</span>
                       </label>
                     ))}
                   </div>
                </div>
              </div>
            ) : (
              <div className="p-10 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-6 h-6 text-foreground/20 animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Loading App Settings...</span>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Customer Data Preview */}
      <div>
        <div className="flex items-center gap-3 px-6 mb-5">
          <Users className="w-4.5 h-4.5 text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20">Customer Data</h3>
        </div>
        <GlassCard>
          {customerPreview.length > 0 ? (
            <>
              <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-8 py-4 border-b border-foreground/5">
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20">Name</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20">Contact</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20">Orders</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20">Spent</span>
              </div>
              {customerPreview.map((c: any, i: number) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-8 py-4 border-b border-foreground/5 last:border-0 hover:bg-foreground/[0.02] transition-all duration-300">
                  <div>
                    <div className="text-[12px] font-bold text-foreground/70 truncate">{c.name || 'Unknown'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/40 truncate">{c.email || c.phone || '—'}</div>
                  </div>
                  <div className="text-[12px] font-bold text-foreground/70 dark:text-foreground/70 dark:text-foreground/70 dark:text-foreground/70 dark:text-foreground/50 text-center min-w-[40px]">{c.ordersCount || 0}</div>
                  <div className="text-[12px] font-bold text-foreground/70 dark:text-foreground/70 dark:text-foreground/70 dark:text-foreground/70 dark:text-foreground/50 text-right min-w-[80px]">₹{parseFloat(c.totalSpent || '0').toLocaleString()}</div>
                </div>
              ))}
              <div className="px-8 py-4 border-t border-foreground/5 text-center">
                <a href="/dashboard/customers" className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/50 dark:text-foreground/50 dark:text-foreground/50 dark:text-foreground/50 dark:text-foreground/30 hover:text-foreground/80 dark:text-foreground/80 dark:text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 transition-colors inline-flex items-center gap-2">
                  View all customers <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 className="w-4 h-4 text-foreground/15 animate-spin" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20">Loading customer data...</span>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Integration Guide */}
      <div>
        <div className="flex items-center gap-3 px-6 mb-5">
          <Code className="w-4.5 h-4.5 text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20">Integration Reference</h3>
        </div>
        <GlassCard>
          <div className="px-8 py-6 space-y-4">
            <p className="text-[11px] text-foreground/50 dark:text-foreground/50 dark:text-foreground/50 dark:text-foreground/50 dark:text-foreground/30 font-medium leading-relaxed">
              The React Native app communicates exclusively through these proxy endpoints. All Shopify API tokens remain server-side.
            </p>
            <div className="space-y-2">
              {[
                { method: 'GET', path: '/api/app/products', desc: 'List all products (supports ?collection=handle&limit=24)' },
                { method: 'GET', path: '/api/app/products/:handle', desc: 'Single product with metafields' },
                { method: 'GET', path: '/api/app/collections', desc: 'List collections (supports ?location=header|page|menu)' },
                { method: 'GET', path: '/api/app/collections/:handle', desc: 'Collection with products' },
                { method: 'GET', path: '/api/app/search?q=...', desc: 'Search products' },
                { method: 'GET', path: '/api/app/orders?customerId=...', desc: 'Customer orders' },
                { method: 'GET', path: '/api/app/customers?phone=...', desc: 'Customer lookup' },
                { method: 'GET', path: '/api/app/config', desc: 'App settings & section config' },
                { method: 'POST', path: '/api/app/cart', desc: 'Cart operations (create, add, remove, update)' },
              ].map((api, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-4 rounded-xl hover:bg-foreground/[0.03] transition-all">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    api.method === 'GET' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>{api.method}</span>
                  <span className="text-[11px] font-mono font-bold text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/40 flex-1">{api.path}</span>
                  <span className="text-[9px] text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20 hidden md:block">{api.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Footer Status */}
      <div className="text-center pt-10">
        <div className="inline-flex items-center gap-3 px-6 py-2.5 border border-foreground/[0.08] rounded-full bg-white/40 dark:bg-white/[0.02] shadow-xl backdrop-blur-md">
          <div className={`w-2 h-2 rounded-full ${allHealthy ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground/50 dark:text-foreground/50 dark:text-foreground/50 dark:text-foreground/50 dark:text-foreground/30">
            {allHealthy ? 'Integration Active' : 'Integration Degraded'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
