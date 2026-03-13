"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Smartphone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }
    setError(null);
    setIsLoading(true);

    // TODO: Integrate actual SMS/OTP API here
    setTimeout(() => {
      setIsLoading(false);
      setStep("otp");
    }, 1200);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError("Please enter a valid OTP.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: phone, // In this mobile-first flow, phone is passed as email
          password: otp, // Using otp as password for now in the local lookup logic
          shopDomain: '8tiahf-bk.myshopify.com'
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Set a cookie for the session
        document.cookie = `portal_session=${data.token}; path=/; max-age=86400; SameSite=Strict`;
        if (data.customer) {
          localStorage.setItem('customer_name', data.customer.name);
          localStorage.setItem('customer_email', data.customer.email || '');
          localStorage.setItem('customer_phone', data.customer.phone || '');
        }
        router.push('/portal');
      } else {
        setError(data.error || "Login failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider: "google" | "shop") => {
    setIsLoading(true);
    // For demo purposes, we'll just redirect to portal if it's "shop" and we have any customer
    console.log(`Logging in with ${provider}`);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/portal');
    }, 1500);
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col pt-header relative overflow-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full glow-orb opacity-10 blur-[100px]" />
        <div className="absolute top-[40%] -right-[10%] w-[60vw] h-[60vw] rounded-full glow-orb-2 opacity-10 blur-[120px]" />
      </div>

      {/* Header Back Button */}
      <div className="relative z-10 px-4 pt-4">
        <button
          onClick={() => {
            if (step === "otp") setStep("phone");
            else router.push("/");
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground/[0.04] border border-foreground/5 backdrop-blur-md hover:bg-foreground/[0.08] transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-foreground/70" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-20 relative z-10 max-w-md w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-heading text-2xl uppercase tracking-[0.2em] mb-3">
            Welcome
          </h1>
          <p className="text-[10px] font-extralight uppercase tracking-widest text-muted-foreground/60">
            Sign in to your Zica Bella account
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "phone" ? (
            <motion.div
              key="phone-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div
                  className="rounded-2xl p-4 transition-all"
                  style={{
                    background: "hsla(var(--glass-bg), 0.4)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid hsla(var(--glass-border), 0.08)",
                  }}
                >
                  <label className="text-[8px] font-extralight uppercase tracking-[0.25em] text-foreground/40 mb-2 block">
                    Phone Number
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-inter font-medium text-foreground/60 border-r border-foreground/10 pr-3">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="Enter mobile number"
                      className="flex-1 bg-transparent border-none outline-none text-[15px] font-inter font-medium tracking-wide placeholder:text-foreground/20"
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-[9px] text-red-400 text-center tracking-wide">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || phone.length < 10}
                  className="w-full py-4 rounded-2xl bg-foreground text-background text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 disabled:opacity-50 transition-all active:scale-[0.98]"
                  style={{ boxShadow: "0 8px 32px -8px hsla(var(--foreground), 0.3)" }}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Send OTP <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-foreground/[0.06]"></div>
                </div>
                <div className="relative flex justify-center text-[9px] uppercase tracking-widest">
                  <span className="bg-background px-4 text-foreground/30">Or continue with</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleOAuthLogin("google")}
                  type="button"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                  style={{
                    background: "hsla(var(--glass-bg), 0.6)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid hsla(var(--glass-border), 0.1)",
                  }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/80 mt-0.5">
                    Google
                  </span>
                </button>

                <button
                  onClick={() => handleOAuthLogin("shop")}
                  type="button"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                  style={{
                    background: "#5A31F4", // Shop Pay purple
                    boxShadow: "0 8px 24px -8px rgba(90,49,244,0.4)",
                  }}
                >
                  <svg className="w-14 h-5 text-white" viewBox="0 0 100 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.9 15.6C22.9 20.5 19.3 23.9 14.7 23.9C10.1 23.9 6.5 20.5 6.5 15.6C6.5 10.7 10.1 7.3 14.7 7.3C19.3 7.3 22.9 10.7 22.9 15.6ZM19.5 15.6C19.5 12.3 17.4 9.9 14.7 9.9C12 9.9 9.9 12.3 9.9 15.6C9.9 18.9 12 21.3 14.7 21.3C17.4 21.3 19.5 18.9 19.5 15.6Z" fill="white"/>
                    <path d="M42.7 7.7V23.5H39.5V17.3H29V23.5H25.8V7.7H29V14.6H39.5V7.7H42.7Z" fill="white"/>
                    <path d="M63 15.6C63 20.5 59.4 23.9 54.8 23.9C50.2 23.9 46.6 20.5 46.6 15.6C46.6 10.7 50.2 7.3 54.8 7.3C59.4 7.3 63 10.7 63 15.6ZM59.6 15.6C59.6 12.3 57.5 9.9 54.8 9.9C52.1 9.9 50 12.3 50 15.6C50 18.9 52.1 21.3 54.8 21.3C57.5 21.3 59.6 18.9 59.6 15.6Z" fill="white"/>
                    <path d="M78 15.6C78 19.8 75.2 23.9 69.8 23.9H65.8V31.6H62.6V7.7H69.8C75.2 7.7 78 11.5 78 15.6ZM74.8 15.6C74.8 13.1 73 10.4 69.7 10.4H65.8V21.1H69.7C73 21.1 74.8 18.3 74.8 15.6Z" fill="white"/>
                  </svg>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full"
            >
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="text-center mb-6">
                  <ShieldCheck className="w-10 h-10 text-foreground/20 mx-auto mb-3" />
                  <p className="text-[10px] uppercase tracking-widest text-foreground/50">
                    OTP sent to
                  </p>
                  <p className="text-[13px] font-inter font-medium tracking-wider text-foreground/80 mt-1">
                    +91 {phone}
                  </p>
                </div>

                <div
                  className="rounded-2xl p-4 transition-all"
                  style={{
                    background: "hsla(var(--glass-bg), 0.4)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid hsla(var(--glass-border), 0.08)",
                  }}
                >
                  <label className="text-[8px] font-extralight uppercase tracking-[0.25em] text-foreground/40 mb-2 block text-center">
                    Enter Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                    className="w-full bg-transparent border-none outline-none text-[24px] tracking-[0.5em] text-center font-inter font-bold text-foreground placeholder:text-foreground/10"
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-[9px] text-red-400 text-center tracking-wide">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || otp.length < 4}
                  className="w-full py-4 rounded-2xl bg-foreground text-background text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 disabled:opacity-50 transition-all active:scale-[0.98]"
                  style={{ boxShadow: "0 8px 32px -8px hsla(var(--foreground), 0.3)" }}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Verify & Login"
                  )}
                </button>
                
                <p className="text-center text-[9px] uppercase tracking-widest text-foreground/40 mt-6 cursor-pointer hover:text-foreground transition-colors">
                  Resend Code
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Terms Footer */}
      <div className="p-6 text-center pb-safe-offset-6">
        <p className="text-[7.5px] uppercase tracking-widest text-foreground/30 leading-relaxed">
          By continuing, you agree to our <br/>
          <Link href="/terms" className="underline underline-offset-4 hover:text-foreground/60">Terms of Service</Link> & <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground/60">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
