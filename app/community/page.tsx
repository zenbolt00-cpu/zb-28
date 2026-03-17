"use client";

import { useEffect, useState, useRef } from "react";
import NextImage from "next/image";
import { 
  Star, 
  MessageCircle, 
  Heart, 
  ArrowLeft, 
  ShieldCheck, 
  Zap, 
  Calendar, 
  Send,
  User,
  Smartphone,
  CheckCircle2,
  X,
  Upload,
  Sparkles,
  Globe
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import FeaturedUsersSection from "@/components/FeaturedUsersSection";

// --- Types ---
interface CommunityUpdate {
  id: string;
  type: 'EVENT' | 'ACTIVITY' | 'OFFER';
  title: string;
  description: string;
}

interface ChatMessage {
  id: string;
  content: string;
  customer: { name: string };
  createdAt: string;
}

export default function CommunityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [updates, setUpdates] = useState<CommunityUpdate[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  
  const isMember = !!(session as any)?.customer?.communityMember?.isVerified;
  const userEmail = session?.user?.email || (session as any)?.customer?.email;
  
  // Registration Form State
  const [regForm, setRegForm] = useState({ email: '', dob: '', whatsapp: false, phone: '' });
  const [regStatus, setRegStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', msg: string }>({ type: 'idle', msg: '' });

  // Submission Form State
  const [showSubForm, setShowSubForm] = useState(false);
  const [subForm, setSubForm] = useState({ name: '', email: '', imageUrl: '', quote: '' });
  const [subStatus, setSubStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', msg: string }>({ type: 'idle', msg: '' });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCommunityData();
    fetchShopSettings();
    if (session?.user?.email) {
      setRegForm(prev => ({ ...prev, email: session.user?.email || '' }));
    }
  }, [session]);

  useEffect(() => {
    if (status === "unauthenticated" && !loading) {
      window.location.href = `/login?callbackUrl=/community`;
    }
  }, [status, loading]);

  const fetchCommunityData = async () => {
    try {
      const [uRes, cRes] = await Promise.all([
        fetch('/api/community/updates'),
        fetch('/api/community/chat')
      ]);
      const uData = await uRes.json();
      const cData = await cRes.json();
      setUpdates(uData.updates || []);
      setMessages(cData.messages || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegStatus({ type: 'loading', msg: '' });
    
    try {
      const res = await fetch('/api/community/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail || regForm.email,
          dob: regForm.dob,
          whatsappOptIn: regForm.whatsapp,
          phone: regForm.phone
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setRegStatus({ type: 'success', msg: 'Verification request submitted. Admin review pending.' });
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setRegStatus({ type: 'error', msg: data.error || 'Identity rejection.' });
      }
    } catch (e) {
      setRegStatus({ type: 'error', msg: 'Network failure.' });
    }
  };

  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubStatus({ type: 'loading', msg: '' });
    
    try {
      const res = await fetch('/api/admin/featured-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           name: subForm.name,
           email: subForm.email,
           imageUrl: subForm.imageUrl,
           styleDescription: subForm.quote,
           status: 'PENDING'
        })
      });
      
      if (res.ok) {
        setSubStatus({ type: 'success', msg: 'Your fit has been queued for moderation.' });
        setTimeout(() => {
          setShowSubForm(false);
          setSubForm({ name: '', email: '', imageUrl: '', quote: '' });
          setSubStatus({ type: 'idle', msg: '' });
        }, 3000);
      } else {
        setSubStatus({ type: 'error', msg: 'Submission failed. Check your data.' });
      }
    } catch (e) {
      setSubStatus({ type: 'error', msg: 'Network error. Try again.' });
    }
  };

  return (
    <main className="min-h-screen bg-background pt-28 pb-40 px-6 overflow-hidden relative">
       {/* Cinematic Apple Glass Background Effects */}
       <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
        <div className="absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-foreground/[0.03] dark:bg-white/[0.02] rounded-full blur-[200px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[60vw] h-[60vw] bg-foreground/[0.02] dark:bg-white/[0.01] rounded-full blur-[150px]" />
        
        {/* Subtle grid pattern for texture */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.02] dark:opacity-[0.05]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-24 flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col items-center"
          >
            <div className="px-4 py-1.5 rounded-full border border-foreground/[0.05] dark:border-white/[0.05] bg-foreground/[0.02] dark:bg-white/[0.02] backdrop-blur-md mb-6 inline-flex items-center gap-2">
               <Globe className="w-3 h-3 text-foreground/40 dark:text-white/40" />
               <span className="text-[9px] font-black text-foreground/60 dark:text-white/60 uppercase tracking-[0.2em] leading-none">Global Network</span>
            </div>
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-light tracking-tight text-foreground dark:text-white leading-[1.1] mb-8">
            The Inner <br/> <span className="text-foreground/30 dark:text-white/30 italic font-serif">Circle</span>
          </h1>
          <p className="text-foreground/50 dark:text-white/40 text-[13px] font-medium max-w-sm leading-relaxed tracking-wide mb-10">
            Exclusive access for verified Zica Bella customers. Collective discussions, archival events, and elite membership.
          </p>

          <AnimatePresence>
             {isMember && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setShowSubForm(true)}
                  className="h-12 px-8 rounded-full bg-foreground text-background dark:bg-white dark:text-black text-[12px] font-bold tracking-wide flex items-center justify-center gap-3 hover:scale-[1.02] hover:shadow-2xl transition-all active:scale-95"
                >
                   <Upload className="w-4 h-4" />
                   Publish Your Look
                </motion.button>
             )}
          </AnimatePresence>
        </header>

        {/* FEATURED: Real-time Showcase */}
        <div className="mb-32">
           <FeaturedUsersSection 
             showCommunity={true} 
             title="The Visual Collective" 
             subtitle="User Showcase" 
             allFeatured={true}
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* LEFT: Feed & Announcements */}
           <div className="lg:col-span-7 space-y-8">
              <section>
                 <div className="flex items-center gap-3 mb-6 px-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                       <Zap className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h2 className="text-[13px] font-bold tracking-tight text-foreground dark:text-white">Live Updates</h2>
                 </div>
                 
                 <div className="space-y-4">
                    {updates.map((update) => (
                       <motion.div 
                         key={update.id}
                         whileHover={{ scale: 1.01 }}
                         className="p-6 bg-white/40 dark:bg-white/[0.02] border border-foreground/[0.05] dark:border-white/[0.05] rounded-3xl backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none group transition-all cursor-pointer"
                       >
                          <div className="flex items-center justify-between mb-4">
                             <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                               update.type === 'EVENT' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
                             }`}>
                                {update.type}
                             </div>
                             <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          </div>
                          <h3 className="text-xl font-semibold tracking-tight text-foreground dark:text-white mb-2 group-hover:text-blue-500 transition-colors">{update.title}</h3>
                          <p className="text-[13px] text-foreground/60 dark:text-white/50 leading-relaxed font-medium mb-6">{update.description}</p>
                          <div className="w-full h-[1px] bg-foreground/[0.03] dark:bg-white/[0.03] mb-4" />
                          <div className="flex items-center text-[11px] font-bold text-foreground/40 dark:text-white/40 group-hover:text-foreground dark:group-hover:text-white transition-colors">
                             Explore Details <ArrowLeft className="w-3 h-3 ml-2 rotate-180" />
                          </div>
                       </motion.div>
                    ))}
                 </div>
              </section>

              {/* Terms Section - Apple Style Card */}
              <section className="p-8 bg-foreground/[0.02] dark:bg-white/[0.01] border border-foreground/[0.05] dark:border-white/[0.05] rounded-3xl mt-12">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-foreground/5 dark:bg-white/5 flex items-center justify-center">
                       <ShieldCheck className="w-4 h-4 text-foreground/50 dark:text-white/50" />
                    </div>
                    <h3 className="text-[13px] font-bold tracking-tight text-foreground dark:text-white">Membership Protocol</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <span className="text-[11px] font-bold text-foreground/50 dark:text-white/50 tracking-tight">Age Verification</span>
                       <p className="text-[12px] font-medium text-foreground/40 dark:text-white/40 leading-relaxed">
                          {settings?.communityAgeRestricted ? 'Restricted to individuals aged 18 and above. Identification verification required.' : 'Inclusive community access open to all verified collectors.'}
                       </p>
                    </div>
                    <div className="space-y-2">
                       <span className="text-[11px] font-bold text-foreground/50 dark:text-white/50 tracking-tight">Status Tier</span>
                       <p className="text-[12px] font-medium text-foreground/40 dark:text-white/40 leading-relaxed">
                          Access limited to accounts with {settings?.communityMinOrders || 1} confirmed archival order{(settings?.communityMinOrders || 1) > 1 ? 's' : ''}.
                       </p>
                    </div>
                  </div>
              </section>
           </div>

           {/* RIGHT: Chat & Application - Apple Floating Panel */}
           <div className="lg:col-span-5 h-[700px] sticky top-32">
              <div className="h-full bg-white/60 dark:bg-black/40 border border-foreground/[0.08] dark:border-white/[0.08] rounded-[2.5rem] overflow-hidden flex flex-col relative shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] backdrop-blur-[40px] saturate-[150%]">
                 
                 {/* Chat Overlay (for non-members) */}
                  <AnimatePresence>
                     {status === "authenticated" && !isMember && (
                        <motion.div 
                          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                          animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
                          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                          className="absolute inset-0 z-50 bg-background/60 dark:bg-black/60 flex flex-col items-center justify-center p-10 text-center"
                        >
                           <div className="w-20 h-20 rounded-full bg-background dark:bg-white/5 flex items-center justify-center mb-6 border border-foreground/10 dark:border-white/10 shadow-2xl">
                              <ShieldCheck className={`w-8 h-8 ${(session as any)?.customer?.communityMember?.status === 'PENDING' ? 'text-blue-500' : 'text-foreground/80 dark:text-white/80'}`} />
                           </div>
                           <h3 className="text-2xl font-light text-foreground dark:text-white tracking-tight mb-4">
                              {(session as any)?.customer?.communityMember?.status === 'PENDING' ? 'Pending Approval' : 'Restricted Access'}
                           </h3>
                           <p className="text-[12px] text-foreground/60 dark:text-white/50 font-medium leading-relaxed mb-8">
                              Connected as <span className="text-foreground dark:text-white font-semibold">{userEmail}</span>. <br/>
                              {(session as any)?.customer?.communityMember?.status === 'PENDING' 
                                ? 'Your request is being reviewed by the collective editorial team. Once verified, the channel will open.' 
                                : `Requires ${settings?.communityMinOrders || 1} valid order${(settings?.communityMinOrders || 1) > 1 ? 's' : ''}.`}
                           </p>
                           
                           {(session as any)?.customer?.communityMember?.status !== 'PENDING' && (
                              <button 
                                onClick={() => setShowJoinForm(true)}
                                className="h-12 w-full max-w-[240px] rounded-full bg-foreground text-background dark:bg-white dark:text-black text-[12px] font-bold tracking-wide active:scale-95 transition-all shadow-xl hover:scale-[1.02]"
                              >
                                  Verify Identity
                              </button>
                           )}
                        </motion.div>
                     )}
                  </AnimatePresence>

                  {/* Application Form Drawer - Glassmorphic Sheet */}
                  <AnimatePresence>
                    {showJoinForm && (
                       <motion.div 
                         initial={{ y: '100%' }}
                         animate={{ y: 0 }}
                         exit={{ y: '100%' }}
                         transition={{ type: "spring", damping: 25, stiffness: 200 }}
                         className="absolute inset-x-0 bottom-0 z-[60] h-[85%] bg-background/90 dark:bg-[#0A0A0A]/90 backdrop-blur-3xl rounded-t-[2.5rem] p-8 shadow-[0_-40px_100px_rgba(0,0,0,0.15)] dark:shadow-[0_-40px_100px_rgba(0,0,0,0.5)] border-t border-foreground/[0.08] dark:border-white/10"
                       >
                          <div className="flex justify-between items-center mb-8">
                             <h4 className="text-[16px] font-semibold text-foreground dark:text-white tracking-tight">Identity Verification</h4>
                             <button onClick={() => setShowJoinForm(false)} className="w-8 h-8 flex items-center justify-center bg-foreground/5 dark:bg-white/5 rounded-full hover:bg-foreground/10 dark:hover:bg-white/10 transition-colors">
                               <X className="w-4 h-4 text-foreground/50 dark:text-white/50" />
                             </button>
                          </div>
                          
                          {regStatus.type === 'success' ? (
                             <div className="h-[60%] flex flex-col items-center justify-center text-center">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-6">
                                  <CheckCircle2 className="w-20 h-20 text-emerald-500" />
                                </motion.div>
                                <span className="text-xl font-light tracking-tight text-foreground dark:text-white leading-tight max-w-[200px]">{regStatus.msg}</span>
                             </div>
                          ) : (
                             <form onSubmit={handleJoin} className="space-y-4">
                                <div className="space-y-1.5">
                                   <label className="text-[11px] font-bold text-foreground/50 dark:text-white/50 tracking-tight ml-2">Phone Number</label>
                                   <input 
                                     required
                                     type="tel"
                                     placeholder="+91 00000 00000"
                                     value={regForm.phone}
                                     onChange={(e) => setRegForm({...regForm, phone: e.target.value})}
                                     className="w-full bg-foreground/[0.03] dark:bg-white/[0.03] border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-5 py-4 text-[14px] font-medium text-foreground dark:text-white placeholder:text-foreground/20 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-foreground/10 dark:focus:ring-white/10 transition-all"
                                   />
                                </div>
                                <div className="space-y-1.5">
                                   <label className="text-[11px] font-bold text-foreground/50 dark:text-white/50 tracking-tight ml-2">Date of Birth</label>
                                   <input 
                                     required
                                     type="date"
                                     value={regForm.dob}
                                     onChange={(e) => setRegForm({...regForm, dob: e.target.value})}
                                     className="w-full bg-foreground/[0.03] dark:bg-white/[0.03] border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-5 py-4 text-[14px] font-medium text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-foreground/10 dark:focus:ring-white/10 transition-all"
                                   />
                                </div>
                                <div className="flex items-center gap-4 px-5 py-4 bg-foreground/[0.02] dark:bg-white/[0.02] rounded-2xl border border-foreground/[0.05] dark:border-white/[0.05]">
                                   <div className="p-2.5 bg-[#4CD964]/10 rounded-xl">
                                      <Smartphone className="w-5 h-5 text-[#4CD964]" />
                                   </div>
                                   <div className="flex-1">
                                      <p className="text-[13px] font-semibold text-foreground dark:text-white tracking-tight">WhatsApp Updates</p>
                                      <p className="text-[11px] text-foreground/50 dark:text-white/50 font-medium">Get event notifications</p>
                                   </div>
                                   <input 
                                     type="checkbox" 
                                     checked={regForm.whatsapp}
                                     onChange={(e) => setRegForm({...regForm, whatsapp: e.target.checked})}
                                     className="w-6 h-6 rounded-md border-foreground/20 accent-foreground dark:accent-white" 
                                   />
                                </div>
                                
                                {regStatus.type === 'error' && (
                                   <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] font-semibold text-red-500 text-center py-2 bg-red-500/10 rounded-xl">
                                     {regStatus.msg}
                                   </motion.p>
                                )}
                                
                                <button 
                                  disabled={regStatus.type === 'loading'}
                                  className="w-full h-14 mt-2 rounded-2xl bg-foreground text-background dark:bg-white dark:text-black text-[13px] font-bold tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl hover:opacity-90 disabled:opacity-50"
                                >
                                   {regStatus.type === 'loading' ? (
                                      <><div className="w-4 h-4 border-2 border-background/20 dark:border-black/20 border-t-background dark:border-t-black rounded-full animate-spin"/> Verifying...</>
                                   ) : 'Join Community'}
                                </button>
                             </form>
                          )}
                       </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Fit Submission Drawer - Glassmorphic Sheet */}
                   <AnimatePresence>
                    {showSubForm && (
                       <motion.div 
                         initial={{ y: '100%' }}
                         animate={{ y: 0 }}
                         exit={{ y: '100%' }}
                         transition={{ type: "spring", damping: 25, stiffness: 200 }}
                         className="absolute inset-x-0 bottom-0 z-[60] h-[95%] bg-background/95 dark:bg-[#0A0A0A]/95 backdrop-blur-3xl rounded-t-[2.5rem] p-8 shadow-[0_-40px_100px_rgba(0,0,0,0.15)] dark:shadow-[0_-40px_100px_rgba(0,0,0,0.5)] border-t border-foreground/[0.08] dark:border-white/10 flex flex-col"
                       >
                          <div className="flex justify-between items-center mb-6">
                             <div>
                                <h4 className="text-[18px] font-semibold text-foreground dark:text-white tracking-tight">Publish Look</h4>
                                <p className="text-[12px] text-foreground/50 dark:text-white/50 font-medium mt-0.5">Share your aesthetic with the network</p>
                             </div>
                             <button onClick={() => setShowSubForm(false)} className="w-8 h-8 flex items-center justify-center bg-foreground/5 dark:bg-white/5 rounded-full hover:bg-foreground/10 dark:hover:bg-white/10 transition-colors">
                               <X className="w-4 h-4 text-foreground/50 dark:text-white/50" />
                             </button>
                          </div>
                          
                          {subStatus.type === 'success' ? (
                             <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-6">
                                  <Sparkles className="w-20 h-20 text-blue-500" />
                                </motion.div>
                                <span className="text-xl font-light tracking-tight text-foreground dark:text-white leading-tight max-w-[240px]">{subStatus.msg}</span>
                             </div>
                          ) : (
                             <form onSubmit={handleSubmission} className="space-y-4 flex-1 overflow-y-auto pr-1 pb-4 custom-scrollbar">
                                <div className="space-y-1.5">
                                   <label className="text-[11px] font-bold text-foreground/50 dark:text-white/50 tracking-tight ml-2">Display Name</label>
                                   <input 
                                     required
                                     placeholder="Public identity"
                                     value={subForm.name}
                                     onChange={(e) => setSubForm({...subForm, name: e.target.value})}
                                     className="w-full bg-foreground/[0.03] dark:bg-white/[0.03] border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-[14px] font-medium text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-foreground/10 dark:focus:ring-white/10"
                                   />
                                </div>
                                <div className="space-y-1.5">
                                   <label className="text-[11px] font-bold text-foreground/50 dark:text-white/50 tracking-tight ml-2">Email Node</label>
                                   <input 
                                     required
                                     type="email"
                                     placeholder="account@domain.com"
                                     value={subForm.email}
                                     onChange={(e) => setSubForm({...subForm, email: e.target.value})}
                                     className="w-full bg-foreground/[0.03] dark:bg-white/[0.03] border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-[14px] font-medium text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-foreground/10 dark:focus:ring-white/10"
                                   />
                                </div>
                                <div className="space-y-1.5">
                                   <label className="text-[11px] font-bold text-foreground/50 dark:text-white/50 tracking-tight ml-2">Source Image URL</label>
                                   <input 
                                     required
                                     placeholder="https://..."
                                     value={subForm.imageUrl}
                                     onChange={(e) => setSubForm({...subForm, imageUrl: e.target.value})}
                                     className="w-full bg-foreground/[0.03] dark:bg-white/[0.03] border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-[14px] font-medium text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-foreground/10 dark:focus:ring-white/10"
                                   />
                                </div>
                                <div className="space-y-1.5 flex-1 flex flex-col">
                                   <label className="text-[11px] font-bold text-foreground/50 dark:text-white/50 tracking-tight ml-2">Style Narrative</label>
                                   <textarea 
                                     required
                                     placeholder="Describe the curation..."
                                     value={subForm.quote}
                                     onChange={(e) => setSubForm({...subForm, quote: e.target.value})}
                                     className="w-full flex-1 min-h-[120px] bg-foreground/[0.03] dark:bg-white/[0.03] border border-foreground/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-[14px] font-medium text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-foreground/10 dark:focus:ring-white/10 resize-none"
                                   />
                                </div>
                                
                                <div className="p-4 rounded-2xl bg-foreground/[0.02] dark:bg-white/[0.02] border border-foreground/[0.05] dark:border-white/[0.05]">
                                   <p className="text-[10px] text-foreground/40 dark:text-white/40 leading-relaxed font-medium">All submissions undergo editorial review before appearing on the Global Showcase.</p>
                                </div>

                                {subStatus.type === 'error' && (
                                   <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] font-semibold text-red-500 text-center py-2 bg-red-500/10 rounded-xl">
                                     {subStatus.msg}
                                   </motion.p>
                                )}
                                
                                <button 
                                  disabled={subStatus.type === 'loading'}
                                  className="w-full h-14 mt-2 rounded-2xl bg-foreground text-background dark:bg-white dark:text-black text-[13px] font-bold tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl hover:opacity-90 disabled:opacity-50"
                                >
                                   {subStatus.type === 'loading' ? (
                                      <><div className="w-4 h-4 border-2 border-background/20 dark:border-black/20 border-t-background dark:border-t-black rounded-full animate-spin"/> Uploading...</>
                                   ) : 'Submit to Editor'}
                                </button>
                             </form>
                          )}
                       </motion.div>
                    )}
                  </AnimatePresence>

                 {/* Minimal Chat Interface */}
                 <div className="flex-[1.5] flex flex-col pt-6 pb-2 px-6 overflow-hidden relative border-b border-foreground/[0.05] dark:border-white/[0.05]">
                     {/* Floating Header */}
                    <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white/90 via-white/80 to-transparent dark:from-black/90 dark:via-black/80 z-10 flex items-center justify-between px-8 backdrop-blur-sm">
                       <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-foreground/40 dark:text-white/40" />
                          <h4 className="text-[13px] font-bold tracking-tight text-foreground dark:text-white">Live Discussion</h4>
                       </div>
                       <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#34C759]/10 text-[#34C759] text-[9px] font-bold uppercase tracking-widest shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                          Online
                       </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-5 custom-scrollbar pr-2 pb-4 pt-16">
                       {messages.length === 0 ? (
                         <div className="h-full flex flex-col items-center justify-center text-foreground/20 dark:text-white/20">
                            <MessageCircle className="w-8 h-8 mb-3 opacity-20" />
                            <p className="text-[11px] font-medium tracking-wide">No active discussions.</p>
                         </div>
                       ) : (
                         messages.map((msg, i) => {
                           const isMe = msg.customer.name === session?.user?.name || msg.customer.email === session?.user?.email;
                           return (
                             <motion.div 
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               transition={{ delay: i * 0.05 }}
                               key={msg.id} 
                               className={`flex flex-col gap-1.5 max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                             >
                                <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                   <div className="w-5 h-5 rounded-full bg-foreground/[0.05] dark:bg-white/[0.05] flex items-center justify-center shadow-sm">
                                      {isMe ? <User className="w-2.5 h-2.5 text-foreground/40 dark:text-white/40" /> : <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.customer.name}`} className="w-full h-full rounded-full" />}
                                   </div>
                                   <span className="text-[10px] font-bold text-foreground/40 dark:text-white/40 tracking-tight">{isMe ? 'You' : msg.customer.name}</span>
                                </div>
                                <div className={`px-4 py-3 text-[13px] font-medium leading-relaxed shadow-md ${
                                  isMe 
                                  ? 'bg-[#007AFF] text-white rounded-[20px] rounded-tr-[5px]' 
                                  : 'bg-white dark:bg-[#1C1C1E] text-foreground dark:text-white rounded-[20px] rounded-tl-[5px] border border-foreground/[0.03] dark:border-white/[0.05]'
                                }`}>
                                   {msg.content}
                                </div>
                                <span className="text-[9px] text-foreground/30 dark:text-white/30 font-medium px-1">
                                   {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                             </motion.div>
                           );
                         })
                       )}
                       <div ref={chatEndRef} />
                    </div>
                 </div>

                 {/* Apple Message Input */}
                 <div className="p-4 pb-6 bg-white/50 dark:bg-[#1C1C1E]/50 backdrop-blur-2xl">
                    <div className="relative flex items-center">
                       <input 
                         placeholder="Message..."
                         className="w-full h-[44px] bg-white dark:bg-[#2C2C2E] border border-foreground/[0.08] dark:border-white/[0.08] rounded-full pl-5 pr-12 text-[15px] font-medium text-foreground dark:text-white placeholder:text-foreground/30 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 transition-all shadow-sm"
                       />
                       <button className="absolute right-1 w-[36px] h-[36px] rounded-full bg-[#007AFF] text-white flex items-center justify-center hover:bg-[#0066D6] active:scale-95 transition-all shadow-sm">
                          <Send className="w-4 h-4 ml-0.5" />
                       </button>
                    </div>
                 </div>

              </div>
           </div>

        </div>
      </div>
    </main>
  );
}
