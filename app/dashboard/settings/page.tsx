"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Store, Key, Truck, CreditCard, WebhookIcon, Save, CheckCircle, AlertCircle, RefreshCw,
  Eye, EyeOff, Copy, ExternalLink, Shield, Zap, Settings2, Layout
} from 'lucide-react';

interface SettingsData {
  shopDomain: string;
  accessToken: string;
  delhiveryApiKey: string;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  shiprocketEmail: string;
  shiprocketToken: string;
  webhookSecret: string;
  heroImage: string;
  heroVideo: string;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  latestCurationTitle: string;
  latestCurationSubtitle: string;
  archiveTitle: string;
  archiveSubtitle: string;
  blueprintTitle: string;
  blueprintSubtitle: string;
  showProductVideo: boolean;
  showSizeChart: boolean;
  showBrand: boolean;
  showShippingReturn: boolean;
  showCare: boolean;
  showSizeFit: boolean;
  showDetails: boolean;
  pdpBackground: string;
  instagramUrl: string;
  appleUrl: string;
  spotifyUrl: string;
  youtubeUrl: string;
  showHeroText: boolean;
  showLatestCuration: boolean;
  showArchive: boolean;
  showBlueprint: boolean;
  featuredMedia: string;
  featuredMediaImage: string;
  collectionsMedia: string;
  footerVideo: string;
  mainMenuHandle: string;
  secondaryMenuHandle: string;
  showTreeText: boolean;
  kineticMeshProducts: string;
  showCommunity: boolean;
  communityTitle: string;
  communitySubtitle: string;
  spotlightTitle: string;
  spotlightSubtitle: string;
  kineticMeshTitle: string;
}

