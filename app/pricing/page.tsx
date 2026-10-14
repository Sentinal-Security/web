"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "@/app/partials/header";
import Footer from "@/app/partials/footer";

export default function PricingPage() {
  const [annualBilling, setAnnualBilling] = useState(true);

  const tiers = [
    {
      name: "Community / Evaluation",
      description: "Designed for coursework evaluation, students, and independent identity testing.",
      price: "$0",
      cadence: "forever free",
      badge: "Coursework Standard",
      highlighted: false,
      ctaLabel: "Deploy Free",
      ctaHref: "/register",
      features: [
        "Up to 5 Connected SSO Applications",
        "RFC 6238 TOTP Multi-Factor Authentication",
        "Supabase PostgreSQL Session Pooler over IPv4",
        "Mobile Authenticator Android APK Access (/dw)",
        "Standard BCrypt Credential Hashing",
        "Public REST API Gateway & Documentation",
      ],
    },
    {
      name: "Professional Team",
      description: "Enterprise access governance and push authorization for engineering teams.",
      price: annualBilling ? "$14" : "$18",
      cadence: "per member / month",
      badge: "Most Popular",
      highlighted: true,
      ctaLabel: "Start Team Trial",
      ctaHref: "/register",
      features: [
        "Unlimited Connected Enterprise SSO Applications",
        "Dual-Factor Push Authorization (2-Digit Match Code)",
        "Central IAM Admin User Roster & Batch Provisioning",
        "Multi-Tenant Workspace & Company Isolation",
        "Render Keep-Alive Inactivity Sleep Mitigation",
        "Dynamic Client Token Handoff & Session Validation",
        "Priority Coursework Demonstration Support",
      ],
    },
    {
      name: "Enterprise Zero-Trust",
      description: "Dedicated infrastructure, custom protocol mapping, and compliance controls.",
      price: annualBilling ? "$69" : "$79",
      cadence: "per tenant / month",
      badge: "Maximum Security",
      highlighted: false,
      ctaLabel: "Explore Enterprise",
      ctaHref: "/docs",
      features: [
        "Dedicated Supabase PostgreSQL Connection Pooler",
        "Custom OAuth 2.0, SAML 2.0 & Webhook Integration",
        "Custom Match Code Algorithm & Expiry Policies",
        "Role-Based Access Control (RBAC) Hierarchy",
        "99.95% API Availability Guarantee",
        "Full Audit Log Export to SIEM (JSON / CSV)",
        "Direct IAM Technical Engineering Guidance",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#050811] text-white selection:bg-cyan-500/30 selection:text-white font-sans antialiased overflow-x-hidden">
      <Header />

      <main className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 pt-16 pb-24">
        {/* Page Title & Subtitle */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4">
            Predictable Enterprise Access Pricing
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            Transparent Plans for Every Identity Milestone
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed">
            From coursework simulation and evaluation to enterprise multi-tenant access governance. Complete MFA, SSO federation, and database encryption included.
          </p>

          {/* Billing Toggle Switch */}
          <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-xl bg-slate-900 border border-white/10">
            <button
              type="button"
              onClick={() => setAnnualBilling(false)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                !annualBilling ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setAnnualBilling(true)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                annualBilling ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950/40 text-slate-950 font-mono font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch mb-20">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`relative rounded-2xl flex flex-col justify-between p-6 sm:p-8 transition-all ${
                tier.highlighted
                  ? "bg-slate-900/60 border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/10"
                  : "bg-slate-900/30 border border-white/10 hover:border-white/20"
              }`}
            >
              {tier.badge && (
                <div
                  className={`inline-block w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 ${
                    tier.highlighted
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-white/5 border border-white/10 text-slate-300"
                  }`}
                >
                  {tier.badge}
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">{tier.name}</h3>
                <p className="text-xs text-slate-400 mt-2 min-h-[36px]">{tier.description}</p>

                <div className="mt-6 mb-6 pb-6 border-b border-white/10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white tracking-tight">{tier.price}</span>
                    <span className="text-xs text-slate-400">{tier.cadence}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Included Features:</p>
                  <ul className="space-y-2.5">
                    {tier.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <svg className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link
                href={tier.ctaHref}
                className={`w-full py-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer block ${
                  tier.highlighted
                    ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                }`}
              >
                {tier.ctaLabel}
              </Link>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="border border-white/10 rounded-2xl bg-slate-900/20 p-6 sm:p-10 mb-16 overflow-x-auto">
          <div className="max-w-xl mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Detailed Capabilities Comparison</h2>
            <p className="text-xs text-slate-400 mt-1">
              Direct breakdown of technical limits and authentication capabilities across Sentinal Security tiers.
            </p>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-semibold">Capability</th>
                <th className="py-3 px-4 font-semibold">Community</th>
                <th className="py-3 px-4 font-semibold text-cyan-300">Professional</th>
                <th className="py-3 px-4 font-semibold">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              <tr>
                <td className="py-3 px-4 font-medium text-white">Central Identity Storage</td>
                <td className="py-3 px-4 font-mono">Supabase PostgreSQL</td>
                <td className="py-3 px-4 font-mono">Supabase PostgreSQL</td>
                <td className="py-3 px-4 font-mono">Dedicated Supabase Cluster</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">Password Cryptography</td>
                <td className="py-3 px-4 font-mono">BCrypt (Cost 10)</td>
                <td className="py-3 px-4 font-mono">BCrypt (Cost 12)</td>
                <td className="py-3 px-4 font-mono">BCrypt + Argon2id Support</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">MFA Engine (TOTP)</td>
                <td className="py-3 px-4 text-emerald-400">Included (RFC 6238)</td>
                <td className="py-3 px-4 text-emerald-400">Included (RFC 6238)</td>
                <td className="py-3 px-4 text-emerald-400">Included (RFC 6238)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">Out-of-band Push Challenge</td>
                <td className="py-3 px-4 text-slate-500">Not Included</td>
                <td className="py-3 px-4 text-emerald-400">Included (2-Digit Match)</td>
                <td className="py-3 px-4 text-emerald-400">Included (Biometric Match)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">Max Client SSO Applications</td>
                <td className="py-3 px-4 font-mono">5 Applications</td>
                <td className="py-3 px-4 font-mono">Unlimited</td>
                <td className="py-3 px-4 font-mono">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">Tenant Isolation</td>
                <td className="py-3 px-4 text-slate-500">Shared Workspace</td>
                <td className="py-3 px-4 text-emerald-400">Company Workspace Isolation</td>
                <td className="py-3 px-4 text-emerald-400">Strict Schema Partitioning</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom CTA Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-[#071328] border border-cyan-500/20 p-8 sm:p-12 text-center max-w-3xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Ready to secure your application ecosystem?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Create an identity in seconds and explore out-of-band push authorization, mobile authenticator pairing, and instant client SSO.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              href="/docs"
              className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs transition-colors"
            >
              Developer Integration API
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
