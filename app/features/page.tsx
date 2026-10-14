"use client";

import React from "react";
import Link from "next/link";
import Header from "@/app/partials/header";
import Footer from "@/app/partials/footer";

export default function FeaturesPage() {
  const coreFeatures = [
    {
      id: "zero-trust",
      badge: "Possession Factor",
      title: "Dual-Engine Multi-Factor Authentication",
      description:
        "Seamless combination of RFC 6238 Time-based One-Time Password (TOTP) cycles and out-of-band mobile push authorization.",
      bullets: [
        "RFC 6238 TOTP algorithm synchronized to 30-second HMAC-SHA1 cycles",
        "Out-of-band Push Challenges displaying 2-digit random match codes to prevent prompt fatigue",
        "Persistent Base32 secret storage in local mobile AsyncStorage on paired Android devices",
        "QR Code onboarding via standard otpauth:// URI specification",
      ],
      icon: (
        <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      id: "sso-federation",
      badge: "Federation & Access",
      title: "Lightweight SSO Federation Gateway",
      description:
        "Launch connected company applications seamlessly through secure query parameter handoff and server-side token validation.",
      bullets: [
        "Zero-friction SSO handoff via ssoUserId and ssoToken URL parameter contracts",
        "Instant server-side validation via POST /api/auth/validate without prompting for passwords again",
        "Compatible with OAuth 2.0 / OIDC, SAML 2.0, and REST API Bearer token architectures",
        "Just-In-Time (JIT) provisioning for newly federated enterprise users",
      ],
      icon: (
        <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
    {
      id: "tenant-isolation",
      badge: "Enterprise IAM",
      title: "Multi-Tenant Company Workspace Isolation",
      description:
        "Fine-grained tenant boundaries prevent data leakage between organizations while allowing central IT administration.",
      bullets: [
        "Company workspace isolation ensures admins only manage members within their tenant",
        "Batch credential generator provisions temporary passwords for automated onboarding",
        "Exportable employee IAM rosters directly to formatted CSV files",
        "Strict separation of administrative privileges (ADMIN vs USER tiers)",
      ],
      icon: (
        <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      id: "infrastructure",
      badge: "Cloud Reliability",
      title: "Direct JDBC Supabase & Render Architecture",
      description:
        "Engineered for high-assurance coursework evaluation with real PostgreSQL relational backing over standard JDBC.",
      bullets: [
        "Bypasses client-side SDKs and PostgREST to enforce Spring Boot security validation",
        "Active health check query (SELECT 1) measuring real-time database round-trip latency in milliseconds",
        "Render free-tier inactivity sleep mitigation with automated cron keep-alive probes",
        "Real-time cold boot detection and user notification banners in dashboard",
      ],
      icon: (
        <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#050811] text-white selection:bg-cyan-500/30 selection:text-white font-sans antialiased overflow-x-hidden">
      <Header />

      <main className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 pt-16 pb-24">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4">
            Identity &amp; Access Architecture
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            Enterprise Zero-Trust Capabilities Built for Verification
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed">
            Sentinel Security unifies primary authentication, dual-factor possession verification, client SSO federation, and company tenant isolation into an interoperable 3-tier architecture.
          </p>
        </div>

        {/* Core Pillars Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {coreFeatures.map((feat) => (
            <div
              key={feat.id}
              id={feat.id}
              className="p-6 sm:p-8 rounded-2xl bg-slate-900/30 border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center">
                    {feat.icon}
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono font-semibold text-slate-300 uppercase">
                    {feat.badge}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white tracking-tight">{feat.title}</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed mb-6">
                  {feat.description}
                </p>

                <ul className="space-y-2.5 mb-6">
                  {feat.bullets.map((b, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <Link
                  href="/docs"
                  className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1.5 transition-colors"
                >
                  <span>Review API Specifications</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <span className="text-[11px] text-slate-500 font-mono">Live on Render</span>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Architecture Flow Diagram */}
        <div className="rounded-2xl bg-slate-900/40 border border-white/10 p-6 sm:p-10 mb-16">
          <div className="max-w-xl mb-8">
            <h3 className="text-xl font-bold text-white tracking-tight">The 6-Step Zero-Trust Journey</h3>
            <p className="text-xs text-slate-400 mt-1">
              End-to-end evaluation flow executed during student coursework presentation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-white/10">
              <span className="text-cyan-400 font-mono text-xs font-bold">01 / Provisioning</span>
              <h4 className="text-sm font-semibold text-white mt-1">Registration</h4>
              <p className="text-xs text-slate-400 mt-1">
                Identity stored in Supabase with BCrypt salted hash.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-white/10">
              <span className="text-cyan-400 font-mono text-xs font-bold">02 / Pairing</span>
              <h4 className="text-sm font-semibold text-white mt-1">Device Enrolment</h4>
              <p className="text-xs text-slate-400 mt-1">
                Scan QR code on Mobile Authenticator to store Base32 key in AsyncStorage.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-white/10">
              <span className="text-cyan-400 font-mono text-xs font-bold">03 / Gatekeeper</span>
              <h4 className="text-sm font-semibold text-white mt-1">Primary Login</h4>
              <p className="text-xs text-slate-400 mt-1">
                Credentials verified; pending state holds until 2FA confirmation.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-white/10">
              <span className="text-cyan-400 font-mono text-xs font-bold">04 / Push Challenge</span>
              <h4 className="text-sm font-semibold text-white mt-1">Out-of-band Match</h4>
              <p className="text-xs text-slate-400 mt-1">
                Web displays 2-digit match code; mobile app verifies number tap.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-white/10">
              <span className="text-cyan-400 font-mono text-xs font-bold">05 / Resolution</span>
              <h4 className="text-sm font-semibold text-white mt-1">Session Unlock</h4>
              <p className="text-xs text-slate-400 mt-1">
                Backend marks challenge approved; Web Portal unlocks dashboard access.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-white/10">
              <span className="text-cyan-400 font-mono text-xs font-bold">06 / Federation</span>
              <h4 className="text-sm font-semibold text-white mt-1">SSO Launchpad</h4>
              <p className="text-xs text-slate-400 mt-1">
                Launch client apps with instant query parameter token validation.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-xl bg-white/5 border border-white/10 gap-4">
          <div>
            <h4 className="text-sm font-bold text-white">Experience the platform live</h4>
            <p className="text-xs text-slate-400">Create an account or launch integration documentation.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Sign Up Free
            </Link>
            <Link
              href="/docs"
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-xs font-medium transition-colors"
            >
              API Reference
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
