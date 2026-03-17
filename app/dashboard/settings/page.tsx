"use client";

import { useState, useEffect } from 'react';
import {
  Store, Truck, CreditCard, Save, CheckCircle, AlertCircle, RefreshCw,
  Eye, EyeOff, Shield, Webhook, Key, Lock, Loader2, Fingerprint, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SettingsData {
  id: string;
  shopDomain: string;
  accessToken: string;
  delhiveryApiKey: string;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  shiprocketEmail: string;
  shiprocketToken: string;
  webhookSecret: string;
  [key: string]: any;
}

function SettingsGroup({ title, children, icon: Icon }: { title?: string; children: React.ReactNode; icon?: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="space-y-4 relative z-10"
    >
      {title && (
        <div className="flex items-center gap-2 px-6">
           {Icon && <Icon className="w-3.5 h-3.5 text-foreground/40" />}
           <h3 className="text-[9px] font-semibold uppercase tracking-widest text-foreground/50">{title}</h3>
        </div>
      )}
      <div className="bg-background border border-foreground/[0.05] rounded-xl px-6 py-2 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
           {children}
        </div>
      </div>
    </motion.div>
  );
}

function SettingsRow({
  label,
  children,
  icon: Icon,
  description
}: {
  label: string;
  children: React.ReactNode;
  icon?: any;
  description?: string;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between py-5 border-b border-foreground/[0.05] last:border-0 gap-4 md:gap-0">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-8 h-8 rounded-md bg-foreground/[0.02] flex items-center justify-center text-foreground/40 border border-foreground/[0.05]">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[12px] font-medium text-foreground tracking-tight mb-0.5">{label}</span>
          {description && <span className="text-[9px] text-foreground/50 uppercase tracking-widest">{description}</span>}
        </div>
      </div>
      <div className="flex-1 w-full md:max-w-md flex justify-end">
        {children}
      </div>
    </div>
  );
}

function InputField({
  value,
  onChange,
  placeholder,
  secret = false
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secret?: boolean;
}) {
  const [show, setShow] = useState(!secret);
  return (
    <div className="relative flex items-center w-full">
       <input
        type={show ? 'text' : 'password'}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-foreground/[0.02] px-3 py-2.5 rounded-md border border-foreground/[0.05] focus:border-foreground/20 text-right text-[11px] font-medium text-foreground placeholder:text-foreground/30 outline-none transition-colors pr-10"
      />
      {secret && (
        <button 
          onClick={() => setShow(!show)}
          className="absolute right-3 p-1 rounded-sm text-foreground/40 hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Partial<SettingsData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (saving) return; 
    setSaving(true);
    setSaveStatus('idle');

    const adminKeys: (keyof SettingsData)[] = [
        'shopDomain', 'accessToken', 'delhiveryApiKey',
        'razorpayKeyId', 'razorpayKeySecret',
        'shiprocketEmail', 'shiprocketToken', 'webhookSecret'
    ];

    const partialUpdate: any = { shopId: settings.id };
    adminKeys.forEach(key => {
        if (settings[key] !== undefined) partialUpdate[key] = settings[key];
    });

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialUpdate),
      });
      if (!res.ok) throw new Error('Update failed');
      setSaveStatus('success');
    } catch (err: any) {
      setSaveStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  const set = (key: keyof SettingsData) => (value: any) => setSettings(prev => ({ ...prev, [key]: value }));

  if (loading) return (
     <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="w-5 h-5 text-foreground/40 animate-spin" />
      <span className="text-[10px] font-medium uppercase tracking-widest text-foreground/40">Loading Settings...</span>
    </div>
  );

   return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto space-y-10 pb-20 relative z-10"
    >
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2 pt-4 relative z-10">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            Infrastructure
          </h1>
          <p className="text-[11px] text-foreground/50 tracking-wide max-w-xl">
            Secure configuration and API key management.
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-md text-[10px] font-medium tracking-[0.15em] uppercase transition-all ${
            saveStatus === 'success' ? 'bg-green-500 text-white' : 'bg-foreground text-background hover:opacity-90'
          } disabled:opacity-50`}
        >
          {saving ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : saveStatus === 'success' ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
             <Save className="w-3.5 h-3.5" />
          )}
          {saving ? 'Saving...' : saveStatus === 'success' ? 'Saved' : 'Save Config'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Shopify Group */}
        <SettingsGroup title="Shopify Integration" icon={Store}>
           <SettingsRow label="Store Domain" icon={Store} description="Primary endpoint (.myshopify.com)">
              <InputField value={settings.shopDomain!} onChange={set('shopDomain')} placeholder="store-name.myshopify.com" />
           </SettingsRow>
           <SettingsRow label="Admin Access Token" icon={Lock} description="Shp_ access key">
              <InputField value={settings.accessToken!} onChange={set('accessToken')} secret />
           </SettingsRow>
        </SettingsGroup>

        {/* Payments Group */}
        <SettingsGroup title="Payment Gateways" icon={CreditCard}>
           <SettingsRow label="Razorpay ID" icon={Key} description="Public merchant key">
              <InputField value={settings.razorpayKeyId!} onChange={set('razorpayKeyId')} />
           </SettingsRow>
           <SettingsRow label="Razorpay Secret" icon={Fingerprint} description="Private merchant secret">
              <InputField value={settings.razorpayKeySecret!} onChange={set('razorpayKeySecret')} secret />
           </SettingsRow>
        </SettingsGroup>

        {/* Logistics Group */}
        <SettingsGroup title="Logistics Services" icon={Truck}>
           <SettingsRow label="Delhivery API Key" icon={Zap} description="Primary logistics API">
              <InputField value={settings.delhiveryApiKey!} onChange={set('delhiveryApiKey')} secret />
           </SettingsRow>
           <SettingsRow label="Shiprocket Auth" icon={Zap} description="Cloud synchronization token">
              <InputField value={settings.shiprocketToken!} onChange={set('shiprocketToken')} secret />
           </SettingsRow>
        </SettingsGroup>

        {/* Security Hooks */}
        <SettingsGroup title="Webhooks" icon={Webhook}>
           <SettingsRow label="Webhook Secret" icon={Webhook} description="HMAC SHA256 validation">
              <InputField value={settings.webhookSecret!} onChange={set('webhookSecret')} secret />
           </SettingsRow>
        </SettingsGroup>

      </div>

      <div className="text-center pt-8">
         <div className="inline-flex items-center gap-2 px-4 py-2 border border-foreground/[0.05] rounded-md bg-background shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-semibold uppercase tracking-widest text-foreground/50">Configuration Locked</span>
         </div>
      </div>
    </motion.div>
  );
}
