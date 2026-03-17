"use client";

import { useState, useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, ArrowRight, Loader2, ChevronLeft, Lock, ChevronDown } from "lucide-react";
import Image from "next/image";

type LoginMethod = "otp" | "shopify" | "google";

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
  
  const [activeMethod, setActiveMethod] = useState<LoginMethod>("otp");
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

  // Shopify login state
  const [shopifyEmail, setShopifyEmail] = useState("");
  const [shopifyPassword, setShopifyPassword] = useState("");

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
    // Strip non-digit characters
    const digitsOnly = value.replace(/\D/g, "");
    // Cap at 10 digits
    const capped = digitsOnly.slice(0, 10);
    setPhone(capped);
    // Clear error when user types
    if (phoneError) setPhoneError("");
  };

  const validatePhone = (): boolean => {
    if (!phone) {
      setPhoneError("Phone number is required");
      return false;
    }
    if (phone.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
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
    // Mock OTP send — replace with SMS provider in production
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
    const result = await signIn("otp", {
      phone: fullPhone,
      otp: otpString,
      redirect: true,
      callbackUrl,
    });
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  const handleShopifyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopifyEmail || !shopifyPassword) return;
    setLoading(true);
    setError("");
    const result = await signIn("shopify-customer", {
      email: shopifyEmail,
      password: shopifyPassword,
      redirect: true,
      callbackUrl,
    });
    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  const methods: { key: LoginMethod; label: string; icon: React.ReactNode }[] = [
    { key: "otp", label: "Phone", icon: <Phone className="w-3 h-3" /> },
    { key: "shopify", label: "Email", icon: <Mail className="w-3 h-3" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8 pt-28 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[300px] space-y-8"
      >
        {/* Brand */}
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
              Welcome
            </h1>
            <p className="text-muted-foreground text-[11px] font-medium tracking-wide">
              Sign in to continue.
            </p>
          </div>
        </div>

        {/* Method Tabs */}
        <div className="flex gap-1 p-1 bg-foreground/[0.03] border border-foreground/[0.05] rounded-xl">
          {methods.map((m) => (
            <button
              key={m.key}
              onClick={() => { setActiveMethod(m.key); setError(""); setPhoneError(""); setStep(1); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] transition-all ${
                activeMethod === m.key
                  ? "bg-foreground text-background shadow-lg"
                  : "text-foreground/30 hover:text-foreground/60"
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        {/* Forms */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {/* OTP Flow */}
            {activeMethod === "otp" && step === 1 && (
              <motion.form
                key="phone-step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSendOtp}
                className="space-y-3"
              >
                {/* Phone Input with Country Code */}
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    {/* Country Code Selector */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="flex items-center gap-1 h-full px-3 py-4 bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl hover:bg-foreground/[0.04] transition-all text-[13px] font-bold min-w-[85px] justify-between"
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="text-[14px]">{selectedCountry.flag}</span>
                          <span className="text-foreground/70 text-[12px]">{selectedCountry.code}</span>
                        </span>
                        <ChevronDown className={`w-3 h-3 text-foreground/30 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown */}
                      <AnimatePresence>
                        {showCountryDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -5, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 mt-1.5 w-[220px] max-h-[240px] overflow-y-auto bg-background border border-foreground/[0.08] rounded-xl shadow-2xl z-50 py-1"
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
                                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-foreground/[0.04] transition-colors ${
                                  selectedCountry.country === c.country && selectedCountry.code === c.code
                                    ? 'bg-foreground/[0.06]'
                                    : ''
                                }`}
                              >
                                <span className="text-[14px]">{c.flag}</span>
                                <span className="text-[11px] font-bold text-foreground/70 flex-1">{c.name}</span>
                                <span className="text-[10px] font-bold text-foreground/30">{c.code}</span>
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
                        className={`w-full px-4 py-4 bg-foreground/[0.02] border rounded-xl focus:bg-foreground/[0.04] focus:ring-1 focus:ring-foreground/5 transition-all outline-none text-[14px] font-bold tracking-tight placeholder:text-muted-foreground/20 ${
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
                      <p className="text-[9px] font-bold text-red-500/80 tracking-wide">{phoneError}</p>
                    ) : phone.length > 0 ? (
                      <p className={`text-[9px] font-bold tracking-wide ${isPhoneValid ? 'text-emerald-500/60' : 'text-foreground/20'}`}>
                        {phone.length}/10 digits {isPhoneValid && '✓'}
                      </p>
                    ) : (
                      <p className="text-[9px] font-bold tracking-wide text-transparent">.</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isPhoneValid}
                  className="w-full py-4 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-30 disabled:pointer-events-none shadow-xl"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Code"}
                  {!loading && <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />}
                </button>
              </motion.form>
            )}

            {activeMethod === "otp" && step === 2 && (
              <motion.form
                key="otp-step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleVerifyOtp}
                className="space-y-5"
              >
                <p className="text-center text-[11px] text-muted-foreground/50 font-medium">
                  Enter the 6-digit code sent to{' '}
                  <span className="text-foreground/60 font-bold">{selectedCountry.code} {phone.slice(0,3)}••••{phone.slice(7)}</span>
                </p>
                <div className="flex justify-between gap-2.5 text-center">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      className="w-full h-12 bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl text-center text-[14px] font-black transition-all focus:bg-foreground/[0.04] focus:ring-1 focus:ring-foreground/10 outline-none placeholder:text-muted-foreground/10"
                      maxLength={1}
                      required
                      placeholder="•"
                    />
                  ))}
                </div>
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading || otp.join("").length < 6}
                    className="w-full py-4 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center shadow-xl"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full flex items-center justify-center gap-1.5 text-center text-[8px] text-muted-foreground/30 hover:text-foreground/40 font-black tracking-[0.25em] uppercase transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    Back
                  </button>
                </div>
              </motion.form>
            )}

            {/* Shopify Email/Password Flow */}
            {activeMethod === "shopify" && (
              <motion.form
                key="shopify-step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleShopifyLogin}
                className="space-y-3"
              >
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/20 group-focus-within:text-foreground/40 transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={shopifyEmail}
                    onChange={(e) => setShopifyEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl focus:bg-foreground/[0.04] focus:ring-1 focus:ring-foreground/5 transition-all outline-none text-[14px] font-bold tracking-tight placeholder:text-muted-foreground/20"
                    required
                  />
                </div>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/20 group-focus-within:text-foreground/40 transition-colors">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="password"
                    placeholder="Password"
                    value={shopifyPassword}
                    onChange={(e) => setShopifyPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl focus:bg-foreground/[0.04] focus:ring-1 focus:ring-foreground/5 transition-all outline-none text-[14px] font-bold tracking-tight placeholder:text-muted-foreground/20"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !shopifyEmail || !shopifyPassword}
                  className="w-full py-4 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-30 disabled:pointer-events-none shadow-xl"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                  {!loading && <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Google Divider + Button */}
          <div className="relative flex items-center py-1 px-4">
            <div className="flex-grow border-t border-border/20"></div>
            <span className="flex-shrink mx-4 text-muted-foreground/20 text-[8px] uppercase tracking-[0.3em] font-bold">or</span>
            <div className="flex-grow border-t border-border/20"></div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-foreground/[0.03] border border-foreground/[0.06] rounded-xl transition-all text-[10px] font-black text-foreground/60 uppercase tracking-[0.15em] hover:bg-foreground/[0.06] active:scale-[0.98]"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Error */}
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
