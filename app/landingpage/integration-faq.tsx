"use client";

import React, { useState } from "react";
import Link from "next/link";

interface FaqItem {
  question: string;
  category: string;
  answer: string;
  linkText?: string;
  linkHref?: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    category: "Architecture & Integration",
    question: "How do external web and mobile applications integrate with Sentinel?",
    answer:
      "Client applications integrate via standard HTTP REST endpoints. When a user wishes to sign in, the application redirects to Sentinel with client_id and redirect_uri. Once authenticated, Sentinel redirects back with an ssoUserId and ssoToken. The application validates this session with POST /api/auth/validate to ingest the user profile.",
    linkText: "Read Developer Docs",
    linkHref: "/docs",
  },
  {
    category: "Security & Credential Management",
    question: "Do client applications need to store passwords or manage 2FA keys?",
    answer:
      "No. Sentinel acts as the centralized Identity Provider (IdP). All credentials are protected using salted BCrypt hashing and stored in Supabase PostgreSQL over encrypted JDBC. Client applications never see, store, or manage employee passwords or secret keys.",
  },
  {
    category: "User Provisioning",
    question: "How does Just-In-Time (JIT) provisioning work?",
    answer:
      "When a user signs in to a connected application for the first time, Sentinel passes their verified identity attributes (email, full name, role, organization) to the client application. The client application automatically upserts and creates the user profile in its local state without requiring manual provisioning or administrative pre-registration.",
  },
  {
    category: "Multi-Factor Authentication",
    question: "What MFA options are available for enterprise employees?",
    answer:
      "Sentinel provides dual-choice verification: (1) Push Notification / Number Matching on the Sentinel Authenticator mobile app to stop push fatigue attacks, and (2) RFC 6238 standard 6-digit TOTP passcodes generated every 30 seconds. Users can switch between methods with a single click.",
    linkText: "Get Android Authenticator App",
    linkHref: "/download",
  },
  {
    category: "Access Policy Enforcement",
    question: "Can companies enforce mandatory MFA for specific high-privilege applications?",
    answer:
      "Yes. During service registration or policy configuration, administrators can mark an application as requiring step-up MFA (mfaRequired: true). Sentinel automatically enforces possession-factor verification before issuing the SSO handoff token.",
  },
  {
    category: "Testing & Sandbox",
    question: "How can developers test the integration locally or in staging?",
    answer:
      "You can test the entire workflow using our pre-configured demo clients (Acme HR Portal, FinTech Payroll, and DevOps Incident Desk) or use cURL, TypeScript, Python, or Go code snippets available in our developer documentation.",
    linkText: "View Code Snippets & Spec",
    linkHref: "/docs#client-sdk-code",
  },
];

export default function IntegrationFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-20 border-t border-white/5 max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Heading & Contact Note */}
        <div className="lg:col-span-4 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
            Company API & Integration <span className="text-cyan-400">FAQ</span>
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Everything your engineering and security team needs to know about integrating Sentinel into your enterprise infrastructure.
          </p>

          <div className="p-5 rounded-2xl bg-[#080d1a] border border-white/10 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Have a Custom Integration Need?
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore our REST API endpoints or launch a live simulation using our pre-configured connected apps.
            </p>
            <div className="pt-1">
              <Link
                href="/docs"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline"
              >
                <span>Read technical documentation</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Clickable Accordion Items */}
        <div className="lg:col-span-8 space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={item.question}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "bg-[#0c1424] border-cyan-500/40"
                    : "bg-[#080d1a] border-white/10 hover:border-white/20"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 cursor-pointer"
                >
                  <div>
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-cyan-400 mb-1 block">
                      {item.category}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      {item.question}
                    </h3>
                  </div>

                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-transform ${
                      isOpen
                        ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 rotate-180"
                        : "bg-white/5 text-slate-400 border-white/10"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 border-t border-white/5 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3">
                    <p className="mt-3">{item.answer}</p>
                    {item.linkText && item.linkHref && (
                      <div>
                        <Link
                          href={item.linkHref}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:underline"
                        >
                          <span>{item.linkText}</span>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
