"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock } from 'lucide-react';
import Image from 'next/image';

export default function DashboardLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const from = searchParams.get('from') || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError('');

    // Safety timeout: if redirect takes too long, let the user try again
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Login successful, but redirect is taking too long. Please refresh.');
      }
    }, 5000);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        clearTimeout(timeout);
        // Use window.location for a hard redirect to ensure cookies are fresh
        window.location.href = from;
      } else {
        clearTimeout(timeout);
        setError(data.error || 'Invalid credentials. Please try again.');
        setLoading(false);
      }
    } catch {
      clearTimeout(timeout);
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center font-sans"
      style={{
        background: 'hsla(var(--background), 1)',
      }}
    >
       <div
        className="w-full max-w-[340px] mx-4 rounded-3xl p-10 flex flex-col gap-8"
        style={{
          background: 'hsla(var(--foreground), 0.02)',
          border: '1px solid hsla(var(--foreground), 0.05)',
          boxShadow: '0 30px 60px -12px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(20px)',
        }}
      >
         {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-12 h-12 bg-foreground/5 rounded-2xl flex items-center justify-center border border-foreground/[0.05]">
            <Image src="/zica-bella-logo_8.png" alt="Logo" fill className="object-contain p-2 opacity-80" />
          </div>
          <div className="text-center mt-2">
            <h1 className="text-[16px] font-black text-foreground tracking-tighter lowercase leading-none">infrastructure</h1>
            <p className="text-[8px] uppercase tracking-[0.5em] text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20 font-black mt-2">Authorization Portal</p>
          </div>
        </div>

        {/* Form */}
         <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="space-y-4">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-[8px] uppercase tracking-[0.4em] text-foreground/25 font-bold ml-1">Identity</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full px-5 py-3 rounded-xl bg-foreground/[0.03] border border-foreground/[0.06] text-foreground text-[11px] font-bold tracking-wide placeholder:text-foreground/15 focus:outline-none focus:border-foreground/20 transition-all"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[8px] uppercase tracking-[0.4em] text-foreground/25 font-bold ml-1">Access Key</label>
              <div className="relative flex items-center">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-5 py-8 rounded-xl bg-foreground/[0.03] border border-foreground/[0.06] text-foreground text-[11px] font-bold tracking-[0.2em] placeholder:text-foreground/15 focus:outline-none focus:border-foreground/20 transition-all placeholder:tracking-normal"
                  autoComplete="current-password"
                />
                 <button
                  type="button"
                  onClick={() => setShow(v => !v)}
                  className="absolute right-4 p-1 text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/40 dark:text-foreground/20 hover:text-foreground/80 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/80 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/60 dark:text-foreground/40 transition-colors"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest text-center mt-2">{error}</p>
            )}
          </div>

           <button
            type="submit"
            disabled={loading || !password || !username}
            className="w-full py-4 rounded-xl bg-foreground text-background text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:opacity-90 disabled:opacity-20 disabled:cursor-not-allowed active:scale-[0.98] mt-4 shadow-xl shadow-foreground/10"
          >
            {loading ? 'Validating...' : 'Authenticate'}
          </button>
        </form>

         <div className="flex flex-col items-center gap-4">
            <div className="h-[1px] w-12 bg-foreground/10" />
            <p className="text-[8px] text-foreground/15 uppercase tracking-[0.6em] font-bold">Secure Tunnel Active</p>
         </div>
      </div>
    </div>
  );
}
