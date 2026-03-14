"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Invalid password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 glass rounded-[2.5rem] p-10 border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center border border-foreground/10 mb-6 group transition-all duration-500 hover:border-foreground/20">
            <Lock className="w-8 h-8 text-foreground/40 group-hover:text-foreground/70 transition-colors" />
          </div>
          <h1 className="font-rocaston text-2xl tracking-[0.2em] text-foreground mb-2">ADMIN PORTAL</h1>
          <p className="text-[10px] font-extralight uppercase tracking-[0.4em] text-muted-foreground/60">Restricted Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Master Password</label>
            <div className="relative group">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-foreground/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all placeholder:text-muted-foreground/20 group-hover:bg-foreground/[0.08]"
                placeholder="Enter access key..."
              />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center animate-in shake duration-500">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-foreground text-background hover:opacity-90 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 shadow-xl shadow-foreground/5"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Authorize Session
              </>
            )}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-[9px] font-extralight uppercase tracking-[0.2em] text-muted-foreground/20">
            Zica Bella Integrated Systems © 2026
          </p>
        </div>
      </div>
    </div>
  );
}
