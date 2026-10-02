"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading, error, setError } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");
  const [company, setCompany] = useState("");
  const [companyManual, setCompanyManual] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters.");
      return;
    }

    const resolvedCompany = company.trim() || (email.includes("@") ? detectCompany(email) : "");
    if (role === "ADMIN" && !resolvedCompany) {
      setValidationError("Company workspace is required for Administrator accounts.");
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
      setSuccessMessage(
        res.message || "Account registered successfully! Redirecting to login..."
      );
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col justify-between selection:bg-cyan-400 selection:text-black font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 pt-8 pb-6 flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-[#38e1ff] hover:opacity-90 transition-opacity flex items-center gap-2.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Sentinel Logo" className="w-8 h-8 rounded-lg object-contain" />
          <span>Sentinel</span>
        </Link>


        <nav className="flex items-center gap-7 sm:gap-10 text-xs sm:text-sm text-slate-300 font-medium">
          <Link href="#" className="hover:text-white transition-colors">
            Pricing
          </Link>
          <div className="relative group cursor-pointer flex items-center gap-1.5 hover:text-white transition-colors">
            <span>Features</span>
            <svg
              className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <Link href="#" className="hover:text-white transition-colors">
            Support
          </Link>
          <Link href="#" className="hover:text-white transition-colors">
            Blog
          </Link>
          <Link href="#" className="hover:text-white transition-colors">
            Partners
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

              {/* Role Selection (Standard User vs Administrator) */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Account Purpose & Security Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("USER")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      role === "USER"
                        ? "bg-cyan-500/10 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                        : "bg-[#131926] border-slate-700/60 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">Standard User</span>
                      <span className={`w-2 h-2 rounded-full ${role === "USER" ? "bg-cyan-400" : "bg-slate-600"}`} />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">Member access to assigned apps and MFA</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("ADMIN")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      role === "ADMIN"
                        ? "bg-purple-500/10 border-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                        : "bg-[#131926] border-slate-700/60 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">Administrator</span>
                      <span className={`w-2 h-2 rounded-full ${role === "ADMIN" ? "bg-purple-400" : "bg-slate-600"}`} />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">IAM Operator, provision users & services</p>
                  </button>
                </div>
              </div>

              {/* Company Workspace Field */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Company Workspace {role === "ADMIN" && <span className="text-purple-400 font-bold">*</span>}
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
                    placeholder={role === "ADMIN" ? "e.g. companynamexx, acme.com" : "Optional company workspace"}
                    className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-slate-500"
                  />
                </div>
                {role === "ADMIN" && (
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Tenant isolation boundary: you will only manage users within this company workspace.
                  </p>
                )}
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
                    placeholder="Create a strong password (min. 6 characters)"
                    className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-slate-500"
                  />
                </div>
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
                    href="#"
                    className="text-blue-500 hover:text-blue-400 font-medium"
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

              {/* 3 Google Social Buttons (Exact replica of registerpage.png) */}
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="w-full py-3 px-4 bg-[#1e2538] hover:bg-[#252e45] active:scale-[0.99] border border-slate-700/40 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                    <span>Google</span>
                  </button>
                ))}
              </div>

              {/* Login link */}
              <p className="text-center text-xs sm:text-sm text-slate-400 mt-6">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-500 hover:text-blue-400 font-medium">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </main>

      {/* Footer (Matches registerpage.png reference UI) */}
      <footer className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 pt-16 pb-10 border-t border-slate-800/60 mt-12">
        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Solutions */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Solutions</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Application Services
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Security Servers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Security FireWalls
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Cloud Services
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Integrations
                </Link>
              </li>
            </ul>
          </div>

          {/* Partners */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Partners</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Amazon
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Figma
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Twitter
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  CloudRail-IIOT
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Resources</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Academy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Themes
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Hosting
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Developers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Teams
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Thin Divider Line */}
        <div className="border-t border-slate-800/80 mb-8"></div>

        {/* Copyright and Social Icons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2024 All Rights Reserved</p>

          <div className="flex items-center gap-3">
            {/* Facebook */}
            <a
              href="#"
              aria-label="Facebook"
              className="w-7 h-7 rounded-full bg-white text-slate-950 flex items-center justify-center hover:opacity-85 transition-opacity"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>

            {/* Telegram */}
            <a
              href="#"
              aria-label="Telegram"
              className="w-7 h-7 rounded-full bg-white text-slate-950 flex items-center justify-center hover:opacity-85 transition-opacity"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="#"
              aria-label="Instagram"
              className="w-7 h-7 rounded-full bg-white text-slate-950 flex items-center justify-center hover:opacity-85 transition-opacity"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>

            {/* ProductHunt / Figma */}
            <a
              href="#"
              aria-label="ProductHunt"
              className="w-7 h-7 rounded-full bg-white text-slate-950 flex items-center justify-center hover:opacity-85 transition-opacity"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M13.6 8.4h-3.4v4.4h3.4c1.2 0 2.2-1 2.2-2.2s-1-2.2-2.2-2.2zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1.6 13.2h-3.4v3.2H7.8V6h5.8c2.5 0 4.6 2.1 4.6 4.6 0 2.5-2.1 4.6-4.6 4.6z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
