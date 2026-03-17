"use client";

import { useState, useEffect } from "react";
import { 
  Zap,
  Sparkles,
  Search,
  Check,
  X,
  Eye,
  MoreVertical,
  Flag,
  Globe,
  Upload,
  Calendar,
  MessageCircle,
  Plus,
  Users,
  Trash2,
  ShieldCheck,
  Smartphone,
  MessageSquare,
  CheckCircle2,
  User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Components ---
 const SettingsGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <h3 className="px-4 mb-2 text-[8px] font-black uppercase tracking-[0.3em] text-foreground/20 dark:text-white/20">{title}</h3>
    <div className="bg-white/50 dark:bg-white/[0.02] border border-foreground/[0.05] rounded-xl overflow-hidden shadow-sm">
      {children}
    </div>
  </div>
);

 const SettingsRow = ({ icon: Icon, label, description, children, last }: any) => (
  <div className={`flex items-center justify-between px-4 py-3 ${!last ? 'border-b border-foreground/[0.03]' : ''} hover:bg-foreground/[0.01] transition-colors group`}>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-foreground/[0.02] flex items-center justify-center group-hover:bg-foreground/[0.04] transition-colors">
        <Icon className="w-3.5 h-3.5 text-foreground/20 group-hover:text-foreground/50 transition-colors" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black tracking-tight text-foreground/90 lowercase leading-none">{label}</span>
        {description && <span className="text-[7.5px] font-black text-foreground/20 dark:text-white/10 uppercase tracking-widest leading-none mt-1.5">{description}</span>}
      </div>
    </div>
    <div className="flex items-center gap-3">
      {children}
    </div>
  </div>
);

 const InputField = ({ value, onChange, placeholder }: any) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="bg-foreground/[0.02] border border-foreground/[0.04] rounded-lg px-3 py-1.5 text-[10px] font-black text-foreground placeholder:text-foreground/10 focus:outline-none focus:border-foreground/10 transition-all text-right w-[160px] lowercase"
  />
);

 const ActionButton = ({ onClick, icon: Icon, label, variant = 'primary' }: any) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm ${
      variant === 'primary' 
        ? 'bg-foreground text-background shadow-foreground/5' 
        : variant === 'secondary'
        ? 'bg-emerald-500 text-white'
        : 'bg-foreground/[0.02] text-foreground/30 hover:bg-foreground/[0.04]'
    }`}
  >
    {Icon && <Icon className="w-3 h-3" />}
    {label}
  </button>
);

 const StatusBadge = ({ type, label }: { type: 'success' | 'warning' | 'info', label: string }) => {
  const styles = {
    success: 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10',
    warning: 'bg-amber-500/5 text-amber-500 border-amber-500/10',
    info: 'bg-blue-500/5 text-blue-500 border-blue-500/10'
  };
  return (
    <div className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border flex items-center gap-1 ${styles[type]}`}>
       <div className={`w-1 h-1 rounded-full ${type === 'success' ? 'bg-emerald-500' : type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
       {label}
    </div>
  );
};

export default function CommunityAdminPage() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUpdate, setNewUpdate] = useState({ title: '', description: '', type: 'EVENT' });
  
  // Featured Looks State
  const [featuredUsers, setFeaturedUsers] = useState<any[]>([]);
  const [newFeatured, setNewFeatured] = useState({ name: '', email: '', imageUrl: '', styleDescription: '' });
  const [showManualForm, setShowManualForm] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  // Global Shop Settings
  const [settings, setSettings] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchUpdates = async () => {
    try {
      const res = await fetch('/api/community/updates');
      const data = await res.json();
      setUpdates(data.updates || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
    fetchFeaturedUsers();
    fetchShopSettings();
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/admin/community/members');
      const data = await res.json();
      setMembers(data.members || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchShopSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      setSettings(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (updates: any) => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) fetchShopSettings();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchFeaturedUsers = async () => {
    try {
      const res = await fetch('/api/admin/featured-users');
      const data = await res.json();
      setFeaturedUsers(data.users || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddFeatured = async () => {
    if (!newFeatured.name || !newFeatured.imageUrl) return;
    try {
      const res = await fetch('/api/admin/featured-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newFeatured, status: 'APPROVED' })
      });
      if (res.ok) {
        setNewFeatured({ name: '', email: '', imageUrl: '', styleDescription: '' });
        setShowManualForm(false);
        fetchFeaturedUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/featured-users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchFeaturedUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  };

  const handleUpdateMember = async (id: string, status: string) => {
    setProcessing('member-' + id);
    try {
      const res = await fetch('/api/admin/community/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) fetchMembers();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/featured-users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTopFeatured: !current })
      });
      if (res.ok) fetchFeaturedUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteFeatured = async (id: string) => {
    try {
       await fetch(`/api/admin/featured-users?id=${id}`, { method: 'DELETE' });
       fetchFeaturedUsers();
    } catch (e) {
       console.error(e);
    }
  };

  const handleAddUpdate = async () => {
    if (!newUpdate.title) return;
    try {
      const res = await fetch('/api/community/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUpdate)
      });
      if (res.ok) {
        setNewUpdate({ title: '', description: '', type: 'EVENT' });
        fetchUpdates();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUpdate = async (id: string) => {
    try {
       await fetch(`/api/community/updates?id=${id}`, { method: 'DELETE' });
       fetchUpdates();
    } catch (e) {
       console.error(e);
    }
  };

   return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 px-6">
      
      {/* Moderation Hub Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
         <div className="space-y-1">
           <div className="flex items-center gap-3">
              <div className="px-2 py-0.5 bg-foreground/[0.03] rounded-md text-[8px] font-black text-foreground/40 dark:text-white/30 uppercase tracking-[0.2em] w-fit">moderation hub</div>
              <div className="flex items-center gap-2 opacity-20">
                 <Globe className="w-2.5 h-2.5 text-foreground/40" />
                 <span className="text-[8px] font-black uppercase tracking-widest text-foreground/40">public relay active</span>
              </div>
           </div>
           <div>
              <h1 className="text-xl font-black text-foreground uppercase tracking-tight mb-0.5 lowercase leading-none">community moderation</h1>
              <div className="flex items-center gap-3 mt-1">
                 <p className="text-[10px] text-foreground/40 dark:text-white/20 font-bold uppercase tracking-widest">Approve and curate the showcase.</p>
                 <div className="px-1.5 py-0.5 bg-emerald-500/5 text-emerald-500 rounded text-[7px] font-black uppercase tracking-widest border border-emerald-500/10">
                    {featuredUsers.filter(u => u.status === 'APPROVED').length}/20 SUBSTRATES
                 </div>
              </div>
           </div>
        </div>

           <div className="flex items-center gap-2">
            <ActionButton label="Inject Data" icon={Plus} onClick={() => setShowManualForm(true)} />
            <ActionButton label="Live Relay" icon={Globe} variant="secondary" onClick={() => window.open('/community', '_blank')} />
            <div className="h-9 px-4 bg-foreground/[0.02] border border-foreground/[0.04] rounded-lg flex items-center gap-3">
              <Users className="w-3 h-3 text-foreground/20" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/20">{featuredUsers.length} Nodes</span>
            </div>
          </div>
      </div>

      {/* Membership Moderation */}
      <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="flex items-center gap-3 mb-6 px-1">
            <div className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-md text-[8px] font-black uppercase tracking-widest border border-blue-500/20">
               {members.filter(m => m.status === 'PENDING').length} Pending Requests
            </div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30 dark:text-white/20">Membership Guard</h2>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
               {members.filter(m => m.status === 'PENDING').map((member) => (
                  <motion.div
                    key={member.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white/50 dark:bg-white/[0.02] border border-foreground/[0.05] rounded-2xl p-5 flex flex-col gap-4 group relative hover:bg-foreground/[0.01] transition-all"
                  >
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-foreground/[0.03] dark:bg-white/[0.03] flex items-center justify-center overflow-hidden border border-foreground/[0.05]">
                           {member.customer.image ? (
                             <img src={member.customer.image} className="w-full h-full object-cover" alt={member.customer.name} />
                           ) : (
                             <User className="w-4 h-4 text-foreground/20" />
                           )}
                        </div>
                        <div className="flex flex-col min-w-0">
                           <span className="text-[11px] font-black text-foreground uppercase tracking-tight truncate leading-none">{member.customer.name || 'Anonymous'}</span>
                           <span className="text-[8px] font-bold text-foreground/20 dark:text-white/10 uppercase tracking-widest leading-none mt-1.5 truncate">{member.customer.email}</span>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-2">
                        <div className="bg-foreground/[0.02] dark:bg-white/[0.01] rounded-xl border border-foreground/[0.03] p-2.5">
                           <p className="text-[7px] font-black text-foreground/20 dark:text-white/10 uppercase tracking-widest mb-1">Orders</p>
                           <p className="text-[12px] font-black text-foreground leading-none">{member.customer.ordersCount || member.customer.orders?.length || 0}</p>
                        </div>
                        <div className="bg-foreground/[0.02] dark:bg-white/[0.01] rounded-xl border border-foreground/[0.03] p-2.5">
                           <p className="text-[7px] font-black text-foreground/20 dark:text-white/10 uppercase tracking-widest mb-1">Phone</p>
                           <p className="text-[11px] font-bold text-foreground/60 leading-none truncate lowercase">{member.phone || 'N/A'}</p>
                        </div>
                     </div>

                     <div className="flex items-center gap-2 pt-1">
                        <button 
                          onClick={() => handleUpdateMember(member.id, 'APPROVED')}
                          disabled={processing === 'member-' + member.id}
                          className="flex-1 py-2.5 bg-foreground dark:bg-white text-background dark:text-black rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-20 shadow-lg shadow-foreground/5"
                        >
                           Verify
                        </button>
                        <button 
                          onClick={() => handleUpdateMember(member.id, 'REJECTED')}
                          disabled={processing === 'member-' + member.id}
                          className="h-10 px-3 bg-foreground/[0.03] text-foreground/20 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all disabled:opacity-20"
                        >
                           <X className="w-3.5 h-3.5" />
                        </button>
                     </div>
                  </motion.div>
               ))}
               {members.filter(m => m.status === 'PENDING').length === 0 && (
                  <div className="col-span-full py-16 border border-dashed border-foreground/5 dark:border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-foreground/10 dark:text-white/5">
                     <ShieldCheck className="w-10 h-10 mb-3 opacity-20" />
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center">Secure Layer Active<br/><span className="opacity-50 font-medium">No pending transmission detected</span></p>
                  </div>
               )}
            </AnimatePresence>
         </div>
      </div>

      <div className="w-full h-[1px] bg-foreground/5 dark:bg-white/5 mb-16" />

      {/* Main Submission Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
         <AnimatePresence>
            {featuredUsers.map((user) => (
              <motion.div
                 key={user.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative bg-white/50 dark:bg-white/[0.02] border border-foreground/[0.05] rounded-xl overflow-hidden shadow-sm transition-all duration-700 hover:bg-foreground/[0.01]"
              >
                {/* Visual Canvas */}
                <div className="aspect-[4/5] relative overflow-hidden">
                   <img 
                    src={user.imageUrl} 
                    className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 scale-105 group-hover:scale-100" 
                    alt={user.name} 
                  />
                   <div className="absolute inset-x-0 top-0 p-5 flex justify-between items-start">
                      <div className="flex flex-col gap-2">
                         {user.status === 'APPROVED' && <StatusBadge type="success" label="Approved" />}
                         {user.isTopFeatured && <div className="px-2 py-0.5 bg-[#00C48C] text-white rounded-full text-[7px] font-black uppercase tracking-widest">Top 20</div>}
                      </div>
                      <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <MoreVertical className="w-3.5 h-3.5 text-white" />
                      </button>
                   </div>
                   
                   {/* Bottom Detail Scrim */}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent pt-12">
                      <div className="flex justify-between items-end">
                         <div className="space-y-0.5">
                            <h4 className="text-[11px] font-black text-white uppercase tracking-tight leading-none">{user.name}</h4>
                            <p className="text-[7.5px] text-white/40 font-black uppercase tracking-widest leading-none mt-1 lowercase">{user.email}</p>
                         </div>
                         <div className="text-[7px] font-black text-white/30 uppercase tracking-widest">
                            {new Date(user.createdAt).toLocaleDateString()}
                         </div>
                      </div>
                   </div>
                </div>

                {/* Interaction Node */}
                 <div className="p-3 space-y-2">
                   <div className="p-2 bg-foreground/[0.01] rounded-lg border border-foreground/[0.02]">
                      <p className="text-[8.5px] font-black text-foreground/40 dark:text-white/20 italic leading-snug lowercase">
                         "{user.styleDescription || 'Unspecified Transmission.'}"
                      </p>
                   </div>

                     <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                         <button 
                           onClick={() => handleUpdateStatus(user.id, 'APPROVED')}
                           disabled={user.status === 'APPROVED' || processing === user.id}
                           className="w-7 h-7 rounded-lg bg-emerald-500/5 text-emerald-500 flex items-center justify-center hover:bg-emerald-500/10 transition-colors disabled:opacity-20"
                         >
                            <Check className="w-3 h-3" />
                         </button>
                         <button 
                           onClick={() => handleUpdateStatus(user.id, 'REJECTED')}
                           disabled={user.status === 'REJECTED' || processing === user.id}
                           className="w-7 h-7 rounded-lg bg-rose-500/5 text-rose-500 flex items-center justify-center hover:bg-rose-500/10 transition-colors disabled:opacity-20"
                         >
                            <X className="w-3 h-3" />
                         </button>
                         <div 
                           onClick={() => handleToggleFeatured(user.id, user.isTopFeatured)}
                           className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all cursor-pointer ${user.isTopFeatured ? 'bg-emerald-500 text-white border-transparent' : 'bg-foreground/[0.03] border-transparent text-foreground/30'}`}
                         >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span className="text-[7.5px] font-black uppercase tracking-widest">Featured</span>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                         <button onClick={() => handleDeleteFeatured(user.id)} className="w-7 h-7 rounded-lg hover:bg-rose-500/5 text-foreground/10 hover:text-rose-500 flex items-center justify-center transition-all">
                            <Trash2 className="w-3 h-3" />
                         </button>
                      </div>
                   </div>
                </div>
              </motion.div>
            ))}
         </AnimatePresence>
      </div>

      <div className="w-full h-[1px] bg-foreground/5 mb-16" />

      {/* Membership Rules */}
      <SettingsGroup title="Membership Guard">
        <SettingsRow 
          icon={ShieldCheck} 
          label="Order Requirement" 
          description="Minimum orders required to access community perks."
        >
          <InputField 
            value={settings?.communityMinOrders?.toString() || "1"} 
            onChange={(v: string) => handleSaveSettings({ communityMinOrders: parseInt(v) || 0 })} 
            placeholder="Quantity" 
          />
        </SettingsRow>
        <SettingsRow 
          icon={Users} 
          label="Age Restriction" 
          description="Enforce 18+ verification for legal compliance."
        >
          <div className="flex items-center gap-1.5 p-1 bg-foreground/[0.02] rounded-lg border border-foreground/[0.03]">
             <button 
               onClick={() => handleSaveSettings({ communityAgeRestricted: true })}
               className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${settings?.communityAgeRestricted ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground/20 hover:text-foreground/40'}`}
             >
               Active
             </button>
             <button 
               onClick={() => handleSaveSettings({ communityAgeRestricted: false })}
               className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${!settings?.communityAgeRestricted ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground/20 hover:text-foreground/40'}`}
             >
               Disabled
             </button>
          </div>
        </SettingsRow>
        <SettingsRow 
          icon={Smartphone} 
          label="WhatsApp Promotion" 
          description="Allow members to opt-in for broadcast updates."
          last
        >
          <div 
            onClick={() => handleSaveSettings({ communityWhatsAppEnabled: !settings?.communityWhatsAppEnabled })}
            className={`w-10 h-5 rounded-full p-1 flex items-center transition-all cursor-pointer ${settings?.communityWhatsAppEnabled ? 'bg-emerald-500/20 justify-end' : 'bg-foreground/10 justify-start'}`}
          >
             <div className={`w-3 h-3 rounded-full shadow-sm transition-all ${settings?.communityWhatsAppEnabled ? 'bg-emerald-500' : 'bg-foreground/20'}`} />
          </div>
        </SettingsRow>
      </SettingsGroup>

      {/* Community Updates / Events */}
       <SettingsGroup title="Announcements & Events">
        <div className="p-4 border-b border-foreground/[0.03] bg-foreground/[0.01]">
           <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                 <input 
                   placeholder="Event Title..." 
                   value={newUpdate.title}
                   onChange={(e) => setNewUpdate({...newUpdate, title: e.target.value})}
                   className="w-full bg-white dark:bg-black/20 border border-foreground/[0.05] rounded-lg px-3 py-2 text-[10px] font-black text-foreground lowercase placeholder:text-foreground/10"
                 />
                 <textarea 
                   placeholder="Event Description..." 
                   value={newUpdate.description}
                   onChange={(e) => setNewUpdate({...newUpdate, description: e.target.value})}
                   className="w-full bg-white dark:bg-black/20 border border-foreground/[0.05] rounded-lg px-3 py-2 text-[9px] font-black text-foreground/40 min-h-[60px] placeholder:text-foreground/10 resize-none"
                 />
              </div>
              <div className="w-[150px] flex flex-col gap-2">
                 <select 
                   value={newUpdate.type}
                   onChange={(e) => setNewUpdate({...newUpdate, type: e.target.value})}
                   className="w-full bg-white dark:bg-black/20 border border-foreground/[0.05] rounded-lg px-3 py-2 text-[8px] font-black uppercase tracking-widest appearance-none text-foreground/30 focus:outline-none"
                 >
                    <option value="EVENT">Event</option>
                    <option value="ACTIVITY">Activity</option>
                    <option value="OFFER">Offer</option>
                 </select>
                 <ActionButton label="Deploy Node" icon={Plus} onClick={handleAddUpdate} />
              </div>
           </div>
        </div>

        <AnimatePresence>
          {loading ? (
            <div className="p-12 text-center text-muted-foreground/20 animate-pulse uppercase text-[10px] font-black tracking-widest">Syncing with Core...</div>
          ) : updates.map((update, idx) => (
              <motion.div 
                key={update.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`px-4 py-3 flex items-center justify-between group ${idx !== updates.length - 1 ? 'border-b border-foreground/[0.02]' : ''}`}
             >
                <div className="flex items-center gap-4">
                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                     update.type === 'EVENT' ? 'bg-blue-500/5 text-blue-500/30' :
                     update.type === 'OFFER' ? 'bg-emerald-500/5 text-emerald-500/30' :
                     'bg-foreground/5 text-foreground/20'
                   }`}>
                     {update.type === 'EVENT' ? <Calendar className="w-3.5 h-3.5" /> :
                      update.type === 'OFFER' ? <Zap className="w-3.5 h-3.5" /> :
                      <Users className="w-3.5 h-3.5" />}
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-foreground uppercase tracking-tight lowercase leading-none">{update.title}</span>
                      <span className="text-[7.5px] font-black text-foreground/20 dark:text-white/10 leading-none mt-1.5 uppercase tracking-widest truncate max-w-[300px]">{update.description}</span>
                   </div>
                </div>
               <button 
                 onClick={() => handleDeleteUpdate(update.id)}
                 className="p-2 rounded-lg hover:bg-rose-500/5 text-foreground/10 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
               >
                 <Trash2 className="w-3.5 h-3.5" />
               </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </SettingsGroup>

      {/* Discussion Substrate */}
      <SettingsGroup title="Discussion Substrate">
        <SettingsRow 
           icon={MessageSquare} 
           label="Fashion Chat" 
           description="Enable real-time trend discussions for verified members."
           last
         >
           <div className="flex items-center gap-4">
              <div className="flex flex-col items-end opacity-20">
                 <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500">Live Feedback</span>
                 <span className="text-[11px] font-black tracking-tight text-foreground lowercase">active hub</span>
              </div>
              <div className="w-10 h-5 rounded-full bg-emerald-500/20 p-1 flex items-center justify-end">
                 <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
           </div>
         </SettingsRow>
      </SettingsGroup>

      {/* Manual Submission Drawer */}
      <AnimatePresence>
        {showManualForm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowManualForm(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
             <motion.div 
               initial={{ x: '100%' }}
               animate={{ x: 0 }}
               exit={{ x: '100%' }}
               className="fixed inset-y-0 right-0 w-full max-w-[400px] bg-white/95 dark:bg-[#050505]/95 backdrop-blur-3xl z-[101] border-l border-foreground/[0.03] p-8 flex flex-col"
             >
                <div className="flex justify-between items-center mb-10">
                   <h2 className="text-lg font-black uppercase tracking-tight lowercase">Manual Submission</h2>
                   <button onClick={() => setShowManualForm(false)} className="p-2 hover:bg-foreground/[0.02] rounded-full transition-colors">
                     <X className="w-4 h-4 text-muted-foreground/20" />
                   </button>
                </div>

                <div className="space-y-5 overflow-y-auto pr-2 -mr-2 flex-1 custom-scrollbar">
                   <div className="space-y-3">
                      <p className="text-[9px] font-black text-muted-foreground/15 uppercase tracking-[0.3em] px-1">Essential Metadata</p>
                      <input 
                        placeholder="Contributor Name" 
                        value={newFeatured.name}
                        onChange={(e) => setNewFeatured({...newFeatured, name: e.target.value})}
                        className="w-full bg-foreground/[0.02] border border-foreground/[0.03] rounded-lg px-5 py-3 text-[11px] font-black text-foreground placeholder:text-muted-foreground/10"
                      />
                      <input 
                        placeholder="Email Address" 
                        value={newFeatured.email}
                        onChange={(e) => setNewFeatured({...newFeatured, email: e.target.value})}
                        className="w-full bg-foreground/[0.02] border border-foreground/[0.03] rounded-lg px-5 py-3 text-[11px] font-black text-foreground font-mono placeholder:text-muted-foreground/10"
                      />
                   </div>

                   <div className="space-y-3 pt-2">
                      <p className="text-[9px] font-black text-muted-foreground/15 uppercase tracking-[0.3em] px-1">Visual Core</p>
                      <input 
                        placeholder="Image URL..." 
                        value={newFeatured.imageUrl}
                        onChange={(e) => setNewFeatured({...newFeatured, imageUrl: e.target.value})}
                        className="w-full bg-foreground/[0.02] border border-foreground/[0.03] rounded-lg px-5 py-3 text-[11px] font-black text-foreground placeholder:text-muted-foreground/10"
                      />
                   </div>

                   <div className="space-y-3 pt-2">
                      <p className="text-[9px] font-black text-muted-foreground/15 uppercase tracking-[0.3em] px-1">Testimonial / Transmission</p>
                      <textarea 
                        placeholder="Quote..." 
                        value={newFeatured.styleDescription}
                        onChange={(e) => setNewFeatured({...newFeatured, styleDescription: e.target.value})}
                        className="w-full bg-foreground/[0.02] border border-foreground/[0.03] rounded-lg px-5 py-3 text-[10px] font-bold text-muted-foreground/30 min-h-[100px] placeholder:text-muted-foreground/10"
                      />
                   </div>
                </div>
 
                <div className="pt-8">
                   <button 
                     onClick={handleAddFeatured}
                     className="w-full py-4 rounded-lg bg-foreground text-background text-[10px] font-black uppercase tracking-[0.4em] active:scale-95 transition-all shadow-xl"
                   >
                     Inject Node
                   </button>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
