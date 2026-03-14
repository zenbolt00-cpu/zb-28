"use client";

import { useState, useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Chrome, ArrowRight, Loader2, ChevronLeft } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/profile");
    }
  }, [status, router]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    // Mocking OTP send
    setTimeout(() => {
      setStep(2);
      setLoading(false);
    }, 1200);
  };

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length < 6) return;
    
    setLoading(true);
    setError("");

    const result = await signIn("otp", {
      phone,
      otp: otpString,
      redirect: true,
      callbackUrl: "/",
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8 pt-28 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[280px] space-y-10"
      >
        <div className="text-center space-y-5">
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="flex justify-center"
          >
            <div className="relative w-14 h-14 grayscale brightness-0 dark:invert opacity-90">
              <Image
                src="/zica-bella-logo_8.png"
                alt="Zica Bella"
                fill
                className="object-contain"
                priority
              />
            </div>
          </motion.div>
          <div className="space-y-1 px-4">
            <h1 className="text-lg font-bold tracking-tight text-foreground/90">
              {step === 1 ? "Welcome" : "Verify Code"}
            </h1>
            <p className="text-muted-foreground text-[11px] font-medium tracking-wide">
              {step === 1 ? "Enter your phone to continue." : `Sent to your mobile number.`}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="phone-step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSendOtp}
                className="space-y-3"
              >
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/30 rounded-xl focus:bg-background focus:ring-1 focus:ring-foreground/5 transition-all outline-none text-[13px] font-medium placeholder:text-muted-foreground/30"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !phone}
                  className="w-full py-3.5 bg-foreground text-background rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-30 disabled:pointer-events-none"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Next"}
                  {!loading && <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="otp-step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleVerifyOtp}
                className="space-y-6"
              >
                <div className="flex justify-between gap-2 text-center">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      className="w-full h-11 bg-muted/40 border-none rounded-xl text-center text-lg font-bold transition-all focus:bg-background focus:ring-1 focus:ring-foreground/10 outline-none"
                      maxLength={1}
                      required
                    />
                  ))}
                </div>
                
                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={loading || otp.join("").length < 6}
                    className="w-full py-3 bg-foreground text-background rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] hover:opacity-90 active:scale-[0.98] transition-all border border-foreground disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Sign In"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full flex items-center justify-center gap-1.5 text-center text-[10px] text-muted-foreground hover:text-foreground font-bold tracking-widest uppercase transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    Change Number
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="relative flex items-center py-2 px-4">
            <div className="flex-grow border-t border-border/20"></div>
            <span className="flex-shrink mx-4 text-muted-foreground/20 text-[8px] uppercase tracking-[0.3em] font-bold">Secure</span>
            <div className="flex-grow border-t border-border/20"></div>
          </div>

          <div className="px-4">
            <button
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-2.5 w-full py-3 bg-background border border-border/40 rounded-xl hover:bg-muted/30 transition-all text-[11px] font-bold text-foreground active:scale-[0.98] shadow-sm"
            >
              <Chrome className="w-4 h-4 text-[#4285F4]" />
              Google
            </button>
          </div>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-4 text-center text-[10px] text-red-500 font-bold tracking-tight py-2.5 px-4 bg-red-500/5 rounded-lg border border-red-500/10"
          >
            {error}
          </motion.p>
        )}

        <p className="text-center text-[9px] text-muted-foreground/30 font-bold tracking-[0.1em] uppercase px-6 leading-relaxed">
            Terms & Privacy
        </p>
      </motion.div>
    </div>
  );
}
