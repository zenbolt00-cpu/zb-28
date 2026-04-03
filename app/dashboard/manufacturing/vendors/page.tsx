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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1500px] mx-auto pb-12 pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div className="space-y-1">
          <div className="px-2 py-0.5 bg-foreground/[0.03] rounded-md text-[7px] font-normal text-foreground/50 uppercase tracking-[0.3em] w-fit tracking-widest font-inter">manufacturing hub</div>
          <h1 className="text-lg font-normal text-foreground uppercase tracking-[0.2em] mb-0.5 leading-none mt-1 font-inter">
            Vendors & Partners
          </h1>
          <p className="text-[9px] text-foreground/40 font-normal uppercase tracking-[0.2em] mt-1">
            Spectrum Node Directory — {vendors.length} registered manufacturing terminals. Immutable partner ledger.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadVendors}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-foreground/[0.05] rounded-md text-[8px] font-normal uppercase tracking-[0.2em] text-foreground/80 dark:text-foreground/60 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} strokeWidth={1.5} />
            REFRESH
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({ name: "", address: "", mobile: "", category: "Fabric", customCategory: "" });
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background border border-foreground rounded-md text-[8px] font-normal uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-foreground/5"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            ADD VENDOR
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="SEARCH SPECTRUM PARTNERS…"
          className="w-full max-w-md bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-4 py-2 text-[10px] font-normal text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em]"
        />

        <div className="bg-white/50 dark:bg-white/[0.01] backdrop-blur-3xl rounded-[1rem] p-1 border border-foreground/[0.02] shadow-sm">
          <div className="flex overflow-x-auto scrollbar-hide py-1 px-1 gap-1">
            <button
              onClick={() => setFilterCategory(null)}
              className={`px-4 py-2 rounded-md text-[7px] font-normal uppercase tracking-[0.3em] whitespace-nowrap transition-all duration-300 border ${
                !filterCategory
                  ? "bg-foreground text-background border-foreground shadow-lg shadow-foreground/5"
                  : "text-foreground/40 border-transparent hover:bg-foreground/[0.03] hover:text-foreground/60"
              }`}
            >
              ALL NODES
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-md text-[7px] font-normal uppercase tracking-[0.3em] whitespace-nowrap transition-all duration-300 border ${
                  filterCategory === cat
                    ? "bg-foreground text-background border-foreground shadow-lg shadow-foreground/5"
                    : "text-foreground/40 border-transparent hover:bg-foreground/[0.03] hover:text-foreground/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && vendors.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-foreground/20" strokeWidth={1} />
          <p className="text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em]">Synching with directory…</p>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="bg-white/50 dark:bg-white/[0.01] backdrop-blur-3xl rounded-[1rem] border border-dashed border-foreground/[0.05] py-20 px-6 text-center">
          <p className="text-foreground/40 text-[9px] uppercase tracking-[0.2em] max-w-md mx-auto">
            No partner nodes match the current spectrum filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVendors.map((v) => (
            <div
              key={v.id}
              className="group bg-white/50 dark:bg-white/[0.01] backdrop-blur-3xl rounded-[1rem] border border-foreground/[0.05] shadow-sm hover:border-foreground/10 transition-all duration-500 overflow-hidden flex flex-col"
            >
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1">
                    <div className="text-[7px] font-normal text-foreground/30 uppercase tracking-[0.3em]">Node Type</div>
                    <span className="px-2 py-0.5 rounded-md bg-foreground/[0.03] border border-foreground/[0.05] text-[7px] font-normal text-foreground/60 uppercase tracking-[0.2em]">
                      {v.category}
                    </span>
                  </div>
                  <Building2 className="w-4 h-4 text-foreground/10 group-hover:text-foreground/20 transition-colors" strokeWidth={1} />
                </div>
                
                <h3 className="text-[13px] font-normal text-foreground uppercase tracking-[0.05em] mt-5 leading-tight font-inter truncate">
                  {v.name}
                </h3>
                
                <p className="text-[8px] text-foreground/20 uppercase tracking-widest mt-1.5">
                  ID: {v.id.slice(-8).toUpperCase()} // EST. {new Date(v.createdAt).getFullYear()}
                </p>

                <div className="mt-6 space-y-3 flex-1">
                  <div className="space-y-1">
                    <div className="text-[7px] font-normal text-foreground/20 uppercase tracking-[0.3em]">Telecom Node</div>
                    <div className="flex items-center gap-2 text-[10px] text-foreground/60 tabular-nums">
                      <Phone className="w-2.5 h-2.5 opacity-30" strokeWidth={1.5} />
                      {v.mobile || "NULL_TERMINAL"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[7px] font-normal text-foreground/20 uppercase tracking-[0.3em]">Geospatial Link</div>
                    <div className="flex items-start gap-2 text-[10px] text-foreground/60 leading-relaxed uppercase tracking-tight line-clamp-2">
                      <MapPin className="w-2.5 h-2.5 opacity-30 mt-0.5" strokeWidth={1.5} />
                      {v.address || "NULL_COORDINATES"}
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex gap-1.5">
                  <button
                    onClick={() => openEdit(v)}
                    className="flex-1 px-3 py-2 bg-foreground/[0.03] border border-foreground/[0.05] rounded-md text-[7px] font-normal uppercase tracking-[0.2em] text-foreground/40 hover:text-foreground/80 transition-all hover:bg-foreground/[0.05] flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                    Modify
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="px-3 py-2 bg-rose-500/[0.03] border border-rose-500/[0.05] rounded-md text-[7px] font-normal uppercase tracking-[0.2em] text-rose-500/40 hover:text-rose-500/80 transition-all hover:bg-rose-500/[0.05]"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
          {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-white/90 dark:bg-black/80 backdrop-blur-2xl rounded-[1rem] border border-foreground/[0.05] shadow-2xl p-6 space-y-6 max-h-[92vh] overflow-y-auto font-inter">
            <div className="space-y-1">
              <h2 className="text-[11px] font-normal text-foreground uppercase tracking-[0.2em] leading-none">{editingId ? "MODIFY SPECTRUM PARTNER" : "INITIATE PARTNER NODE"}</h2>
              <p className="text-[9px] text-foreground/40 uppercase tracking-[0.2em]">Partner metrics will be synchronized across the spectrum ledger.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Partner Nomenclature *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="E.G. APEX TEXTILES"
                  className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Functional Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em] appearance-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {form.category === "Other" && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Custom Protocol *</label>
                  <input
                    required
                    value={form.customCategory}
                    onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                    placeholder="E.G. SPECIALIZED DYEING"
                    className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em]"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Telecom Link</label>
                <input
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="+91 00000 00000"
                  className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all font-inter"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[7px] font-normal text-foreground/40 uppercase tracking-[0.3em] ml-1">Geospatial Coordinates</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={3}
                  placeholder="STREET, CITY, PINCODE"
                  className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-md px-3 py-2 text-[10px] font-normal text-foreground focus:outline-none focus:border-foreground/10 transition-all uppercase tracking-[0.1em]"
                />
              </div>

              <div className="flex gap-2 justify-end pt-6 border-t border-foreground/[0.05]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2 rounded-md text-[8px] font-normal uppercase tracking-[0.2em] text-foreground/40 hover:text-foreground/60 transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  type="submit"
                  className="px-8 py-2 bg-foreground text-background rounded-md text-[8px] font-normal uppercase tracking-[0.3em] shadow-lg shadow-foreground/5 hover:opacity-90 disabled:opacity-50 transition-all font-inter"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : editingId ? (
                    "COMMIT CHANGES"
                  ) : (
                    "INITIATE PARTNER"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-[2rem] text-[10px] font-normal uppercase tracking-[0.2em] shadow-2xl animate-in fade-in slide-in-from-bottom-4 border border-foreground/[0.05] backdrop-blur-xl ${
            toast?.type === "ok"
              ? "bg-foreground text-background"
              : "bg-rose-500 text-white"
          }`}
        >
          {toast?.msg}
        </div>
      )}
    </div>
  );
}
