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
  RefreshCw
} from "lucide-react";
import Image from "next/image";

interface FeaturedUser {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
  styleDescription: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviews: any[];
}

export default function FeaturedUsersModeration() {
  const [submissions, setSubmissions] = useState<FeaturedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/featured-users");
      const data = await res.json();
      if (data.users) setSubmissions(data.users);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Community Moderation</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Approve or reject community-submitted looks for the homepage showcase.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-foreground/5 rounded-xl border border-foreground/10">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{submissions.length} Total Submissions</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {submissions.map((item) => (
          <div key={item.id} className={`glass-card rounded-2xl overflow-hidden border transition-all ${
            item.status === 'APPROVED' ? 'border-emerald-500/20' : 
            item.status === 'REJECTED' ? 'border-red-500/20' : 'border-foreground/10'
          }`}>
            <div className="relative aspect-[4/5] bg-foreground/5">
              <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
              <div className="absolute top-4 right-4 group">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 ${
                  item.status === 'APPROVED' ? 'bg-emerald-500 text-white' : 
                  item.status === 'REJECTED' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
                }`}>
                  {item.status === 'APPROVED' ? <CheckCircle className="w-3 h-3" /> : 
                   item.status === 'REJECTED' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {item.status}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">{item.name}</h3>
                  <span className="text-[10px] text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 underline truncate">{item.email}</p>
              </div>

              <div className="p-3 bg-foreground/5 rounded-xl border border-foreground/5 italic text-[11px] text-muted-foreground/80 leading-relaxed">
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
    </div>
  );
}
