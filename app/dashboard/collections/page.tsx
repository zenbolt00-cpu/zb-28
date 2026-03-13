"use client";

import { useState, useEffect } from "react";
import { 
  Package, 
  Save, 
  Search,
  Check,
  Loader2,
  PanelTop,
  Layers,
  Menu as MenuIcon,
  Eye,
  EyeOff
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function CollectionsAdminPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [enabled, setEnabled] = useState<{
    header: string[];
    page: string[];
    menu: string[];
  }>({
    header: [],
    page: [],
    menu: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/admin/collections");
      const data = await res.json();
      if (data.allCollections) {
        setCollections(data.allCollections);
        setEnabled(data.enabled);
      }
    } catch (err) {
      console.error("Failed to fetch collections:", err);
    } finally {
      setLoading(false);
    }
  }

  const toggleLocation = (handle: string, location: 'header' | 'page' | 'menu') => {
    setEnabled(prev => ({
      ...prev,
      [location]: prev[location].includes(handle)
        ? prev[location].filter(h => h !== handle)
        : [...prev[location], handle]
    }));
  };

  const saveChanges = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enabled),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save changes:", err);
    } finally {
      setSaving(false);
    }
  };

  const filteredCollections = collections.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Synchronizing Collections...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      {/* Header Area */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-rocaston text-2xl tracking-widest text-foreground uppercase mb-2">Collection Visibility</h1>
          <p className="text-xs text-muted-foreground max-w-md">
            Control exactly where each collection is displayed on your storefront. 
            Enable collections specifically for the header slider, main collections page, or navigation menu.
          </p>
        </div>
        
        <button 
          onClick={saveChanges}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
            success 
              ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
              : "bg-foreground text-background shadow-xl shadow-foreground/10 hover:opacity-90 active:scale-95 disabled:opacity-50"
          }`}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : success ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? "Saving..." : success ? "Settings Saved" : "Save Changes"}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative group max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
        <input 
          type="text" 
          placeholder="Filter collections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-foreground/5 border border-foreground/5 focus:border-foreground/20 focus:bg-foreground/10 transition-all outline-none text-sm placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Collections Table-like Grid */}
      <div className="glass border border-foreground/5 rounded-[2.5rem] overflow-hidden">
        <div className="grid grid-cols-[1fr,100px,100px,100px] gap-4 px-8 py-5 border-b border-foreground/5 bg-foreground/[0.02]">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Collection & Info</span>
          <div className="flex items-center justify-center gap-2">
            <PanelTop className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Header</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Layers className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">List</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <MenuIcon className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Menu</span>
          </div>
        </div>

        <div className="divide-y divide-foreground/[0.03]">
          <AnimatePresence mode="popLayout">
            {filteredCollections.map((collection) => (
              <motion.div
                layout
                key={collection.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-[1fr,100px,100px,100px] gap-4 px-8 py-4 items-center hover:bg-foreground/[0.01] transition-colors"
              >
                {/* Collection Info */}
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-foreground/5">
                    {collection.image?.src ? (
                      <Image 
                        src={collection.image.src} 
                        alt={collection.title} 
                        fill 
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-foreground/10" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground">{collection.title}</h3>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest">{collection.products?.length || 0} Pieces</p>
                  </div>
                </div>

                {/* Toggles */}
                <VisibilityToggle 
                  active={enabled.header.includes(collection.handle)}
                  onClick={() => toggleLocation(collection.handle, 'header')}
                />
                <VisibilityToggle 
                  active={enabled.page.includes(collection.handle)}
                  onClick={() => toggleLocation(collection.handle, 'page')}
                />
                <VisibilityToggle 
                  active={enabled.menu.includes(collection.handle)}
                  onClick={() => toggleLocation(collection.handle, 'menu')}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {filteredCollections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">No Collections Found</p>
        </div>
      )}
    </div>
  );
}

function VisibilityToggle({ active, onClick }: { active: boolean, onClick: () => void }) {
  return (
    <div className="flex justify-center">
      <button 
        onClick={onClick}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border ${
          active 
            ? "bg-foreground text-background border-foreground shadow-lg shadow-foreground/10" 
            : "bg-background text-muted-foreground/30 border-foreground/5 hover:border-foreground/10 hover:text-muted-foreground/60"
        }`}
      >
        {active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
    </div>
  );
}
