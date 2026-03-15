"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2, 
  ExternalLink,
  MessageSquare,
  Star,
  RefreshCw,
  Plus,
  Save,
  Trash
} from "lucide-react";
import Image from "next/image";

interface FeaturedUser {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
  styleDescription: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isTopFeatured: boolean;
  orderId?: string | null;
  createdAt: string;
  reviews: any[];
}

export default function FeaturedUsersModeration() {
  const [submissions, setSubmissions] = useState<FeaturedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubmission, setNewSubmission] = useState({
    name: '',
    email: '',
    imageUrl: '',
    styleDescription: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/featured-users");
      if (!res.ok) throw new Error("Failed to fetch submissions");
      const data = await res.json();
      if (data.users) setSubmissions(data.users);
      else if (data.error) throw new Error(data.error);
    } catch (err) {
      console.error("Fetch submissions error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await fetch(`/api/admin/featured-users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchSubmissions();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleTopFeatured = async (id: string, current: boolean) => {
    const featuredCount = submissions.filter(s => s.isTopFeatured).length;
    if (!current && featuredCount >= 20) {
      alert("You can only feature up to 20 users on the homepage. Please unfeature someone first.");
      return;
    }

    setUpdatingId(id);
    try {
      await fetch(`/api/admin/featured-users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTopFeatured: !current }),
      });
      fetchSubmissions();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;
    setUpdatingId(id);
    try {
      await fetch(`/api/admin/featured-users/${id}`, { method: 'DELETE' });
      fetchSubmissions();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateSubmission = async () => {
    if (!newSubmission.name || !newSubmission.email || !newSubmission.imageUrl) {
      alert("Please fill in all required fields (Name, Email, Image URL).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/featured-users", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubmission),
      });

      if (!res.ok) throw new Error("Failed to create submission");

      setNewSubmission({ name: '', email: '', imageUrl: '', styleDescription: '' });
      setShowCreateModal(false);
      fetchSubmissions();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const featuredTopCount = submissions.filter(s => s.isTopFeatured).length;

  if (loading && submissions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Loading community submissions...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Community Moderation</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-muted-foreground text-sm">Approve and curate the homepage showcase.</p>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${featuredTopCount >= 20 ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              {featuredTopCount}/20 Featured
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Create Submission
          </button>
          <a 
            href="/community" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Live Community
          </a>
          <div className="flex items-center gap-2 px-4 py-2 bg-foreground/5 rounded-xl border border-foreground/10">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{submissions.length} Submissions</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {submissions.map((item) => (
          <div key={item.id} className={`glass-card rounded-2xl overflow-hidden border transition-all hover:scale-[1.01] ${
            item.isTopFeatured ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-background border-emerald-500/50' :
            item.status === 'APPROVED' ? 'border-emerald-500/20' : 
            item.status === 'REJECTED' ? 'border-red-500/20' : 'border-foreground/10'
          }`}>
            <div className="relative aspect-[4/5] bg-foreground/5">
              <Image src={item.imageUrl || "/placeholder.png"} alt={item.name} fill className="object-cover" />
              <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 ${
                  item.status === 'APPROVED' ? 'bg-emerald-500 text-white' : 
                  item.status === 'REJECTED' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
                }`}>
                  {item.status === 'APPROVED' ? <CheckCircle className="w-3 h-3" /> : 
                   item.status === 'REJECTED' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {item.status}
                </span>
                {item.isTopFeatured && (
                  <span className="bg-emerald-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl animate-pulse">
                    TOP 20
                  </span>
                )}
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">{item.name}</h3>
                  <span className="text-[10px] text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-muted-foreground underline truncate max-w-[120px]">{item.email}</p>
                  {item.orderId && (
                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                      OrderID: {item.orderId.substring(0, 8)}...
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-foreground/5 rounded-xl border border-foreground/5 italic text-[11px] text-muted-foreground/80 leading-relaxed min-h-[50px]">
                "{item.styleDescription || "No style description provided."}"
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <button 
                    disabled={updatingId === item.id || item.status === 'APPROVED'}
                    onClick={() => handleUpdateStatus(item.id, 'APPROVED')}
                    className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-30"
                    title="Approve"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button 
                    disabled={updatingId === item.id || item.status === 'REJECTED'}
                    onClick={() => handleUpdateStatus(item.id, 'REJECTED')}
                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-30"
                    title="Reject"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                  <div className="w-[1px] h-6 bg-foreground/10 mx-1" />
                  <button 
                    disabled={updatingId === item.id || item.status !== 'APPROVED'}
                    onClick={() => handleToggleTopFeatured(item.id, item.isTopFeatured)}
                    className={`p-2 rounded-lg transition-all flex items-center gap-2 ${
                      item.isTopFeatured 
                        ? 'bg-emerald-500 text-white shadow-lg' 
                        : 'bg-foreground/5 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500'
                    }`}
                    title={item.isTopFeatured ? "Remove from Home" : "Feature on Home"}
                  >
                    <Star className={`w-4 h-4 ${item.isTopFeatured ? 'fill-white' : ''}`} />
                    <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:inline">
                      {item.isTopFeatured ? 'Featured' : 'Feature'}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    disabled={updatingId === item.id}
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg bg-foreground/5 text-muted-foreground hover:bg-red-500 hover:text-white transition-all"
                    title="Delete Permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <a 
                    href={item.imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-foreground/5 text-muted-foreground hover:bg-blue-500 hover:text-white transition-all"
                    title="View Original Image"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {submissions.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground/30 border-2 border-dashed border-foreground/5 rounded-3xl">
          <Users className="w-12 h-12 mb-4 opacity-10" />
          <p className="text-sm font-medium">No community submissions to moderate yet.</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-foreground/10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-foreground/5 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Plus className="w-5 h-5" />
                New Community Submission
              </h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Name</label>
                <input
                  type="text"
                  placeholder="Reviewer Name"
                  value={newSubmission.name}
                  onChange={e => setNewSubmission(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                <input
                  type="email"
                  placeholder="Email address"
                  value={newSubmission.email}
                  onChange={e => setNewSubmission(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Image</label>
                
                {/* File Upload Area */}
                {!newSubmission.imageUrl ? (
                  <label className="flex flex-col items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-foreground/10 rounded-2xl cursor-pointer hover:border-foreground/20 hover:bg-foreground/[0.02] transition-all group">
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsSubmitting(true);
                        try {
                          const fd = new FormData();
                          fd.append('file', file);
                          const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
                          const data = await res.json();
                          if (data.url) {
                            setNewSubmission(prev => ({ ...prev, imageUrl: data.url }));
                          } else {
                            alert(data.error || 'Upload failed');
                          }
                        } catch (err) {
                          alert('Upload failed. Please try again.');
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                    />
                    {isSubmitting ? (
                      <RefreshCw className="w-5 h-5 text-foreground/30 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-5 h-5 text-foreground/20 group-hover:text-foreground/40 transition-colors" />
                        <span className="text-[10px] text-foreground/30 group-hover:text-foreground/50 transition-colors uppercase tracking-widest">Click to upload image</span>
                        <span className="text-[9px] text-foreground/15">JPG, PNG, WebP up to 10MB</span>
                      </>
                    )}
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden aspect-[3/2] bg-foreground/5 border border-foreground/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={newSubmission.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewSubmission(prev => ({ ...prev, imageUrl: '' }))}
                      className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* OR URL fallback */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-[0.5px] bg-foreground/[0.06]" />
                  <span className="text-[9px] text-foreground/20 uppercase tracking-widest">or paste URL</span>
                  <div className="flex-1 h-[0.5px] bg-foreground/[0.06]" />
                </div>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newSubmission.imageUrl.startsWith('data:') ? '' : newSubmission.imageUrl}
                  onChange={e => setNewSubmission(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Style Description</label>
                <textarea
                  rows={3}
                  placeholder="Style description or review comment..."
                  value={newSubmission.styleDescription}
                  onChange={e => setNewSubmission(prev => ({ ...prev, styleDescription: e.target.value }))}
                  className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all resize-none"
                />
              </div>

              <button
                onClick={handleCreateSubmission}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 text-white rounded-2xl font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-emerald-500/10 disabled:opacity-50 active:scale-[0.98]"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSubmitting ? 'Creating...' : 'Create Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
