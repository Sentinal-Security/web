"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/api";
import Footer from "@/app/partials/footer";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?`~]/.test(password);
  const hasLength = password.length >= 8;
  const isComplex = hasUpper && hasLower && hasDigit && hasSpecial && hasLength;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!token) {
      setErrorMessage("Reset token is missing from the URL. Please verify your email link.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your new password.");
      return;
    }
    if (!isComplex) {
      setErrorMessage("Password must satisfy all complexity requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(token, password);
      setLoading(false);
      if (res.success) {
        setSuccess(true);
      } else {
        setErrorMessage(res.message || "Failed to reset password. Link may be expired.");
      }
    } catch {
      setLoading(false);
      setErrorMessage("Network error connecting to Sentinel Security Gateway.");
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5 text-red-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Invalid Reset Link</h2>
        <p className="text-xs text-slate-300 leading-relaxed mb-6">
          No security token was detected in your reset link. Please check your email or request a new password reset.
        </p>
        <Link
          href="/forgot-password"
          className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors inline-block text-center"
        >
          Request New Reset Link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5 text-emerald-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Password Updated</h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
          Your password has been successfully reset. All prior active sessions have been terminated. You may now log in with your new credentials.
        </p>
        <Link
          href="/login"
          className="w-full py-3.5 px-4 bg-[#3bf0ff] hover:bg-[#2fe0ef] text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/20 text-center block"
        >
          Proceed to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white">Create New Password</h2>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          Specify a strong password satisfying enterprise complexity policies.
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
            New Password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </div>

        {/* Password Complexity Checklist */}
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5 text-[11px]">
          <div className={`flex items-center gap-2 ${hasLength ? "text-emerald-400" : "text-slate-500"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>Minimum 8 characters</span>
          </div>
          <div className={`flex items-center gap-2 ${hasUpper ? "text-emerald-400" : "text-slate-500"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>At least one uppercase letter (A-Z)</span>
          </div>
          <div className={`flex items-center gap-2 ${hasLower ? "text-emerald-400" : "text-slate-500"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>At least one lowercase letter (a-z)</span>
          </div>
          <div className={`flex items-center gap-2 ${hasDigit ? "text-emerald-400" : "text-slate-500"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>At least one numeric digit (0-9)</span>
          </div>
          <div className={`flex items-center gap-2 ${hasSpecial ? "text-emerald-400" : "text-slate-500"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>At least one special character (!@#$%^&*)</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Confirm New Password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !isComplex}
          className="w-full py-3.5 px-4 bg-[#3bf0ff] hover:bg-[#2fe0ef] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-slate-950" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Updating password...</span>
            </>
          ) : (
            <span>Update Password</span>
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
  );
}

export default function ResetPasswordPage() {
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
              Credential Reset
            </p>
          </div>

          <Suspense fallback={
            <div className="text-center py-12 text-slate-400 text-xs">
              Loading credential reset form...
            </div>
          }>
            <ResetPasswordContent />
          </Suspense>
        </div>
      </div>
      <Footer />
    </div>
  );
}
