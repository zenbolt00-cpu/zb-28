"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Check, Eye, EyeOff } from "lucide-react";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  published: boolean;
  author: string;
  createdAt: string;
};

export default function BlogsAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: "",
    author: "Zica Bella",
    published: false,
  });

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/blogs');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPosts(data);
      }
    } catch (err) {
      console.error("Failed to fetch posts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleOpenModal = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || "",
        content: post.content,
        coverImage: post.coverImage || "",
        author: post.author,
        published: post.published,
      });
    } else {
      setEditingPost(null);
      setFormData({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        coverImage: "",
        author: "Zica Bella",
        published: true,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const method = editingPost ? 'PATCH' : 'POST';
      const body = editingPost ? { id: editingPost.id, ...formData } : formData;

      const res = await fetch('/api/admin/blogs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchPosts();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err: any) {
      alert(`Error saving post: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    try {
      const res = await fetch(`/api/admin/blogs?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPosts();
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // Convert title to slug automatically if creating new
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (!editingPost) {
      setFormData({
        ...formData,
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      });
    } else {
      setFormData({ ...formData, title });
    }
  };

  if (loading) return <div className="p-8">Loading posts...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Blog Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage content for the Zica Bella Journal.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-foreground text-background px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-foreground/90 transition-all"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      <div className="glass rounded-3xl border border-foreground/10 overflow-hidden">
        {posts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p>No blog posts found. Create your first one!</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-foreground/5 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-foreground/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground truncate max-w-[300px]">{post.title}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[300px]">/{post.slug}</p>
                  </td>
                  <td className="px-6 py-4">
                    {post.published ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 uppercase tracking-widest">
                        <Check className="w-3 h-3" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 uppercase tracking-widest">
                        <EyeOff className="w-3 h-3" /> Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenModal(post)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-foreground/10 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(post.id)} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Editor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-background w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-foreground/10">
            <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between bg-foreground/5">
              <h2 className="text-lg font-bold">{editingPost ? 'Edit Post' : 'New Post'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-foreground/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={handleTitleChange}
                    className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="Enter blog title"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Slug (URL)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cover Image URL</label>
                  <input
                    type="text"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Author</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Excerpt / Subtitle</label>
                <input
                  type="text"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  placeholder="Short description for the blog list..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold flex items-center justify-between text-muted-foreground uppercase tracking-wider">
                  <span>Content (Markdown/HTML)</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={12}
                  className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-y"
                  placeholder="Write your blog post here..."
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-foreground/5 rounded-xl border border-foreground/10">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="w-5 h-5 rounded border-foreground/20 text-foreground focus:ring-foreground"
                />
                <label htmlFor="published" className="text-sm font-medium select-none cursor-pointer">
                  Publish this post immediately
                </label>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-foreground/10 flex justify-end gap-3 bg-foreground/5">
              <button 
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-foreground bg-background border border-foreground/10 hover:bg-foreground/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                Save Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
