"use client";

import { useState, useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, ChevronLeft, ChevronDown } from "lucide-react";
import Image from "next/image";

const COUNTRY_CODES = [
  { code: "+91", country: "IN", flag: "🇮🇳", name: "India" },
  { code: "+1", country: "US", flag: "🇺🇸", name: "United States" },
  { code: "+44", country: "GB", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+971", country: "AE", flag: "🇦🇪", name: "UAE" },
  { code: "+1", country: "CA", flag: "🇨🇦", name: "Canada" },
  { code: "+61", country: "AU", flag: "🇦🇺", name: "Australia" },
  { code: "+65", country: "SG", flag: "🇸🇬", name: "Singapore" },
  { code: "+49", country: "DE", flag: "🇩🇪", name: "Germany" },
  { code: "+33", country: "FR", flag: "🇫🇷", name: "France" },
  { code: "+81", country: "JP", flag: "🇯🇵", name: "Japan" },
  { code: "+82", country: "KR", flag: "🇰🇷", name: "South Korea" },
  { code: "+86", country: "CN", flag: "🇨🇳", name: "China" },
  { code: "+55", country: "BR", flag: "🇧🇷", name: "Brazil" },
  { code: "+52", country: "MX", flag: "🇲🇽", name: "Mexico" },
  { code: "+27", country: "ZA", flag: "🇿🇦", name: "South Africa" },
  { code: "+966", country: "SA", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+974", country: "QA", flag: "🇶🇦", name: "Qatar" },
  { code: "+234", country: "NG", flag: "🇳🇬", name: "Nigeria" },
  { code: "+64", country: "NZ", flag: "🇳🇿", name: "New Zealand" },
  { code: "+60", country: "MY", flag: "🇲🇾", name: "Malaysia" },
];

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]); // Default: India
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState(1); // 1: Input, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePhoneChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    const capped = digitsOnly.slice(0, 10);
    setPhone(capped);
    if (phoneError) setPhoneError("");
  };

  const validatePhone = (): boolean => {
    if (!phone) {
      setPhoneError("Phone required");
      return false;
    }
    if (phone.length !== 10) {
      setPhoneError("Must be 10 digits");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const isPhoneValid = phone.length === 10;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone()) return;
    setLoading(true);
    setError("");
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
    const fullPhone = `${selectedCountry.code}${phone}`;
    try {
      const result = await signIn("otp", {
        phone: fullPhone,
        otp: otpString,
        redirect: false,
        callbackUrl,
      });
      if (result?.error) {
        setError("Invalid OTP. Try 123456.");
        setLoading(false);
      } else if (result?.ok) {
        router.replace(callbackUrl);
      }
    } catch (err) {
      setError("Login failed. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  const handleAppleSignIn = () => {
    signIn("apple", { callbackUrl });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 pt-16 pb-16 font-sans overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[260px] space-y-6"
      >
        {/* Brand */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="flex justify-center"
          >
            <div className="relative w-10 h-10 grayscale brightness-0 dark:invert opacity-90">
              <Image
                src="/zica-bella-logo_8.png"
                alt="Zica Bella"
                fill
                className="object-contain"
                priority
              />
            </div>
          </motion.div>
          <div className="space-y-0.5 px-4 mb-2">
            <h1 className="text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/80">
              Identity
            </h1>
            <p className="text-muted-foreground text-[6px] font-bold uppercase tracking-[0.2em] opacity-30">
              Authenticating user
            </p>
          </div>
        </div>

        {/* Forms */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {/* OTP Flow */}
            {step === 1 && (
              <motion.form
                key="phone-step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSendOtp}
                className="space-y-2.5"
              >
                {/* Phone Input with Country Code */}
                <div className="space-y-1">
                  <div className="flex gap-1.5">
                    {/* Country Code Selector */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="flex items-center gap-1 h-full px-2 py-2 bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl hover:bg-foreground/[0.04] transition-all text-[10px] font-bold min-w-[55px] justify-between"
                      >
                        <span className="text-foreground/70">{selectedCountry.code}</span>
                        <ChevronDown className={`w-2 h-2 text-foreground/30 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown */}
                      <AnimatePresence>
                        {showCountryDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -5, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 mt-1 w-[160px] max-h-[160px] overflow-y-auto bg-background border border-foreground/[0.08] rounded-xl shadow-2xl z-50 py-1"
                            style={{ backdropFilter: 'blur(20px)' }}
                          >
                            {COUNTRY_CODES.map((c, idx) => (
                              <button
                                key={`${c.country}-${idx}`}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(c);
                                  setShowCountryDropdown(false);
                                }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-foreground/[0.04] transition-colors ${
                                  selectedCountry.country === c.country && selectedCountry.code === c.code
                                    ? 'bg-foreground/[0.06]'
                                    : ''
                                }`}
                              >
                                <span className="text-[12px]">{c.flag}</span>
                                <span className="text-[9px] font-bold text-foreground/70 flex-1">{c.name}</span>
                                <span className="text-[8px] font-bold text-foreground/30">{c.code}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Phone Number Input */}
                    <div className="relative group flex-1">
                      <input
                        type="tel"
                        placeholder="10-digit number"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className={`w-full px-3 py-3 bg-foreground/[0.02] border rounded-xl focus:bg-foreground/[0.04] focus:ring-1 focus:ring-foreground/5 transition-all outline-none text-[12px] font-bold tracking-tight placeholder:text-muted-foreground/20 ${
                          phoneError
                            ? 'border-red-500/30 focus:ring-red-500/20'
                            : 'border-foreground/[0.05]'
                        }`}
                        inputMode="numeric"
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>

                  {/* Phone validation feedback */}
                  <div className="flex items-center justify-between px-1">
                    {phoneError ? (
                      <p className="text-[8px] font-bold text-red-500/80 tracking-wide">{phoneError}</p>
                    ) : phone.length > 0 ? (
                      <p className={`text-[8px] font-bold tracking-wide ${isPhoneValid ? 'text-emerald-500/60' : 'text-foreground/20'}`}>
                        {phone.length}/10 {isPhoneValid && '✓'}
                      </p>
                    ) : (
                      <p className="text-[8px] font-bold tracking-wide text-transparent">.</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isPhoneValid}
                  className="w-full py-3 bg-foreground text-background rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 group disabled:opacity-30 disabled:pointer-events-none shadow-md"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send Code"}
                  {!loading && <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />}
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="otp-step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleVerifyOtp}
                className="space-y-4"
              >
                <p className="text-center text-[9px] text-muted-foreground/50 font-medium">
                  Sent to{' '}
                  <span className="text-foreground/60 font-bold">{selectedCountry.code} {phone.slice(0,3)}••••{phone.slice(7)}</span>
                </p>
                <div className="flex justify-between gap-1.5 text-center px-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      className="w-full h-10 bg-foreground/[0.02] border border-foreground/[0.05] rounded-[0.5rem] text-center text-[12px] font-black transition-all focus:bg-foreground/[0.04] focus:ring-1 focus:ring-foreground/10 outline-none placeholder:text-muted-foreground/10"
                      maxLength={1}
                      required
                      placeholder="•"
                    />
                  ))}
                </div>
                <div className="space-y-2.5">
                  <button
                    type="submit"
                    disabled={loading || otp.join("").length < 6}
                    className="w-full py-3 bg-foreground text-background rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center shadow-md"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Verify"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full flex items-center justify-center gap-1 text-center text-[7px] text-muted-foreground/30 hover:text-foreground/40 font-black tracking-[0.25em] uppercase transition-colors"
                  >
                    <ChevronLeft className="w-2.5 h-2.5" />
                    Back
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Social Row */}
          <div className="pt-2 space-y-4">
            <div className="flex items-center gap-3 px-1">
              <div className="h-[1px] flex-1 bg-foreground/[0.03]" />
              <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-foreground/20">Social</span>
              <div className="h-[1px] flex-1 bg-foreground/[0.03]" />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex-1 flex items-center justify-center h-10 bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl hover:bg-foreground/[0.04] transition-all"
              >
                <svg className="w-3.5 h-3.5 opacity-60 grayscale" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="currentColor"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
                </svg>
              </button>
              <button
                type="button"
                onClick={handleAppleSignIn}
                className="flex-1 flex items-center justify-center h-10 bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl hover:bg-foreground/[0.04] transition-all"
              >
                <svg className="w-3.5 h-3.5 opacity-60 grayscale" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-[9px] text-red-500 font-bold tracking-tight py-2 px-3 bg-red-500/5 rounded-lg border border-red-500/10"
          >
            {error}
          </motion.p>
        )}

        <p className="text-center text-[8px] text-muted-foreground/30 font-bold tracking-[0.1em] uppercase px-4 leading-relaxed">
          Terms & Privacy
        </p>
      </motion.div>
    </div>
  );
}
