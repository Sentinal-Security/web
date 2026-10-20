"use client";

import React from "react";
import Link from "next/link";
import Header from "@/app/partials/header";
import Footer from "@/app/partials/footer";

export default function ServicesPage() {
  const demoApps = [
    {
      id: "acme-hr",
      name: "Acme HR Portal",
      category: "Human Resources & Payroll",
      port: 3001,
      url: "https://demo-apps-blue.vercel.app",
      protocol: "OAUTH2_OIDC",
      description: "Employee directory, compensation history, and benefits enrollment with single sign-on verification.",
      status: "Production Cloud Live",
    },
    {
      id: "fintech-payroll",
      name: "FinTech Payroll Portal",
      category: "Corporate Finance",
      port: 3002,
      url: "https://demo-apps-sfjl.vercel.app",
      protocol: "REST_BEARER",
      description: "High-security financial ledger and executive disbursements protected by mandatory dual-factor validation.",
      status: "Production Cloud Live",
    },
    {
      id: "devops-incident",
      name: "DevOps Incident Command",
      category: "Infrastructure Operations",
      port: 3003,
      url: "https://demo-apps-fjk5.vercel.app",
      protocol: "SAML_SSO",
      description: "Mission-critical site reliability management, real-time alert triage, and server infrastructure access.",
      status: "Production Cloud Live",
    },
  ];

  const protocols = [
    {
      name: "OAuth 2.0 / OpenID Connect (OIDC)",
      tag: "RFC 6749",
      description: "Modern web and mobile authorization framework with signed JWTs and identity claims.",
      idealFor: "Single-page apps, mobile clients, Next.js / React frontends",
    },
    {
      name: "SAML 2.0 Web SSO",
      tag: "OASIS Standard",
      description: "XML-based assertion exchange for legacy enterprise federation and IdP-initiated sessions.",
      idealFor: "Enterprise ERPs, internal corporate portals, legacy identity hubs",
    },
    {
      name: "REST API Bearer Token Gateway",
      tag: "RFC 6750",
      description: "Stateless microservice authorization via POST /api/auth/validate and ssoUserId handoff.",
      idealFor: "Node.js, Spring Boot, Python FastAPI, and Go backend microservices",
    },
    {
      name: "Event Webhooks & Audit Streams",
      tag: "JSON Over HTTPS",
      description: "Real-time dispatch of authentication events, push challenge responses, and audit records.",
      idealFor: "Security Information & Event Management (SIEM), automated revoking",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050811] text-white selection:bg-cyan-500/30 selection:text-white font-sans antialiased overflow-x-hidden">
      <Header />

      <main className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 pt-16 pb-24">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4">
            Identity Federation Catalog
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            Connected Enterprise Application Services
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed">
            Sentinel Security provides automated Single Sign-On (SSO) handoff, token validation, and multi-factor enforcement for internal enterprise applications.
          </p>
        </div>

        {/* Section 1: Demonstration Client Applications */}
        <div className="mb-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Active Evaluation Applications</h2>
              <p className="text-xs text-slate-400 mt-1">
                Local SSO client applications configured for coursework demonstration.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors shrink-0"
            >
              Open User Dashboard
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {demoApps.map((app) => (
              <div
                key={app.id}
                className="p-6 rounded-2xl bg-slate-900/30 border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
                      Port {app.port}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400 font-mono">
                      {app.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight">{app.name}</h3>
                  <p className="text-xs text-cyan-400 font-mono mt-0.5">{app.category}</p>
                  <p className="text-xs text-slate-400 mt-3 leading-relaxed mb-6">
                    {app.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-white hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Launch Client</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </a>
                  <span className="text-[11px] text-slate-500 font-mono">{app.protocol}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Supported Auth Protocols */}
        <div className="mb-20">
          <div className="max-w-xl mb-8">
            <h2 className="text-xl font-bold text-white tracking-tight">Enterprise Authentication Protocols</h2>
            <p className="text-xs text-slate-400 mt-1">
              Connect external services using industry-standard federation standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {protocols.map((proto, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/20 border border-white/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-white">{proto.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300">
                      {proto.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {proto.description}
                  </p>
                </div>
                <div className="text-[11px] text-slate-400 pt-3 border-t border-white/5">
                  <span className="font-medium text-slate-300">Target Environment:</span> {proto.idealFor}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Quickstart Strip */}
        <div className="rounded-2xl bg-slate-900/50 border border-white/10 p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Need to integrate a new application?</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-lg">
              Explore code samples for TypeScript, Python, cURL, and Go to validate tokens with the Sentinel Spring Boot API Gateway.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/docs"
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Developer Integration Guide
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
