"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/api";
import Footer from "@/app/partials/footer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      setLoading(false);
      if (res.success) {
        setSubmitted(true);
      } else {
        setErrorMessage(res.message || "Failed to dispatch password reset request.");
      }
    } catch {
      setLoading(false);
      setErrorMessage("Network error connecting to Sentinel Security Gateway.");
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col justify-between selection:bg-cyan-400 selection:text-black font-sans antialiased">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-[#0d1522] border border-slate-800 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.6)]">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-block text-xl font-extrabold tracking-wider text-[#3bf0ff]">
              SENTINEL SECURITY
            </Link>
            <p className="text-[11px] uppercase tracking-widest text-slate-500 mt-1">
              Account Recovery
            </p>
          </div>

          {submitted ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-5 text-cyan-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check Your Inbox</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                If an account exists for this email address, a password reset link has been dispatched via Google SMTP:
              </p>
              <div className="py-2.5 px-4 bg-slate-900 border border-slate-700 rounded-xl font-mono text-cyan-300 text-xs font-semibold mb-6 break-all">
                {email}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                The reset link is valid for 30 minutes. Please check your spam or promotions folder if the email does not appear in your inbox.
              </p>
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="w-full py-3.5 px-4 bg-[#3bf0ff] hover:bg-[#2fe0ef] text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/20 text-center block"
                >
                  Return to Sign In
                </Link>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="w-full py-2.5 px-4 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Request another link
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white">Forgot Password</h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Enter your registered account email and we will send you a secure link to reset your password.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Account Email Address
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

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
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <span>Send Password Reset Link</span>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
