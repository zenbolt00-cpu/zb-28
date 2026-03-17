"use client";

import { useState, useEffect } from 'react';
import {
  Save, CheckCircle, AlertCircle, RefreshCw,
  Layout, Sparkles, Box, ChevronRight, Image as ImageIcon, Type, MapPin
} from 'lucide-react';

interface SettingsData {
  id: string;
  flipbookConfig: string;
}

// iOS Style Group Container
 function SettingsGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      {title && <h3 className="px-4 text-[8px] font-black uppercase tracking-[0.3em] text-foreground/20 dark:text-white/20">{title}</h3>}
      <div className="bg-white/50 dark:bg-white/[0.02] backdrop-blur-3xl border border-foreground/[0.05] rounded-xl px-4 py-0.5 shadow-sm">
        {children}
      </div>
    </div>
  );
}

// iOS Style Grouped Row
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
    <div className="flex items-center justify-between py-2.5 px-0.5 border-b border-foreground/[0.03] last:border-0 group/row">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-6 h-6 rounded-lg bg-foreground/[0.02] flex items-center justify-center text-foreground/20 group-hover/row:text-foreground/50 transition-colors">
            <Icon className="w-3 h-3" />
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[11px] font-black tracking-tight text-foreground dark:text-white/90">{label}</span>
          {description && <span className="text-[8px] text-foreground/40 dark:text-white/30 font-bold uppercase tracking-[0.1em] leading-none mt-0.5">{description}</span>}
        </div>
      </div>
      <div className="flex-1 max-w-[200px] flex justify-end">
        {children}
      </div>
    </div>
  );
}

// iOS Style Input
 function InputField({
  value,
  onChange,
  placeholder,
  className
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-transparent text-right text-[11px] font-black text-foreground placeholder-foreground/5 focus:outline-none transition-all ${className}`}
    />
  );
}

const safeParseArray = (val: any) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export default function ThreeDContentPage() {
  const [settings, setSettings] = useState<Partial<SettingsData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

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

    const partialUpdate = { 
        shopId: settings.id,
        flipbookConfig: settings.flipbookConfig || '[]'
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialUpdate),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Sync failed');
      }
      
      setSaveStatus('success');
    } catch (err: any) {
      setSaveStatus('error');
      setSaveError(err.message);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus('idle'), 6000);
    }
  };

   if (loading) return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-foreground/20 font-black text-[10px] tracking-[0.3em] uppercase animate-pulse space-y-4">
      <div className="w-10 h-10 rounded-full border-2 border-foreground/5 border-t-foreground/10 animate-spin" />
      Syncing Archive Projection...
    </div>
  );

  const cards = safeParseArray(settings.flipbookConfig);
  const defaultCards = [
    { imgUrl: "", tag: "Winter 2026", title: "Dystra Vision", desc: "", accent: "#e85d26", href: "/search" },
    { imgUrl: "", tag: "Limited Drop", title: "Precision Cut", desc: "", accent: "#ffffff", href: "/search" },
    { imgUrl: "", tag: "Archive", title: "Relentless Focus", desc: "", accent: "#e85d26", href: "/search" },
  ];
  const displayCards = cards.length === 3 ? cards : defaultCards;

  return (
    <div className="max-w-[700px] mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-1000 pb-20">
      
      {/* iOS Header */}
       {/* iOS Header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="space-y-1">
          <h1 className="text-xl font-black tracking-tight text-foreground mb-0.5 lowercase leading-none">3d visual engine</h1>
          <p className="text-[9px] text-foreground/40 dark:text-white/30 font-black uppercase tracking-[0.2em]">Archive Perspective Control</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all active:scale-95 ${
            saveStatus === 'success' ? 'bg-[#34C759] text-white' : 'bg-foreground text-background shadow-lg shadow-foreground/10'
          } disabled:opacity-50`}
        >
          {saving ? 'Syncing...' : saveStatus === 'success' ? 'Synchronized' : 'Apply Config'}
        </button>
      </div>

       {saveStatus === 'error' && (
        <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3 text-[9px] font-black uppercase tracking-widest text-rose-500">
          System error: {saveError}
        </div>
      )}

       <div className="space-y-4">
        {displayCards.map((card: any, idx: number) => (
          <SettingsGroup key={idx} title={`Visual Layer 0${idx + 1}`}>
             <SettingsRow label="Visual Asset" icon={ImageIcon} description="Target layer texture">
                <InputField 
                    value={card.imgUrl} 
                    onChange={(v) => {
                        const next = [...displayCards];
                        next[idx] = { ...next[idx], imgUrl: v };
                        setSettings(p => ({ ...p, flipbookConfig: JSON.stringify(next) }));
                    }}
                    placeholder="https://..."
                />
             </SettingsRow>
             <SettingsRow label="Editorial Title" icon={Type} description="Primary heading">
                <InputField 
                    value={card.title} 
                    onChange={(v) => {
                        const next = [...displayCards];
                        next[idx] = { ...next[idx], title: v };
                        setSettings(p => ({ ...p, flipbookConfig: JSON.stringify(next) }));
                    }}
                />
             </SettingsRow>
             <SettingsRow label="Temporal Tag" icon={Sparkles} description="Collection seasonal metadata">
                <InputField 
                    value={card.tag} 
                    onChange={(v) => {
                        const next = [...displayCards];
                        next[idx] = { ...next[idx], tag: v };
                        setSettings(p => ({ ...p, flipbookConfig: JSON.stringify(next) }));
                    }}
                />
             </SettingsRow>
             <SettingsRow label="Navigation Path" icon={MapPin} description="Internal link route">
                <InputField 
                    value={card.href} 
                    onChange={(v) => {
                        const next = [...displayCards];
                        next[idx] = { ...next[idx], href: v };
                        setSettings(p => ({ ...p, flipbookConfig: JSON.stringify(next) }));
                    }}
                    placeholder="/search"
                />
             </SettingsRow>
          </SettingsGroup>
        ))}
      </div>

      {/* Cinematic Engine Note */}
      <div className="text-center space-y-2 opacity-20">
         <Box className="w-5 h-5 mx-auto" />
         <p className="text-[9px] font-bold uppercase tracking-[0.4em]">Center-Tear Engine Active</p>
      </div>
    </div>
  );
}
