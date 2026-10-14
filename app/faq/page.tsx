"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "@/app/partials/header";
import Footer from "@/app/partials/footer";

interface FaqItem {
  id: string;
  category: "mfa" | "sso" | "architecture" | "governance";
  question: string;
  answer: string;
}

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState<"all" | "mfa" | "sso" | "architecture" | "governance">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIds, setOpenIds] = useState<string[]>(["faq-1", "faq-2"]);

  const faqs: FaqItem[] = [
    {
      id: "faq-1",
      category: "mfa",
      question: "How does the Dual-Engine MFA verify user identity?",
      answer:
        "Sentinel Security supports two complementary verification paths. When MFA is enabled, primary authentication issues a pending challenge with a 2-digit match code. The user can either tap the matching number in the Mobile Authenticator app (Out-of-band Push), or type the rotating 6-digit TOTP code synchronized to 30-second cycles (RFC 6238 HMAC-SHA1).",
    },
    {
      id: "faq-2",
      category: "mfa",
      question: "What happens if the paired mobile device is offline?",
      answer:
        "The standard RFC 6238 TOTP algorithm generates codes completely offline based on unix epoch time steps and the stored Base32 secret key. If the mobile device lacks internet connectivity, the user simply enters the current 6-digit code into the fallback input on the web login page.",
    },
    {
      id: "faq-3",
      category: "sso",
      question: "How does client Single Sign-On (SSO) handoff work without cookies?",
      answer:
        "When launching a connected service from the Sentinel Dashboard, the portal redirects to the client application with ssoUserId and ssoToken query parameters. The client application backend or client component verifies this token against POST /api/auth/validate on the Spring Boot gateway, returning the authenticated employee profile without requiring passwords again.",
    },
    {
      id: "faq-4",
      category: "sso",
      question: "Can custom internal applications integrate with Sentinel Security?",
      answer:
        "Yes. Any internal application can register via the dashboard Configure Apps modal or POST /api/services. Sentinel supports standard OAuth 2.0 / OIDC redirects, SAML 2.0 Web SSO payloads, and REST API Bearer token validations. Code snippets for TypeScript, cURL, Python, and Go are provided in the Developer Docs.",
    },
    {
      id: "faq-5",
      category: "architecture",
      question: "Why does the backend API experience cold starts during overnight hours?",
      answer:
        "The central backend is hosted on Render's free container tier, which suspends containers after 15 minutes of inactivity. To balance performance and free tier hours, a cron scheduler pings the health endpoint every 14 minutes between 8:00 AM and 11:59 PM Manila time. Outside this period, resuming from cold boot takes approximately 50-60 seconds. The dashboard displays a real-time status banner with a progress timer during wake-up.",
    },
    {
      id: "faq-6",
      category: "architecture",
      question: "Why does Sentinel bypass Supabase PostgREST client libraries?",
      answer:
        "To enforce least privilege and defense-in-depth, all database reads and mutations are routed strictly through the Spring Boot API Gateway using standard PostgreSQL JDBC connections over port 5432. Direct client-side database connections are intentionally prohibited to ensure security policies and password hashing (BCrypt) are enforced server-side.",
    },
    {
      id: "faq-7",
      category: "governance",
      question: "How does company tenant isolation work for multi-tenant organizations?",
      answer:
        "Users belong to isolated company workspaces assigned during registration or admin batch provisioning. Administrators can only view, audit, and provision credentials for members belonging strictly to their assigned company tenant, ensuring full tenant partition integrity.",
    },
    {
      id: "faq-8",
      category: "governance",
      question: "Can account owners change their registered email address?",
      answer:
        "Under Sentinel IAM governance policies, primary login email credentials are locked and governed by the company IT administrator. Users can update their display full name in their profile settings, but credential changes require administrative provisioning.",
    },
  ];

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#050811] text-white selection:bg-cyan-500/30 selection:text-white font-sans antialiased overflow-x-hidden">
      <Header />

      <main className="max-w-[1200px] mx-auto px-6 sm:px-10 lg:px-16 pt-16 pb-24">
        {/* Title & Search Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4">
            Technical Knowledge Base
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            Frequently Asked Questions
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed">
            Everything you need to know about Sentinel Security architecture, RFC 6238 TOTP, push verification, and enterprise SSO integration.
          </p>

          {/* Search Input Bar */}
          <div className="mt-8 relative max-w-md mx-auto">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search IAM questions or keywords..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {[
            { id: "all", label: "All Questions" },
            { id: "mfa", label: "Multi-Factor (2FA)" },
            { id: "sso", label: "SSO & Federation" },
            { id: "architecture", label: "Cloud & Database" },
            { id: "governance", label: "IAM Governance" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-cyan-500 text-slate-950 font-bold"
                  : "bg-slate-900/60 border border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3.5 max-w-3xl mx-auto mb-16">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-900/20 border border-white/10 text-slate-400 text-xs">
              No matching questions found for &ldquo;{searchQuery}&rdquo;. Try another search term or reset filters.
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openIds.includes(faq.id);
              return (
                <div
                  key={faq.id}
                  className="rounded-xl border border-white/10 bg-slate-900/30 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-sm sm:text-base font-semibold text-white tracking-tight">
                      {faq.question}
                    </span>
                    <svg
                      className={`w-4 h-4 text-cyan-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Help & Support CTA */}
        <div
          id="contact"
          className="rounded-2xl bg-slate-900/40 border border-white/10 p-8 text-center max-w-xl mx-auto"
        >
          <h3 className="text-lg font-bold text-white tracking-tight">Still have questions?</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Read the master coursework guide or explore interactive integration code samples in the documentation portal.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href="/docs"
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Open API Docs
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
