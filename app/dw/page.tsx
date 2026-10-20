"use client";

import Link from "next/link";
import Footer from "@/app/partials/footer";

export default function DownloadsPage() {
  const apkFileName = "sentinal-authenticator-arm64.apk";
  const downloadUrl = `/builds/${apkFileName}`;
  const fileSize = "42.1 MB";
  const version = "1.0.0";
  const buildDate = "September 19, 2026";
  const architecture = "ARM64-v8a (Android 10+)";

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col justify-between selection:bg-cyan-400 selection:text-black font-sans antialiased relative overflow-hidden">
      {/* Background ambient glowing blue aura */}
      <div
        className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none rounded-full blur-[150px] opacity-60"
        style={{
          background:
            "radial-gradient(circle, rgba(21, 93, 252, 0.7) 0%, rgba(13, 53, 150, 0.4) 50%, rgba(5, 20, 66, 0) 80%)",
        }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-[550px] h-[400px] pointer-events-none rounded-full blur-[140px] opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(14, 165, 233, 0.5) 0%, rgba(10, 60, 160, 0.2) 60%, transparent 80%)",
        }}
      />

      {/* Top Header Navigation */}
      <header className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 pt-8 pb-6 flex items-center justify-between relative z-10">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-[#38e1ff] hover:opacity-90 transition-opacity flex items-center gap-2.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Sentinel Logo" className="w-8 h-8 rounded-lg object-contain" />
          <span>Sentinel</span>
        </Link>

        <nav className="flex items-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-300 font-medium">
          <Link href="/pricing" className="hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/features" className="hover:text-white transition-colors">
            Features
          </Link>
          <Link href="/docs" className="hover:text-white transition-colors">
            API &amp; Docs
          </Link>
          <Link href="/dashboard" className="hover:text-white transition-colors hidden sm:inline-block">
            Dashboard
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-semibold text-xs border border-slate-700 transition-all"
          >
            Sign In
          </Link>
        </nav>
      </header>

      {/* Main Content Showcase */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 sm:px-10 py-10 sm:py-16 relative z-10">
        {/* Badge & Headline */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Official Android Release v{version}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
            Sentinel Mobile <span className="text-[#38e1ff]">Authenticator</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 mt-4 max-w-2xl mx-auto leading-relaxed">
            Enterprise out-of-band possession factor verification and RFC 6238 TOTP authentication engine.
            Seamlessly approves two-factor logins with number-matching push challenges and biometric device protection.
          </p>
        </div>

        {/* Primary Download Card */}
        <div className="w-full max-w-3xl mx-auto rounded-3xl bg-[#0c1424]/90 border border-cyan-500/20 p-8 sm:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden mb-16">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            {/* App Icon with Glow */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-slate-950 border border-cyan-500/40 p-3 shadow-[0_0_30px_rgba(56,225,255,0.25)] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-glow.png"
                  alt="Sentinel Authenticator Icon"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Build Details & Direct Download */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Sentinel Authenticator for Android
                </h2>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Release APK
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 font-mono mb-5">
                {apkFileName}
              </p>

              {/* Specs Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">File Size</div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-200 mt-0.5">{fileSize}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Architecture</div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-200 mt-0.5">arm64-v8a</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Target OS</div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-200 mt-0.5">Android 10+</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Security</div>
                  <div className="text-xs sm:text-sm font-semibold text-cyan-400 mt-0.5">FCM + TOTP</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <a
                  href={downloadUrl}
                  download={apkFileName}
                  className="w-full sm:w-auto px-8 py-4 bg-[#38e1ff] hover:bg-[#2bc4e0] active:scale-[0.99] text-slate-950 font-bold text-sm tracking-wider uppercase rounded-xl transition-all shadow-[0_0_25px_rgba(56,225,255,0.35)] cursor-pointer flex items-center justify-center gap-2.5"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span>Download Android APK</span>
                </a>

                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-6 py-4 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white font-medium text-xs tracking-wide rounded-xl border border-slate-700 transition-all text-center"
                >
                  Open Web Dashboard
                </Link>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 text-[11px] text-slate-400">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span>Direct compilation artifact verified &bull; Updated {buildDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step-by-Step Installation Walkthrough */}
        <div className="mb-16">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Three Steps to Device Enrollment
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Follow these simple steps to install and pair your Android device with the Sentinel IAM Portal:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#0c1424]/60 border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold text-sm flex items-center justify-center mb-4">
                  01
                </div>
                <h4 className="text-base font-bold text-white tracking-tight mb-2">
                  Download the Package
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click the download button above to save the 42 MB <code className="text-cyan-300 font-mono">.apk</code> installation bundle to your Android device or testing emulator.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                Direct HTTPS Download
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#0c1424]/60 border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold text-sm flex items-center justify-center mb-4">
                  02
                </div>
                <h4 className="text-base font-bold text-white tracking-tight mb-2">
                  Permit APK Installation
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Open the APK from your browser downloads. When prompted by Android system package installer, toggle &quot;Allow from this source&quot; to complete installation.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                Requires Android 10 or Higher
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#0c1424]/60 border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold text-sm flex items-center justify-center mb-4">
                  03
                </div>
                <h4 className="text-base font-bold text-white tracking-tight mb-2">
                  Scan &amp; Pair Account
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Launch the app, open your Sentinel Web Dashboard, click &quot;Pair Mobile 2FA&quot;, and scan the QR code to activate out-of-band push verification.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                Instant Zero-Trust Enrollment
              </div>
            </div>
          </div>
        </div>

        {/* Security Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 text-left">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h5 className="text-sm font-bold text-white">Biometric Lock</h5>
            <p className="text-xs text-slate-400 mt-1">Requires fingerprint or screen PIN before approving incoming challenge requests.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 text-left">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h5 className="text-sm font-bold text-white">Number Matching</h5>
            <p className="text-xs text-slate-400 mt-1">Eliminates MFA fatigue attacks by requiring confirmation of the 2-digit browser number.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 text-left">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h5 className="text-sm font-bold text-white">Offline RFC 6238</h5>
            <p className="text-xs text-slate-400 mt-1">Generates standard time-based TOTP codes locally without requiring active network connectivity.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 text-left">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <h5 className="text-sm font-bold text-white">Replay Protection</h5>
            <p className="text-xs text-slate-400 mt-1">Spring Boot gateway invalidates each 30-second time-step window immediately upon single use.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