const WEBHOOK_TOPICS = [
  { topic: 'orders/create', description: 'Triggered when a new order is placed' },
  { topic: 'orders/updated', description: 'Triggered when an order is updated' },
  { topic: 'orders/fulfilled', description: 'Triggered when an order is fulfilled' },
  { topic: 'products/update', description: 'Triggered when a product is updated' },
  { topic: 'inventory_levels/update', description: 'Triggered when inventory changes' },
];

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  secret = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  secret?: boolean;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`space-y-1.5 ${disabled ? 'opacity-70' : ''}`}>
      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label} {disabled && <span className="ml-1 normal-case text-[10px] opacity-40 font-normal italic">(Managed via Environment)</span>}
      </label>
      <div className="relative flex items-center gap-2">
        <input
          type={secret && !show ? 'password' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-2.5 text-foreground text-sm placeholder-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:border-foreground/20 transition-all font-mono ${disabled ? 'cursor-not-allowed bg-muted/20' : ''}`}
        />
        {secret && (
          <button type="button" onClick={() => setShow(v => !v)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        {value && (
          <button type="button" onClick={copy} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  badge,
  badgeColor = 'text-emerald-500 bg-emerald-500/10',
  children,
}: {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden shadow-xl shadow-foreground/[0.02]">
      <div className="px-6 py-5 border-b border-foreground/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-foreground/5 flex items-center justify-center border border-foreground/10">
            <Icon className="w-4.5 h-4.5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        {badge && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badgeColor}`}>{badge}</span>
        )}
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-1">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-emerald-500' : 'bg-foreground/10'}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-background transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-1'}`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    shopDomain: '',
    accessToken: '',
    delhiveryApiKey: '',
    razorpayKeyId: '',
    razorpayKeySecret: '',
    shiprocketEmail: '',
    shiprocketToken: '',
    webhookSecret: '',
    heroImage: '',
    heroVideo: '',
    heroTitle: '',
    heroSubtitle: '',
    heroButtonText: 'Discover',
    latestCurationTitle: 'Latest curation',
    latestCurationSubtitle: 'Season Drop',
    archiveTitle: 'The Archive',
    archiveSubtitle: 'Organic Evolution',
    blueprintTitle: 'The blueprint of Zica Bella',
    blueprintSubtitle: 'Technique & Motion',
    showProductVideo: true,
    showSizeChart: true,
    showBrand: true,
    showShippingReturn: true,
    showCare: true,
    showSizeFit: true,
    showDetails: true,
    pdpBackground: '',
    instagramUrl: '',
    appleUrl: '',
    spotifyUrl: '',
    youtubeUrl: '',
    showHeroText: true,
    showLatestCuration: true,
    showArchive: true,
    showBlueprint: true,
    featuredMedia: '',
    featuredMediaImage: '',
    collectionsMedia: '',
    footerVideo: '',
    mainMenuHandle: '',
    secondaryMenuHandle: '',
    showTreeText: true,
    kineticMeshProducts: '',
    showCommunity: true,
    communityTitle: 'Featured Looks',
    communitySubtitle: 'Community',
    spotlightTitle: 'AUTHENTIC STREETWEAR',
    spotlightSubtitle: 'Luxury Indian streetwear for modern men. Redefining bold everyday style.',
    kineticMeshTitle: 'ARCHIVE EDITION',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [availableMenus, setAvailableMenus] = useState<{ id: string; title: string; handle: string }[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [activeTab, setActiveTab] = useState<'integrations' | 'storefront'>('integrations');

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/shopify/webhooks`);

    // Fetch integration settings
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setLoading(false);
          setIsInitialLoad(false);
          return;
        }
        setSettings({
          shopDomain: data.shopDomain || '',
          accessToken: data.accessToken || '',
          delhiveryApiKey: data.delhiveryApiKey || '',
          razorpayKeyId: data.razorpayKeyId || '',
          razorpayKeySecret: data.razorpayKeySecret || '',
          shiprocketEmail: data.shiprocketEmail || '',
          shiprocketToken: data.shiprocketToken || '',
          webhookSecret: data.webhookSecret || '',
          heroImage: data.heroImage || '',
          heroVideo: data.heroVideo || '',
          heroTitle: data.heroTitle || '',
          heroSubtitle: data.heroSubtitle || '',
          heroButtonText: data.heroButtonText || 'Discover',
          latestCurationTitle: data.latestCurationTitle || 'Latest curation',
          latestCurationSubtitle: data.latestCurationSubtitle || 'Season Drop',
          archiveTitle: data.archiveTitle || 'The Archive',
          archiveSubtitle: data.archiveSubtitle || 'Organic Evolution',
          blueprintTitle: data.blueprintTitle || 'The blueprint of Zica Bella',
          blueprintSubtitle: data.blueprintSubtitle || 'Technique & Motion',
          showProductVideo: data.showProductVideo ?? true,
          showSizeChart: data.showSizeChart ?? true,
          showBrand: data.showBrand ?? true,
          showShippingReturn: data.showShippingReturn ?? true,
          showCare: data.showCare ?? true,
          showSizeFit: data.showSizeFit ?? true,
          showDetails: data.showDetails ?? true,
          pdpBackground: data.pdpBackground || '',
          instagramUrl: data.instagramUrl || '',
          appleUrl: data.appleUrl || '',
          spotifyUrl: data.spotifyUrl || '',
          youtubeUrl: data.youtubeUrl || '',
          showHeroText: data.showHeroText ?? true,
          showLatestCuration: data.showLatestCuration ?? true,
          showArchive: data.showArchive ?? true,
          showBlueprint: data.showBlueprint ?? true,
          featuredMedia: data.featuredMedia || '',
          featuredMediaImage: data.featuredMediaImage || '',
          collectionsMedia: data.collectionsMedia || '',
          footerVideo: data.footerVideo || '',
          mainMenuHandle: data.mainMenuHandle || '',
          secondaryMenuHandle: data.secondaryMenuHandle || '',
          showTreeText: data.showTreeText ?? true,
          kineticMeshProducts: data.kineticMeshProducts || '',
          showCommunity: data.showCommunity ?? true,
          communityTitle: data.communityTitle || 'Featured Looks',
          communitySubtitle: data.communitySubtitle || 'Community',
          spotlightTitle: data.spotlightTitle || 'AUTHENTIC STREETWEAR',
          spotlightSubtitle: data.spotlightSubtitle || 'Luxury Indian streetwear for modern men. Redefining bold everyday style.',
          kineticMeshTitle: data.kineticMeshTitle || 'ARCHIVE EDITION',
        });
        setLoading(false);
        setTimeout(() => setIsInitialLoad(false), 500);
      })
      .catch(() => {
        setLoading(false);
        setIsInitialLoad(false);
      });

    // Fetch available Shopify menus for dropdown
    fetch('/api/shopify/menus')
      .then(r => r.json())
      .then(data => {
        if (data.menus) setAvailableMenus(data.menus);
      })
      .catch(console.error);

    // Fetch all products for selector
    setFetchingProducts(true);
    fetch('/api/shopify/products?pageSize=250')
      .then(r => r.json())
      .then(data => {
        if (data.products) setAllProducts(data.products);
      })
      .catch(console.error)
      .finally(() => setFetchingProducts(false));
  }, []);

  // Simple Auto-save logic
  useEffect(() => {
    // Don't auto-save during initial load or while a save is already in progress
    if (isInitialLoad || loading || saving) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 2500); // 2.5s debounce for auto-save

    return () => clearTimeout(timer);
  }, [settings]);

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    if (saving) return; // Prevent concurrent saves
    setSaving(true);
    setSaveStatus('idle');
    setSaveError(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          shopDomain: settings.shopDomain || undefined
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        const msg = errData.error || 'Unknown error';
        setSaveError(msg);
        throw new Error(msg);
      }
      setSaveStatus('success');
      console.log('[Settings Page] Successfully synced shop settings for:', settings.shopDomain);
    } catch (err: any) {
      console.error('HandleSave error:', err);
      setSaveStatus('error');
      setSaveError(err.message || 'Network communication error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  const set = (key: keyof SettingsData) => (value: any) => setSettings(prev => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings & Integrations</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage API keys, webhooks, and storefront customization.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-foreground/5 rounded-xl p-1 border border-foreground/5">
            <button
              onClick={() => setActiveTab('integrations')}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === 'integrations' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Integrations
            </button>
            <button
              onClick={() => setActiveTab('storefront')}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === 'storefront' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Storefront
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg ${
              saveStatus === 'error' 
                ? 'bg-red-500 text-white' 
                : saveStatus === 'success' 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-foreground text-background hover:opacity-90'
            } disabled:opacity-50`}
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saveStatus === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : saveStatus === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {saveStatus === 'error' && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4" />
          <span>Failed to save: {saveError || 'Persistent sync failed. Please check tokens or try again.'}</span>
        </div>
      )}

      <div className={`${activeTab === 'integrations' ? 'grid gap-5 lg:grid-cols-2' : 'hidden'}`}>
        {/* Shopify */}
        <SectionCard
          icon={Store}
          title="Shopify Integration"
          description="Connect your Shopify store"
          badge="Connected"
          badgeColor="text-emerald-500 bg-emerald-500/10"
        >
          <InputField
            label="Shop Domain"
            value={settings.shopDomain}
            onChange={set('shopDomain')}
            placeholder="your-store.myshopify.com"
            disabled={true}
          />
          <InputField
            label="Shopify Admin API Token"
            value={settings.accessToken}
            onChange={set('accessToken')}
            placeholder="shpat_..."
            secret
            disabled={true}
          />
          <a
            href={`https://${settings.shopDomain}/admin/apps`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Open Shopify Admin
          </a>
        </SectionCard>

        {/* Global Navigation - New Section */}
        <SectionCard
          icon={Layout}
          title="Global Navigation"
          description="Select which Shopify menus to use for the app header"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">Primary Menu</label>
              <select
                value={settings.mainMenuHandle}
                onChange={(e) => set('mainMenuHandle')(e.target.value)}
                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20"
              >
                <option value="">Select a menu...</option>
                {availableMenus.map(menu => (
                  <option key={menu.id} value={menu.handle}>{menu.title} ({menu.handle})</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">Secondary Menu (Optional)</label>
              <select
                value={settings.secondaryMenuHandle}
                onChange={(e) => set('secondaryMenuHandle')(e.target.value)}
                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20"
              >
                <option value="">None</option>
                {availableMenus.map(menu => (
                  <option key={menu.id} value={menu.handle}>{menu.title} ({menu.handle})</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Select the menus you have created in Shopify Admin &gt; Online Store &gt; Navigation. If you select two menus, they will both appear in the menu drawer.
          </p>
        </SectionCard>

        {/* Delhivery */}
        <SectionCard
          icon={Truck}
          title="Delhivery Shipping"
          description="Configure delivery integration for orders"
          badge={settings.delhiveryApiKey ? 'Configured' : 'Not Set'}
          badgeColor={settings.delhiveryApiKey ? 'text-emerald-500 bg-emerald-500/10' : 'text-yellow-500 bg-yellow-500/10'}
        >
          <InputField
            label="Delhivery API Key"
            value={settings.delhiveryApiKey}
            onChange={set('delhiveryApiKey')}
            placeholder="Enter your Delhivery API key"
            secret
          />
          <p className="text-xs text-muted-foreground">
            Get your API key from the{' '}
            <a href="https://logistics.delhivery.com/c/auth" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400">
              Delhivery Dashboard
            </a>
          </p>
        </SectionCard>

        {/* razorpay */}
        <SectionCard
          icon={CreditCard}
          title="Razorpay Payments"
          description="Process exchange payments and refunds"
          badge={settings.razorpayKeyId ? 'Configured' : 'Not Set'}
          badgeColor={settings.razorpayKeyId ? 'text-emerald-500 bg-emerald-500/10' : 'text-yellow-500 bg-yellow-500/10'}
        >
          <InputField
            label="Key ID"
            value={settings.razorpayKeyId}
            onChange={set('razorpayKeyId')}
            placeholder="rzp_live_xxxxxxxxxxxxx"
          />
          <InputField
            label="Key Secret"
            value={settings.razorpayKeySecret}
            onChange={set('razorpayKeySecret')}
            placeholder="Enter secret key"
            secret
          />
        </SectionCard>

        {/* Shiprocket */}
        <SectionCard
          icon={Zap}
          title="Shiprocket Returns"
          description="Generate return labels and AWBs"
          badge={settings.shiprocketEmail ? 'Configured' : 'Not Set'}
          badgeColor={settings.shiprocketEmail ? 'text-emerald-500 bg-emerald-500/10' : 'text-yellow-500 bg-yellow-500/10'}
        >
          <InputField
            label="Email"
            value={settings.shiprocketEmail}
            onChange={set('shiprocketEmail')}
            placeholder="admin@example.com"
          />
          <InputField
            label="API Token"
            value={settings.shiprocketToken}
            onChange={set('shiprocketToken')}
            placeholder="Enter Shiprocket token"
            secret
          />
        </SectionCard>

        {/* Webhooks section — now inside integrations */}
        <div className="lg:col-span-2">
          <SectionCard
            icon={Shield}
            title="Shopify Webhooks"
            description="All webhooks POST to your app's endpoint"
          >
            <div className="space-y-2 mb-5">
              <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Webhook Endpoint</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-2.5 text-xs font-mono text-muted-foreground truncate">
                  {webhookUrl}
                </code>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(webhookUrl); }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground border border-foreground/10 hover:border-foreground/20 transition-all flex-shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <InputField
              label="Webhook Secret (HMAC Validation)"
              value={settings.webhookSecret}
              onChange={set('webhookSecret')}
              placeholder="Enter webhook secret from Shopify Admin"
              secret
            />
            
            <div className="mt-6 pt-6 border-t border-foreground/5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] mb-4">Supported Topics</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {WEBHOOK_TOPICS.map((t) => (
                  <div key={t.topic} className="flex flex-col p-3 rounded-xl bg-foreground/[0.02] border border-foreground/5">
                    <span className="text-xs font-mono text-foreground">{t.topic}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{t.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className={`${activeTab === 'storefront' ? 'grid gap-5 lg:grid-cols-2' : 'hidden'}`}>

        {/* Homepage Management */}
        <SectionCard
          icon={Settings2}
          title="Homepage Hero"
          description="Manage your hero banners and call-to-action"
        >
          <InputField
            label="Hero Title"
            value={settings.heroTitle}
            onChange={set('heroTitle')}
            placeholder="e.g. Redefine The Standard"
          />
          <InputField
            label="Hero Subtitle"
            value={settings.heroSubtitle}
            onChange={set('heroSubtitle')}
            placeholder="e.g. Explore the latest drops."
          />
          <InputField
            label="Hero Button Text"
            value={settings.heroButtonText}
            onChange={set('heroButtonText')}
            placeholder="e.g. Discover"
          />
          <InputField
            label="Hero Image URL"
            value={settings.heroImage}
            onChange={set('heroImage')}
            placeholder="https://..."
          />
          <InputField
            label="Hero Video URL (Optional)"
            value={settings.heroVideo}
            onChange={set('heroVideo')}
            placeholder="https://..."
          />
          <InputField 
            label="Collection Cards Media (Above Cards)" 
            value={settings.collectionsMedia} 
            onChange={set('collectionsMedia')} 
            placeholder="Add a video or image link to show above collection cards"
          />
        </SectionCard>

        {/* Layout Sections Management */}
        <SectionCard
          icon={Layout}
          title="Homepage Sections"
          description="Edit text for various layout sections"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <InputField
              label="Curation Subtitle"
              value={settings.latestCurationSubtitle}
              onChange={set('latestCurationSubtitle')}
              placeholder="e.g. Season Drop"
            />
            <InputField
              label="Curation Title"
              value={settings.latestCurationTitle}
              onChange={set('latestCurationTitle')}
              placeholder="e.g. Latest curation"
            />
            <InputField
              label="Archive Subtitle"
              value={settings.archiveSubtitle}
              onChange={set('archiveSubtitle')}
              placeholder="e.g. Organic Evolution"
            />
            <InputField
              label="Archive Title"
              value={settings.archiveTitle}
              onChange={set('archiveTitle')}
              placeholder="e.g. The Archive"
            />
            <InputField
              label="Blueprint Subtitle"
              value={settings.blueprintSubtitle}
              onChange={set('blueprintSubtitle')}
              placeholder="e.g. Technique & Motion"
            />
            <InputField
              label="Blueprint Title"
              value={settings.blueprintTitle}
              onChange={set('blueprintTitle')}
              placeholder="e.g. The blueprint of Zica Bella"
            />
            <InputField
              label="Featured Section Video (Sequence 4)"
              value={settings.featuredMedia}
              onChange={set('featuredMedia')}
              placeholder="Add a unique video link for this section"
            />
            <InputField
              label="Featured Section Image (Sequence 4)"
              value={settings.featuredMediaImage}
              onChange={set('featuredMediaImage')}
              placeholder="Add a unique image link for this section"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-6 pt-6 border-t border-foreground/5">
            <ToggleField label="Show Hero Text" checked={settings.showHeroText} onChange={set('showHeroText')} />
            <ToggleField label="Show Latest Curation" checked={settings.showLatestCuration} onChange={set('showLatestCuration')} />
            <ToggleField label="Show Archive Section" checked={settings.showArchive} onChange={set('showArchive')} />
            <ToggleField label="Show Blueprint Section" checked={settings.showBlueprint} onChange={set('showBlueprint')} />
            <ToggleField label="Show Community Section" checked={settings.showCommunity} onChange={set('showCommunity')} />
            <ToggleField label="Show 3D Tree Text" checked={settings.showTreeText} onChange={set('showTreeText')} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
             <InputField
              label="Community Subtitle"
              value={settings.communitySubtitle}
              onChange={set('communitySubtitle')}
              placeholder="e.g. Community"
            />
            <InputField
              label="Community Title"
              value={settings.communityTitle}
              onChange={set('communityTitle')}
              placeholder="e.g. Featured Looks"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
             <InputField
              label="Spotlight Title"
              value={settings.spotlightTitle}
              onChange={set('spotlightTitle')}
              placeholder="e.g. AUTHENTIC STREETWEAR"
            />
            <InputField
              label="Spotlight Subtitle"
              value={settings.spotlightSubtitle}
              onChange={set('spotlightSubtitle')}
              placeholder="e.g. Luxury Indian streetwear..."
            />
            <InputField
              label="Kinetic Mesh Title"
              value={settings.kineticMeshTitle}
              onChange={set('kineticMeshTitle')}
              placeholder="e.g. ARCHIVE EDITION"
            />
          </div>
        </SectionCard>

        {/* PDP Customization */}
        <SectionCard
          icon={Settings2}
          title="Product Page Customization"
          description="Manage sections and visibility on product pages"
        >
          <InputField
            label="PDP Background (GIF/Video URL)"
            value={settings.pdpBackground}
            onChange={set('pdpBackground')}
            placeholder="https://..."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-2">
            <ToggleField label="Auto-play Product Video" checked={settings.showProductVideo} onChange={set('showProductVideo')} />
            <ToggleField label="Size Chart" checked={settings.showSizeChart} onChange={set('showSizeChart')} />
            <ToggleField label="Brand Section" checked={settings.showBrand} onChange={set('showBrand')} />
            <ToggleField label="Shipping & Return" checked={settings.showShippingReturn} onChange={set('showShippingReturn')} />
            <ToggleField label="Care Instructions" checked={settings.showCare} onChange={set('showCare')} />
            <ToggleField label="Size & Fit" checked={settings.showSizeFit} onChange={set('showSizeFit')} />
            <ToggleField label="Details Section" checked={settings.showDetails} onChange={set('showDetails')} />
          </div>
        </SectionCard>

        {/* Kinetic Mesh Product Selection */}
        <SectionCard
          icon={Settings2}
          title="Kinetic Mesh Selection"
          description="Select products to show in the 3D gallery"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-foreground/5 pb-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground italic">
                {settings.kineticMeshProducts ? settings.kineticMeshProducts.split(',').filter(Boolean).length : 0} Products Selected
              </p>
            </div>

            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-1">
              {fetchingProducts ? (
                <div className="py-20 flex flex-col items-center justify-center text-muted-foreground/30">
                  <RefreshCw className="w-5 h-5 animate-spin mb-2" />
                  <p className="text-[10px] uppercase tracking-widest text-inherit">Syncing Products...</p>
                </div>
              ) : allProducts.length === 0 ? (
                <div className="py-10 text-center text-[10px] text-muted-foreground uppercase tracking-widest">
                  No products found
                </div>
              ) : (
                allProducts.map((p) => {
                  const selected = (settings.kineticMeshProducts || '').split(',').map(s=>s.trim()).includes(p.handle);
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        const current = (settings.kineticMeshProducts || '').split(',').map(s=>s.trim()).filter(Boolean);
                        let next;
                        if (selected) {
                          next = current.filter(h => h !== p.handle);
                        } else {
                          next = [...current, p.handle];
                        }
                        set('kineticMeshProducts')(next.join(','));
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all border ${
                        selected 
                          ? 'bg-foreground/5 border-foreground/10 text-foreground' 
                          : 'bg-transparent border-transparent text-muted-foreground hover:bg-foreground/5'
                      }`}
                    >
                      <span className="text-[11px] font-medium tracking-wide text-left line-clamp-1">{p.title}</span>
                      {selected && (
                        <CheckCircle className="w-3.5 h-3.5 text-foreground" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </SectionCard>

        {/* Social Management - Moved to bottom of storefront */}
        <div className="lg:col-span-2">
          <SectionCard
            icon={WebhookIcon}
            title="Social Integration"
            description="Manage your social media links"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <InputField
                label="Instagram URL"
                value={settings.instagramUrl}
                onChange={set('instagramUrl')}
                placeholder="https://instagram.com/..."
              />
              <InputField
                label="Apple Music/App URL"
                value={settings.appleUrl}
                onChange={set('appleUrl')}
                placeholder="https://apple.co/..."
              />
              <InputField
                label="Spotify URL"
                value={settings.spotifyUrl}
                onChange={set('spotifyUrl')}
                placeholder="https://spotify.com/..."
              />
              <InputField
                label="YouTube URL"
                value={settings.youtubeUrl}
                onChange={set('youtubeUrl')}
                placeholder="https://youtube.com/..."
              />
            </div>
            <div className="mt-8 pt-6 border-t border-foreground/5">
              <InputField 
                label="Global Footer Video" 
                value={settings.footerVideo} 
                onChange={set('footerVideo')} 
                placeholder="Add a video link to show in the footer of every page"
              />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
