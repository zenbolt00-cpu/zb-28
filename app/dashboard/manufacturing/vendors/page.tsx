"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, RefreshCw, Trash2, Edit2, Phone, MapPin, Building2, Search } from "lucide-react";
import { mfgFetch } from "@/lib/manufacturing/mfg-fetch";
import { formatDateTimeIST } from "@/lib/manufacturing/ist";

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
    <div className="w-full space-y-6 sm:space-y-8 pb-12 pt-4 lg:pt-10 max-w-[1500px] mx-auto overflow-x-hidden lg:overflow-visible">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground uppercase tracking-tighter leading-none">
            Manufacturing Vendors
          </h1>
          <p className="text-sm text-foreground/55 mt-1 max-w-2xl">
            Manage your fabric suppliers, printers, dyers, and other manufacturing partners.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadVendors}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-foreground/10 text-xs font-semibold hover:bg-foreground/5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({ name: "", address: "", mobile: "", category: "Fabric", customCategory: "" });
              setModalOpen(true);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-foreground text-background text-xs font-bold shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add vendor
          </button>
        </div>
      </header>

      {/* Filters */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search vendors..."
            className="w-full rounded-2xl border border-foreground/10 bg-foreground/[0.04] pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-foreground/15 outline-none transition-shadow"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 w-full lg:w-auto scrollbar-thin px-1 -mx-1">
          <button
            onClick={() => setFilterCategory(null)}
            className={`px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
              !filterCategory 
                ? "bg-foreground text-background border-foreground shadow-md" 
                : "bg-foreground/5 text-foreground/60 border-transparent hover:border-foreground/20"
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                filterCategory === cat 
                  ? "bg-foreground text-background border-foreground shadow-md" 
                  : "bg-foreground/5 text-foreground/60 border-transparent hover:border-foreground/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {loading && vendors.length === 0 ? (
        <div className="py-24 flex justify-center text-foreground/40">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-foreground/15 bg-foreground/[0.02] py-20 px-6 text-center">
          <p className="text-foreground/50 text-sm max-w-md mx-auto">
            No vendors found. Add your first manufacturing vendor to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredVendors.map((v) => (
            <article
              key={v.id}
              className="group rounded-3xl border border-foreground/10 bg-gradient-to-b from-foreground/[0.04] to-transparent shadow-lg hover:shadow-xl hover:border-foreground/20 transition-all duration-300 overflow-hidden relative"
            >
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground/40 group-hover:text-foreground/70 transition-colors">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-foreground/5 border border-foreground/10 text-[10px] font-bold text-foreground/60">
                    {v.category}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg leading-tight truncate">{v.name}</h3>
                  <p className="text-[10px] text-foreground/30 mt-1 uppercase tracking-wider font-semibold">
                    Added {formatDateTimeIST(v.createdAt)}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-xs text-foreground/60">
                    <Phone className="w-3.5 h-3.5 shrink-0 opacity-40" />
                    <span className="truncate">{v.mobile || "No mobile number"}</span>
                  </div>
                  <div className="flex items-start gap-3 text-xs text-foreground/60">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-40" />
                    <span className="line-clamp-2 leading-relaxed">{v.address || "No address provided"}</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => openEdit(v)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-foreground/5 text-foreground/60 hover:bg-foreground/10 hover:text-foreground text-[11px] font-bold transition-all"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="inline-flex items-center justify-center p-2 rounded-xl bg-red-500/5 text-red-500/60 hover:bg-red-500/10 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl sm:rounded-[2.5rem] border border-foreground/10 glass shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            <div>
              <h2 className="text-xl font-bold">{editingId ? "Edit vendor" : "Add new vendor"}</h2>
              <p className="text-xs text-foreground/45 mt-1">
                Enter vendor details carefully. These will be used in the manufacturing flows.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/40 ml-1">
                  Vendor Name *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Apex Textiles"
                  className="w-full rounded-2xl border border-foreground/10 bg-foreground/[0.04] px-4 py-3 text-sm focus:ring-2 focus:ring-foreground/15 outline-none transition-shadow"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/40 ml-1">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-2xl border border-foreground/10 bg-foreground/[0.04] px-4 py-3 text-sm focus:ring-2 focus:ring-foreground/15 outline-none transition-shadow appearance-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {form.category === "Other" && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/40 ml-1">
                    Please Specify *
                  </label>
                  <input
                    required
                    value={form.customCategory}
                    onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                    placeholder="e.g. Specialized Dyeing"
                    className="w-full rounded-2xl border border-foreground/10 bg-foreground/[0.04] px-4 py-3 text-sm focus:ring-2 focus:ring-foreground/15 outline-none transition-shadow"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/40 ml-1">
                  Mobile Number
                </label>
                <input
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-2xl border border-foreground/10 bg-foreground/[0.04] px-4 py-3 text-sm focus:ring-2 focus:ring-foreground/15 outline-none transition-shadow"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/40 ml-1">
                  Address
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={3}
                  placeholder="Street address, City, Pincode"
                  className="w-full rounded-2xl border border-foreground/10 bg-foreground/[0.04] px-4 py-3 text-sm focus:ring-2 focus:ring-foreground/15 outline-none transition-shadow"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-2xl border border-foreground/10 text-xs font-bold hover:bg-foreground/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  type="submit"
                  className="flex-[2] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-foreground text-background text-xs font-bold shadow-lg hover:opacity-90 disabled:opacity-50 transition-all font-inter"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingId ? (
                    "Save changes"
                  ) : (
                    "Add vendor"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-[2rem] text-sm font-bold shadow-2xl backdrop-blur-xl border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 ${
            toast?.type === "ok"
              ? "bg-emerald-500/90 text-white"
              : "bg-red-500/90 text-white"
          }`}
        >
          {toast?.msg}
        </div>
      )}
    </div>
  );
}
