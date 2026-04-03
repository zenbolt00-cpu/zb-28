"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, RefreshCw, Trash2, Edit2, Phone, MapPin, Building2, Search, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { mfgFetch } from "@/lib/manufacturing/mfg-fetch";

type Vendor = {
  id: string;
  name: string;
  address: string | null;
  mobile: string | null;
  category: string;
  createdAt: string;
  updatedAt: string;
};

const CATEGORIES = [
  "Fabric",
  "Buttons",
  "Threads",
  "Screen Printing",
  "Digital Printing",
  "Washing",
  "Embroidery",
  "Trimmings",
  "Labels & Tags",
  "Packing Material",
  "Logistics",
  "Other",
];

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [q, setQ] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    mobile: "",
    category: "Fabric",
    customCategory: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mfgFetch("/api/admin/manufacturing/vendors");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load vendors");
      setVendors(data);
    } catch (e: any) {
      showToast(e.message, "err");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return showToast("Name is required", "err");
    if (form.category === "Other" && !form.customCategory.trim()) {
      return showToast("Please specify the category", "err");
    }

    setSubmitting(true);
    try {
      const url = editingId 
        ? `/api/admin/manufacturing/vendors/${editingId}`
        : "/api/admin/manufacturing/vendors";
      const method = editingId ? "PUT" : "POST";

      const finalCategory = form.category === "Other" ? form.customCategory.trim() : form.category;

      const res = await mfgFetch(url, {
        method,
        body: JSON.stringify({
          ...form,
          category: finalCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      showToast(editingId ? "Vendor updated" : "Vendor added");
      setModalOpen(false);
      setEditingId(null);
      setForm({ name: "", address: "", mobile: "", category: "Fabric", customCategory: "" });
      loadVendors();
    } catch (e: any) {
      showToast(e.message, "err");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (v: Vendor) => {
    setEditingId(v.id);
    const isStandard = CATEGORIES.includes(v.category);
    setForm({
      name: v.name,
      address: v.address || "",
      mobile: v.mobile || "",
      category: isStandard ? v.category : "Other",
      customCategory: isStandard ? "" : v.category,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;

    try {
      const res = await mfgFetch(`/api/admin/manufacturing/vendors/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      showToast("Vendor deleted");
      loadVendors();
    } catch (e: any) {
      showToast(e.message, "err");
    }
  };

  const filteredVendors = vendors.filter((v) => {
    const matchesQ = v.name.toLowerCase().includes(q.toLowerCase()) || 
                    (v.category && v.category.toLowerCase().includes(q.toLowerCase()));
    const matchesCat = !filterCategory || v.category === filterCategory;
    return matchesQ && matchesCat;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="pb-20 space-y-10 relative z-10"
    >
      {/* Vibrant Orb Backgrounds */}
      <div className="absolute -right-24 -top-24 w-96 h-96 bg-foreground/5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -left-24 top-1/2 w-72 h-72 bg-foreground/5 blur-3xl rounded-full pointer-events-none" />

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-8 left-1/2 z-[200] max-w-[90vw] w-max px-4 py-3 rounded-[1rem] text-[12px] font-bold shadow-2xl flex items-center justify-center gap-2 border backdrop-blur-xl ${
              toast.type === "ok" 
                ? "bg-background/90 text-foreground border-foreground/10" 
                : "bg-rose-500 text-white border-rose-500/20"
            }`}
          >
            {toast.type === "ok" && <Check className="w-4 h-4 text-emerald-500" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 px-4 pt-4 mb-12 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-2 lg:mb-6">
            <div className="w-14 h-14 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground/50 dark:text-foreground/30 border border-foreground/5 shadow-2xl">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground uppercase tracking-tighter leading-none">
                Vendors
              </h1>
              <p className="text-[11px] text-foreground/50 dark:text-foreground/30 font-bold uppercase tracking-[0.4em] mt-2">
                Manufacturing Partners
              </p>
            </div>
          </div>
          <p className="text-[11px] lg:text-[12px] text-foreground/70 tracking-wide max-w-xl font-medium leading-relaxed">
             Manage manufacturing partners, assign categories, and maintain contact info. Centralized directory for all production nodes.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           <button
            onClick={loadVendors}
            disabled={loading}
            className="flex items-center gap-3 px-6 py-3 bg-background dark:bg-white/[0.03] border border-foreground/[0.08] text-foreground rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-foreground/[0.02] disabled:opacity-50 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={2.5} />
            Refresh
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setForm({ name: "", address: "", mobile: "", category: "Fabric", customCategory: "" });
              setModalOpen(true);
            }}
            className="flex items-center gap-3 px-8 py-3 bg-foreground text-background rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] hover:opacity-90 disabled:opacity-50 transition-all active:scale-95 shadow-xl shadow-foreground/20"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Add Vendor
          </button>
        </div>
      </div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.8 }}
        className="glass-card rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-8 flex flex-col gap-6"
      >
        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="relative w-full max-w-md">
             <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search vendors..."
              className="w-full bg-background border border-foreground/10 rounded-xl pl-10 pr-4 py-3 text-[12px] font-medium text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-foreground/30 transition-all shadow-sm"
            />
          </div>

          <div className="bg-foreground/[0.02] rounded-xl p-1 border border-foreground/5 w-full lg:w-auto">
            <div className="flex overflow-x-auto custom-scrollbar gap-1 hide-scroll py-1 px-1">
              <button
                onClick={() => setFilterCategory(null)}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  !filterCategory
                    ? "bg-foreground text-background shadow-md"
                    : "text-foreground/60 hover:bg-foreground/[0.05] hover:text-foreground"
                }`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    filterCategory === cat
                      ? "bg-foreground text-background shadow-md"
                      : "text-foreground/60 hover:bg-foreground/[0.05] hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-foreground/5" />

        {loading && vendors.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-foreground/40" />
            <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-widest">Loading vendors...</p>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <Building2 className="w-12 h-12 text-foreground/20 mb-4" />
            <p className="text-[13px] font-bold text-foreground/60">No vendors found</p>
            <p className="text-[11px] text-foreground/40 mt-1">Adjust search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {filteredVendors.map((v, i) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                key={v.id}
                className="bg-background border border-foreground/[0.08] hover:border-foreground/20 rounded-[1.5rem] p-5 lg:p-6 shadow-sm hover:shadow-md transition-all group flex flex-col"
              >
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0 border border-foreground/10 group-hover:bg-foreground group-hover:text-background transition-colors duration-500">
                     <Building2 className="w-4 h-4 text-foreground/60 group-hover:text-background" strokeWidth={1.5} />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-foreground/[0.03] border border-foreground/[0.08] text-[9px] font-bold text-foreground/70 uppercase tracking-widest leading-none">
                    {v.category}
                  </span>
                </div>
                
                <h3 className="text-[15px] font-bold text-foreground leading-tight tracking-tight mb-4">
                  {v.name}
                </h3>
                
                <div className="space-y-3 flex-1 mb-6">
                  <div className="flex items-center gap-3 text-[11px] font-medium text-foreground/70">
                    <div className="w-6 h-6 rounded-md bg-foreground/5 flex items-center justify-center shrink-0"><Phone className="w-3 h-3 opacity-60" /></div>
                    <span className="truncate">{v.mobile || "No phone added"}</span>
                  </div>
                   <div className="flex items-start gap-3 text-[11px] font-medium text-foreground/70">
                    <div className="w-6 h-6 rounded-md bg-foreground/5 flex items-center justify-center shrink-0 mt-0.5"><MapPin className="w-3 h-3 opacity-60" /></div>
                    <span className="line-clamp-2 leading-snug">{v.address || "No address added"}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-foreground/[0.05]">
                  <button
                    onClick={() => openEdit(v)}
                    className="flex-1 px-3 py-2 bg-background border border-foreground/10 rounded-xl text-[10px] font-bold text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="px-3 py-2 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 rounded-xl flex items-center justify-center transition-colors text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 lg:p-6 bg-background/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg glass rounded-[2rem] border border-foreground/10 shadow-2xl p-6 lg:p-8 space-y-6 max-h-[92vh] overflow-y-auto"
            >
              <div>
                <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground">{editingId ? "Edit Vendor" : "Add Vendor"}</h2>
                <p className="text-[12px] text-foreground/60 mt-1 tracking-wide">Enter vendor details carefully.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 ml-1">Vendor Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Apex Textiles"
                    className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground/30 transition-all shadow-sm"
                  />
                </div>

                 <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 ml-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground/30 transition-all shadow-sm appearance-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {form.category === "Other" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 ml-1">Custom Category *</label>
                    <input
                      required
                      value={form.customCategory}
                      onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                      placeholder="e.g. Specialized Dyeing"
                      className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground/30 transition-all shadow-sm"
                    />
                  </motion.div>
                )}

                 <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 ml-1">Mobile</label>
                  <input
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground/30 transition-all shadow-sm font-mono"
                  />
                </div>

                 <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 ml-1">Address</label>
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    rows={3}
                    placeholder="Street address, City, Pincode"
                    className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground/30 transition-all shadow-sm resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-background border border-foreground/10 rounded-xl text-[11px] font-bold text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-all shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={submitting}
                    type="submit"
                    className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-foreground text-background rounded-xl text-[11px] font-bold uppercase tracking-[0.1em] hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-foreground/10"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Save Changes" : "Create Vendor"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
