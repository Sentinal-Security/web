"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { resendVerification } from "@/lib/api";
import Footer from "@/app/partials/footer";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading, error, setError } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const role = "ADMIN";
  const [company, setCompany] = useState("");
  const [companyManual, setCompanyManual] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activationPending, setActivationPending] = useState<{ email: string } | null>(null);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState("");

  const detectCompany = (val: string): string => {
    if (!val.includes("@")) return "";
    const localPart = val.substring(0, val.indexOf("@")).toLowerCase();
    const domainPart = val.substring(val.indexOf("@") + 1).toLowerCase();
    if (localPart.includes("-")) {
      const candidate = localPart.substring(localPart.lastIndexOf("-") + 1).trim();
      if (candidate) return candidate;
    }
    if (localPart.includes("+")) {
      const candidate = localPart.substring(localPart.lastIndexOf("+") + 1).trim();
      if (candidate) return candidate;
    }
    return domainPart;
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (!companyManual) {
      const detected = detectCompany(val);
      if (detected) setCompany(detected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    setError(null);

    if (!fullName.trim()) {
      setValidationError("Full name is required.");
      return;
    }
    if (!email.trim()) {
      setValidationError("Email is required.");
      return;
    }
    if (!password) {
      setValidationError("Password is required.");
      return;
    }
    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters long.");
      return;
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?`~]/.test(password);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      setValidationError("Password must include uppercase, lowercase, a number, and a special character.");
      return;
    }

    const resolvedCompany = company.trim() || (email.includes("@") ? detectCompany(email) : "");
    if (!resolvedCompany) {
      setValidationError("Company workspace name is required for Administrator accounts.");
      return;
    }

    if (!agreed) {
      setValidationError("Please agree to the Terms and Privacy Policy.");
      return;
    }

    const res = await register({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      role,
      company: resolvedCompany || undefined,
    });

    if (res.success) {
      setActivationPending({ email: email.trim() });
    }
  };

  const handleSocialAuth = (provider: "Google" | "Apple" | "Microsoft") => {
    const providerEmail =
      provider === "Google"
        ? "new.user@gmail.com"
        : provider === "Apple"
        ? "new.user@privaterelay.appleid.com"
        : "new.user@outlook.com";

    setSuccessMessage(`${provider} Identity Verified. Preparing sandbox profile...`);
    setTimeout(() => {
      router.push(`/login?ssoEmail=${encodeURIComponent(providerEmail)}`);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col justify-between selection:bg-cyan-400 selection:text-black font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 pt-8 pb-6 flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-bold tracking-wider text-[#38e1ff] hover:opacity-90 transition-opacity flex items-center gap-2.5 font-orbitron"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Sentinel Logo" className="w-8 h-8 rounded-lg object-contain" />
          <span>Sentinel</span>
        </Link>


        <nav className="flex items-center gap-7 sm:gap-10 text-xs sm:text-sm text-slate-300 font-medium">
          <Link href="/pricing" className="hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/features" className="hover:text-white transition-colors">
            Features
          </Link>
          <Link href="/docs" className="hover:text-white transition-colors">
            API &amp; Docs
          </Link>
          <Link href="/faq" className="hover:text-white transition-colors">
            FAQ
          </Link>
          <Link href="/services" className="hover:text-white transition-colors">
            Services
          </Link>
        </nav>
      </header>

      {/* Main Registration Content */}
      <main className="flex-1 flex items-center justify-center w-full px-6 sm:px-10 lg:px-16 py-8 sm:py-14">
        <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-20 items-center">
          
          {/* Left Column: Glowing Blue Hero Card with Stepper */}
          <div className="lg:col-span-6 w-full flex justify-center">
            <div
              className="relative w-full max-w-xl xl:max-w-2xl 2xl:max-w-3xl rounded-[36px] px-8 sm:px-14 pt-24 sm:pt-32 pb-14 overflow-hidden border border-blue-500/20 shadow-2xl flex flex-col justify-end min-h-[580px] lg:min-h-[660px] xl:min-h-[720px]"
              style={{
                background:
                  "radial-gradient(135% 85% at 50% 0%, #1e5bff 0%, #0d2875 36%, #061239 68%, #03081a 100%)",
              }}
            >
              {/* Top ambient soft radial glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-36 bg-blue-500/20 blur-3xl pointer-events-none rounded-full" />

              {/* Card Titles */}
              <div className="text-center mb-10 relative z-10">
                <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-white tracking-tight leading-tight">
                  Get Started with Us
                </h1>
                <p className="text-blue-200/80 text-xs sm:text-sm mt-3 font-normal leading-relaxed max-w-xs mx-auto">
                  Welcome to Sentinel - Let&apos;s create
                  <br />
                  your account.
                </p>
              </div>

              {/* Vertical Stepper Container */}
              <div className="w-full max-w-md xl:max-w-lg mx-auto flex flex-col items-center relative z-10">
                {/* Step 1 Pill (Active) */}
                <div className="w-full rounded-2xl p-3.5 sm:p-4 flex items-center bg-white text-slate-900 shadow-xl shadow-black/20">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 mr-4 bg-black text-white">
                    1
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    Sign up your account
                  </span>
                </div>

                {/* Vertical Center Connector Line from 1 to 2 */}
                <div className="w-[1.5px] h-6 bg-blue-300/30 my-1"></div>

                {/* Step 2 Pill (Inactive) */}
                <div className="w-full rounded-2xl p-3.5 sm:p-4 flex items-center bg-[#0f172a]/70 border border-slate-700/50 text-slate-300">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 mr-4 bg-white text-slate-950">
                    2
                  </div>
                  <span className="text-sm font-medium text-slate-300">
                    Verify your account
                  </span>
                </div>

                {/* Spacing gap between 2 and 3 */}
                <div className="h-3.5"></div>

                {/* Step 3 Pill (Inactive) */}
                <div className="w-full rounded-2xl p-3.5 sm:p-4 flex items-center bg-[#0f172a]/70 border border-slate-700/50 text-slate-300">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 mr-4 bg-white text-slate-950">
                    3
                  </div>
                  <span className="text-sm font-medium text-slate-300">
                    Set up your profile
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sign Up Account Form Area */}
          <div className="lg:col-span-6 w-full max-w-xl xl:max-w-2xl mx-auto flex flex-col justify-center">
            {activationPending ? (
              <div className="bg-[#0d1522] border border-cyan-500/30 rounded-2xl p-6 sm:p-8 text-center shadow-[0_0_35px_rgba(56,225,255,0.1)]">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-5 text-cyan-400">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Check Your Email</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  We have dispatched an activation link via Google SMTP to:
                </p>
                <div className="py-2.5 px-4 bg-slate-900 border border-slate-700 rounded-xl font-mono text-cyan-300 text-sm font-semibold mb-6 break-all">
                  {activationPending.email}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Please open your email inbox and click the activation button to verify your identity. If you do not see it within a minute, check your spam or promotions folder.
                </p>

                {resendStatus && (
                  <div className="mb-4 p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs text-center">
                    {resendStatus}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    className="w-full py-3.5 px-4 bg-[#3bf0ff] hover:bg-[#2fe0ef] text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/20 text-center block"
                  >
                    Proceed to Sign In
                  </Link>
                  <button
                    type="button"
                    disabled={resending}
                    onClick={async () => {
                      setResending(true);
                      setResendStatus("");
                      const r = await resendVerification(activationPending.email);
                      setResending(false);
                      setResendStatus(r.message || "Fresh activation link sent.");
                    }}
                    className="w-full py-3 px-4 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {resending ? "Resending..." : "Resend Activation Email"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Header Titles */}
                <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                Sign up account
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mt-2.5 max-w-sm mx-auto">
                Reclaim control of your data with confidence.
                <br />
                Secure, seamless, and built to empower you every step of the way.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              {/* Alert: Validation or API Error */}
              {(validationError || error) && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{validationError || error}</span>
                </div>
              )}

              {/* Alert: Success Message */}
              {successMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{successMessage}</span>
                </div>
              )}


              {/* Company Workspace Field */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Company Workspace <span className="text-purple-400 font-bold">*</span>
                  </label>
                  {company && (
                    <span className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 font-mono">
                      @{company}
                    </span>
                  )}
                </div>
                <div className="relative flex items-center bg-[#131926] border border-slate-700/60 rounded-xl px-4 py-3.5 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400 transition-all">
                  <svg className="w-5 h-5 text-slate-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => {
                      setCompany(e.target.value.toLowerCase());
                      setCompanyManual(true);
                    }}
                    placeholder="e.g. acme, companynamexx"
                    className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-slate-500"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Tenant isolation boundary: you will only manage users within this company workspace.
                </p>
              </div>

              {/* Full Name Input Field */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <div className="relative flex items-center bg-[#131926] border border-slate-700/60 rounded-xl px-4 py-3.5 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400 transition-all">
                  <svg
                    className="w-5 h-5 text-slate-400 mr-3 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.6"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Email Input Field */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Email
                </label>
                <div className="relative flex items-center bg-[#131926] border border-slate-700/60 rounded-xl px-4 py-3.5 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400 transition-all">
                  <svg
                    className="w-5 h-5 text-slate-400 mr-3 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.6"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="Enter your email (e.g. ractopen-companynamexx@proton.me)"
                    className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Password Input Field */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative flex items-center bg-[#131926] border border-slate-700/60 rounded-xl px-4 py-3.5 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400 transition-all">
                  <svg
                    className="w-5 h-5 text-slate-400 mr-3 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.6"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password (min. 8 characters)"
                    className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-slate-500"
                  />
                </div>
                {password && (
                  <div className="mt-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/60 text-[11px] space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? "bg-emerald-400" : "bg-slate-600"}`}></span>
                      <span className={password.length >= 8 ? "text-emerald-300 font-medium" : "text-slate-400"}>At least 8 characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? "bg-emerald-400" : "bg-slate-600"}`}></span>
                      <span className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? "text-emerald-300 font-medium" : "text-slate-400"}>Uppercase and lowercase letters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(password) ? "bg-emerald-400" : "bg-slate-600"}`}></span>
                      <span className={/[0-9]/.test(password) ? "text-emerald-300 font-medium" : "text-slate-400"}>At least one numeric digit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${/[!@#$%^&*()_+\-=\[\]{}|;':",./<>?`~]/.test(password) ? "bg-emerald-400" : "bg-slate-600"}`}></span>
                      <span className={/[!@#$%^&*()_+\-=\[\]{}|;':",./<>?`~]/.test(password) ? "text-emerald-300 font-medium" : "text-slate-400"}>At least one special symbol (!@#$%...)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms and Privacy Policy Checkbox */}
              <div className="flex items-center gap-2.5 mt-2 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-[#131926] text-cyan-400 accent-cyan-400 cursor-pointer"
                />
                <label
                  htmlFor="agreeTerms"
                  className="text-xs text-slate-400 cursor-pointer select-none"
                >
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="text-[#38e1ff] hover:underline font-medium"
                  >
                    Terms and Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Continue Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#3bf0ff] hover:bg-[#2fe0ef] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-slate-950" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </form>

              {/* Divider: or sign up with */}
              <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-xs text-slate-400 font-normal">
                  or sign up with
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* 3 OAuth Identity Provider Buttons */}
              <div className="space-y-3">
                {/* Google Button */}
                <button
                  type="button"
                  onClick={() => handleSocialAuth("Google")}
                  className="w-full py-3 px-4 bg-[#1e2538] hover:bg-[#252e45] active:scale-[0.99] border border-slate-700/40 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27a7.18 7.18 0 0 1 0-4.54V6.58H1.25a11.96 11.96 0 0 0 0 10.84l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Apple Button */}
                <button
                  type="button"
                  onClick={() => handleSocialAuth("Apple")}
                  className="w-full py-3 px-4 bg-[#1e2538] hover:bg-[#252e45] active:scale-[0.99] border border-slate-700/40 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.8c.61-.75 1.04-1.8 1.01-2.8-.96.04-2.06.66-2.7 1.41-.56.65-.99 1.7-.93 2.7.97.08 2.01-.56 2.62-1.31z" />
                  </svg>
                  <span>Continue with Apple</span>
                </button>

                {/* Microsoft Button */}
                <button
                  type="button"
                  onClick={() => handleSocialAuth("Microsoft")}
                  className="w-full py-3 px-4 bg-[#1e2538] hover:bg-[#252e45] active:scale-[0.99] border border-slate-700/40 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#f25022" d="M1 1h10v10H1z" />
                    <path fill="#7fba00" d="M13 1h10v10H13z" />
                    <path fill="#00a4ef" d="M1 13h10v10H1z" />
                    <path fill="#ffb900" d="M13 13h10v10H13z" />
                  </svg>
                  <span>Continue with Microsoft</span>
                </button>
              </div>

              {/* Login link & Standard user guidance */}
              <div className="mt-6 text-center space-y-2">
                <p className="text-xs sm:text-sm text-slate-400">
                  Already have an account?{" "}
                  <Link href="/login" className="text-blue-500 hover:text-blue-400 font-medium">
                    Login
                  </Link>
                </p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Standard employees or members: Account creation is managed by your tenant administrator. Contact your company IT admin for credentials.
                </p>
              </div>
            </div>
          )}
          </div>
          </div>
        </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
