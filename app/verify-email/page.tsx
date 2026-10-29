"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyEmail, resendVerification } from "@/lib/api";
import Footer from "@/app/partials/footer";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setSuccess(false);
      setMessage("Verification token is missing from the URL. Please verify the link in your email.");
      return;
    }

    let isMounted = true;
    (async () => {
      const res = await verifyEmail(token);
      if (!isMounted) return;
      setLoading(false);
      if (res.success) {
        setSuccess(true);
        setMessage(res.message || "Account activated successfully!");
        if (res.data?.email) {
          setEmail(res.data.email);
        }
      } else {
        setSuccess(false);
        setMessage(res.message || "Invalid or expired activation link.");
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResending(true);
    setResendStatus("");
    const res = await resendVerification(resendEmail.trim());
    setResending(false);
    setResendStatus(res.message || "If an account exists, a fresh activation link was sent.");
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-[#0d1522] border border-slate-800 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.6)] text-center">
      {/* Brand Header */}
      <div className="mb-6">
        <Link href="/" className="inline-block text-xl font-extrabold tracking-wider text-[#3bf0ff]">
          SENTINEL SECURITY
        </Link>
        <p className="text-[11px] uppercase tracking-widest text-slate-500 mt-1">
          IAM Account Verification
        </p>
      </div>

      {loading ? (
        <div className="py-10">
          <svg className="animate-spin h-10 w-10 text-[#3bf0ff] mx-auto mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm text-slate-300 font-medium">Verifying activation token with Central IAM Gateway...</p>
        </div>
      ) : success ? (
        <div>
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5 text-emerald-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Account Activated</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
            {message}
          </p>
          {email && (
            <div className="py-2 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-cyan-300 mb-6">
              {email}
            </div>
          )}
          <Link
            href="/login"
            className="w-full py-3.5 px-4 bg-[#3bf0ff] hover:bg-[#2fe0ef] text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/20 text-center block"
          >
            Proceed to Sign In
          </Link>
        </div>
      ) : (
        <div>
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5 text-red-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Activation Failed</h2>
          <p className="text-xs text-red-300 mb-6 leading-relaxed">
            {message}
          </p>

          {/* Resend activation email section */}
          <div className="border-t border-slate-800 pt-5 mt-5 text-left">
            <h4 className="text-xs font-semibold text-slate-200 mb-1.5">Need a new activation link?</h4>
            <p className="text-[11px] text-slate-400 mb-3">
              Enter your email address to receive fresh verification instructions:
            </p>
            <form onSubmit={handleResend} className="space-y-3">
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={resending}
                className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {resending ? "Sending..." : "Resend Activation Link"}
              </button>
            </form>
            {resendStatus && (
              <p className="text-[11px] text-cyan-300 mt-2 text-center">{resendStatus}</p>
            )}
          </div>

          <div className="mt-6">
            <Link
              href="/login"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col justify-between selection:bg-cyan-400 selection:text-black font-sans antialiased">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Suspense fallback={
          <div className="text-center py-12 text-slate-400 text-xs">
            Loading verification portal...
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
