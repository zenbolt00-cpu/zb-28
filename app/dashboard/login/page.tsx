"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock } from 'lucide-react';
import Image from 'next/image';

export default function DashboardLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const from = searchParams.get('from') || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        router.push(from);
      } else {
        setError(data.error || 'Invalid password. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'hsla(var(--background), 1)',
      }}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-[2rem] p-8 flex flex-col gap-7"
        style={{
          background: 'hsla(var(--glass-bg), 0.55)',
          backdropFilter: 'blur(48px) saturate(200%)',
          WebkitBackdropFilter: 'blur(48px) saturate(200%)',
          boxShadow: 'inset 0 0 0 1px hsla(var(--glass-border), 0.12), 0 32px 80px -8px rgba(0,0,0,0.3)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-12 h-12 bg-foreground/5 rounded-2xl flex items-center justify-center border border-foreground/10">
            <Image src="/zica-bella-logo_8.png" alt="Logo" fill className="object-contain p-2" />
          </div>
          <div className="text-center">
            <p className="font-rocaston text-sm tracking-[0.25em] text-foreground">ZICA BELLA</p>
            <p className="text-[9px] uppercase tracking-[0.4em] text-foreground/30 font-light mt-0.5">Admin Portal</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[9px] uppercase tracking-[0.35em] text-foreground/40 font-medium">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 w-3.5 h-3.5 text-foreground/25" />
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-foreground/[0.04] border border-foreground/[0.08] text-foreground text-sm placeholder-foreground/20 focus:outline-none focus:border-foreground/20 transition-all"
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow(v => !v)}
                className="absolute right-3 p-1 text-foreground/25 hover:text-foreground/60 transition-colors"
              >
                {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {error && (
              <p className="text-[10px] text-red-400 font-light">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-xl bg-foreground text-background text-[10px] uppercase tracking-[0.35em] font-light transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-[8px] text-foreground/15 uppercase tracking-[0.3em]">© 2026 Zica Bella</p>
      </div>
    </div>
  );
}
