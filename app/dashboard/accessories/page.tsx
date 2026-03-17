"use client";

import { useState, useEffect } from 'react';
import {
  Save, CheckCircle, RefreshCw, Plus, Trash2, GripVertical, Image as ImageIcon, Loader2, Link as LinkIcon
} from 'lucide-react';
import { motion, Reorder } from 'framer-motion';

export interface AccessoryItem {
  id: string;
  title: string;
  price: string;
  description: string;
  image: string;
  gallery: string[]; // comma separated or array
  link: string; // usually auto-generated
}

export default function AccessoriesAdminPage() {
  const [items, setItems] = useState<AccessoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [shopId, setShopId] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setShopId(data.id);
        if (data.ringCarouselItems) {
          try {
            const parsed = JSON.parse(data.ringCarouselItems);
            setItems(Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            setItems([]);
          }
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (saving || !shopId) return;
    setSaving(true);
    setSaveStatus('idle');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          ringCarouselItems: JSON.stringify(items)
        }),
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

  const addItem = () => {
    const newItem: AccessoryItem = {
      id: Date.now().toString(),
      title: 'New Accessory',
      price: '0.00',
      description: 'A beautiful piece',
      image: '',
      gallery: [],
      link: `/accessories/${Date.now()}`
    };
    setItems([newItem, ...items]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof AccessoryItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        if (field === 'title') {
          // Auto update link based on title if desired, but here we just use the ID for the link
          return { ...item, [field]: value, link: `/accessories/${item.id}` };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="w-5 h-5 text-foreground/40 animate-spin" />
      <span className="text-[10px] font-medium uppercase tracking-widest text-foreground/40">Loading Accessories...</span>
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
            Accessories & Rings
          </h1>
          <p className="text-[11px] text-foreground/50 tracking-wide max-w-xl">
            Manage the ring collection carousel items and their product page details.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={addItem}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-[10px] font-medium tracking-[0.15em] uppercase transition-all bg-foreground/[0.05] hover:bg-foreground/[0.1] text-foreground"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New
          </button>

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
      </div>

      <div className="bg-background border border-foreground/[0.05] rounded-xl p-6 shadow-sm relative overflow-hidden">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-foreground/40">
            <ImageIcon className="w-8 h-8 mb-4 opacity-50" />
            <p className="text-[11px] uppercase tracking-widest font-medium">No accessories found</p>
            <p className="text-[10px] mt-2">Click "Add New" to build your collection.</p>
          </div>
        ) : (
          <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-4">
            {items.map((item) => (
              <Reorder.Item 
                key={item.id} 
                value={item}
                className="bg-foreground/[0.02] border border-foreground/[0.05] p-5 rounded-lg relative group cursor-grab active:cursor-grabbing flex flex-col md:flex-row gap-6"
              >
                <div className="md:w-[200px] shrink-0 flex flex-col gap-3">
                  <div className="aspect-square bg-foreground/5 rounded-md border border-foreground/[0.05] flex items-center justify-center overflow-hidden relative">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-foreground/20" />
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Primary Image URL"
                    value={item.image}
                    onChange={(e) => updateItem(item.id, 'image', e.target.value)}
                    className="w-full bg-background px-3 py-2 rounded-md border border-foreground/[0.05] text-[10px] text-foreground outline-none"
                  />
                </div>

                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="w-full grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-semibold uppercase tracking-widest text-foreground/50 mb-1 block">Title</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                            className="w-full bg-background px-3 py-2.5 rounded-md border border-foreground/[0.05] text-[12px] font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-semibold uppercase tracking-widest text-foreground/50 mb-1 block">Price (INR)</label>
                          <input
                            type="text"
                            value={item.price}
                            onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                            className="w-full bg-background px-3 py-2.5 rounded-md border border-foreground/[0.05] text-[12px] font-medium"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-[9px] font-semibold uppercase tracking-widest text-foreground/50 mb-1 block">Description</label>
                        <textarea
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          rows={2}
                          className="w-full bg-background px-3 py-2.5 rounded-md border border-foreground/[0.05] text-[11px] font-medium resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-semibold uppercase tracking-widest text-foreground/50 mb-1 block">Gallery URLs (comma separated)</label>
                        <input
                          type="text"
                          value={item.gallery?.join(', ') || ''}
                          onChange={(e) => {
                            const urls = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                            updateItem(item.id, 'gallery', urls);
                          }}
                          placeholder="https://img1.jpg, https://img2.jpg"
                          className="w-full bg-background px-3 py-2.5 rounded-md border border-foreground/[0.05] text-[10px]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 ml-4 self-stretch">
                       <GripVertical className="w-4 h-4 text-foreground/20 hover:text-foreground/60 transition-colors" />
                       <div className="flex-1" />
                       <button
                         onClick={() => removeItem(item.id)}
                         className="p-1.5 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-foreground/[0.05] flex items-center gap-2">
                     <LinkIcon className="w-3 h-3 text-foreground/40" />
                     <span className="text-[9px] text-foreground/50 font-mono">{item.link}</span>
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>
    </motion.div>
  );
}
