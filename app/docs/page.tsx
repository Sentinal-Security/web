"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "@/app/partials/header";
import Footer from "@/app/partials/footer";

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<"ts" | "curl" | "py" | "go">("ts");
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const snippets = {
    ts: `// 1. Ingest SSO query parameter on client application mount
import { useEffect, useState } from "react";

export function useSentinelSso() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ssoUserId = params.get("ssoUserId") || localStorage.getItem("sentinel_sso_userId");

    if (!ssoUserId) {
      setLoading(false);
      return;
    }

    // 2. Validate session against Sentinel Central IAM Gateway
    fetch("https://backend-pi68.onrender.com/api/auth/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: Number(ssoUserId) }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setSession(res);
          localStorage.setItem("sentinel_sso_userId", ssoUserId);
          // 3. Clean query parameter from browser address bar
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          localStorage.removeItem("sentinel_sso_userId");
        }
      })
      .catch(() => localStorage.removeItem("sentinel_sso_userId"))
      .finally(() => setLoading(false));
  }, []);

  return { session, loading };
}`,
    curl: `# Validate active SSO user session with Sentinel Gateway
curl -X POST https://backend-pi68.onrender.com/api/auth/validate \\
  -H "Content-Type: application/json" \\
  -d '{
    "userId": 1
  }'

# Register new enterprise application service
curl -X POST https://backend-pi68.onrender.com/api/services \\
  -H "Content-Type: application/json" \\
  -d '{
    "userId": 1,
    "name": "Acme Internal CRM",
    "category": "Customer Operations",
    "iconType": "custom",
    "authProtocol": "SSO_OAUTH",
    "loginUrl": "https://crm.company.internal",
    "clientId": "crm_prod_client_0912",
    "mfaRequired": true
  }'`,
    py: `# Python (FastAPI / Flask) Session Verification Middleware
import requests
from fastapi import FastAPI, HTTPException, Request

app = FastAPI()
SENTINEL_GATEWAY = "https://backend-pi68.onrender.com"

def verify_sentinel_session(user_id: int):
    response = requests.post(
        f"{SENTINEL_GATEWAY}/api/auth/validate",
        json={"userId": user_id},
        headers={"Content-Type": "application/json"},
        timeout=5.0
    )
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Sentinel SSO Session")
    
    data = response.json()
    if not data.get("success"):
        raise HTTPException(status_code=401, detail="Session verification failed")
    
    return data # Returns userId, email, fullName, role, company

@app.get("/api/dashboard")
def get_dashboard(request: Request, ssoUserId: int):
    user_identity = verify_sentinel_session(ssoUserId)
    return {"status": "authenticated", "user": user_identity}`,
    go: `// Go HTTP Sentinel SSO Verification Handler
package main

import (
	"bytes"
	"encoding/json"
	"net/http"
)

type ValidationRequest struct {
	UserId int \`json:"userId"\`
}

type SentinelIdentity struct {
	Success  bool   \`json:"success"\`
	Message  string \`json:"message"\`
	UserId   int    \`json:"userId"\`
	Email    string \`json:"email"\`
	FullName string \`json:"fullName"\`
	Role     string \`json:"role"\`
}

func ValidateSentinelSession(userId int) (*SentinelIdentity, error) {
	payload, _ := json.Marshal(ValidationRequest{UserId: userId})
	resp, err := http.Post(
		"https://backend-pi68.onrender.com/api/auth/validate",
		"application/json",
		bytes.NewBuffer(payload),
	)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var identity SentinelIdentity
	json.NewDecoder(resp.Body).Decode(&identity)
	return &identity, nil
}`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* 1. Header */}
      <Header />

      <main className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 py-12 md:py-16">
        {/* Breadcrumb & Section Badge */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-6">
          <Link href="/" className="hover:text-cyan-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-cyan-400 font-medium">Developer Documentation</span>
        </div>

        {/* Header Hero */}
        <div className="border-l-2 border-cyan-500/70 pl-6 sm:pl-8 mb-16 relative">
          <div className="absolute top-0 left-0 w-5 h-[2px] bg-cyan-400" />
          <div className="absolute bottom-0 left-0 w-5 h-[2px] bg-cyan-400" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Sentinel Developer & Integration Guide
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.18]">
            Enterprise Application Integration<br />
            <span className="text-cyan-400">& Central Gateway API Specification</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base md:text-lg max-w-3xl mt-4 leading-relaxed">
            Connect any internal web portal, SaaS tool, or cloud infrastructure client to Sentinel Security.
            Enforce unified identity lifecycles, cross-origin Single Sign-On (SSO), and out-of-band Multi-Factor Authentication.
          </p>
        </div>

        {/* Content Grid: Navigation Index + Documentation Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Table of Contents */}
          <aside className="lg:col-span-3 sticky top-28 hidden lg:block bg-[#05080e] border border-white/10 rounded-2xl p-6 text-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Documentation Index
            </h3>
            <nav className="space-y-2">
              <a href="#enterprise-benefits" className="block text-gray-400 hover:text-white transition-colors">
                1. Enterprise Value & Benefits
              </a>
              <a href="#integration-architecture" className="block text-gray-400 hover:text-white transition-colors">
                2. Integration Architecture
              </a>
              <a href="#step-1-registration" className="block text-gray-400 hover:text-white transition-colors">
                3. Step 1: Register Application
              </a>
              <a href="#step-2-handoff" className="block text-gray-400 hover:text-white transition-colors">
                4. Step 2: SSO Parameter Handoff
              </a>
              <a href="#step-3-validation" className="block text-gray-400 hover:text-white transition-colors">
                5. Step 3: Session Validation API
              </a>
              <a href="#step-up-mfa" className="block text-gray-400 hover:text-white transition-colors">
                6. Zero-Trust Step-Up MFA
              </a>
              <a href="#client-sdk-code" className="block text-gray-400 hover:text-white transition-colors">
                7. Client Quickstart Snippets
              </a>
              <a href="#showcase-clients" className="block text-gray-400 hover:text-white transition-colors">
                8. Showcase Client Reference
              </a>
            </nav>

            <div className="pt-4 border-t border-white/10 space-y-2">
              <p className="text-[11px] text-gray-500">Central IAM Gateway Base URL</p>
              <code className="block bg-black px-2.5 py-1.5 rounded border border-white/10 font-mono text-[10px] text-cyan-300 break-all">
                https://backend-pi68.onrender.com
              </code>
            </div>
          </aside>

          {/* Right Main Documentation Body */}
          <div className="lg:col-span-9 space-y-16">
            
            {/* Section 1: Enterprise Value & Benefits */}
            <section id="enterprise-benefits" className="scroll-mt-28 space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <span className="text-cyan-400">01.</span> Enterprise Value & Why Companies Adopt Sentinel
              </h2>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                Organizations running decoupled web portals and SaaS platforms face rampant credential fragmentation,
                heightened phishing vulnerability, and administrative overhead when onboarding and offboarding personnel.
                Sentinel Security provides an authoritative Identity and Access Management tier that unifies all company operations:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="p-6 rounded-2xl bg-[#070b14] border border-white/10 space-y-3">
                  <h4 className="text-base font-bold text-white">Centralized Identity Lifecycle</h4>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                    User creation, password policies, and company bindings occur in a single repository. Terminating a member instantly locks access across all registered enterprise portals.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-[#070b14] border border-white/10 space-y-3">
                  <h4 className="text-base font-bold text-white">Phishing-Resistant MFA Possession Factor</h4>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                    RFC 6238 TOTP algorithms cryptographically bind authentication to paired employee mobile devices, preventing unauthorized access even in the event of leaked credentials.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-[#070b14] border border-white/10 space-y-3">
                  <h4 className="text-base font-bold text-white">Frictionless Cross-Origin SSO</h4>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                    Employees sign in once via the central portal. All downstream applications validate sessions in the background, eliminating password fatigue and fragmented logins.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-[#070b14] border border-white/10 space-y-3">
                  <h4 className="text-base font-bold text-white">Audit & Compliance Readiness</h4>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                    Centralized telemetry records all access timestamps, IP signatures, and MFA verification logs, satisfying SOC 2, ISO 27001, and Zero-Trust regulatory frameworks.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2: Architecture & Authentication Flow */}
            <section id="integration-architecture" className="scroll-mt-28 space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <span className="text-cyan-400">02.</span> Integration Architecture & Lifecycle
              </h2>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                Sentinel uses a lightweight token handoff protocol. External web applications do not store passwords or manage user tables; they delegate identity verification directly to the central gateway:
              </p>

              <div className="bg-[#05080e] border border-white/10 rounded-2xl p-6 overflow-x-auto font-mono text-xs text-gray-300 leading-relaxed">
                <pre>{`[ Sentinel Web IAM Portal ]  (Port 3000)
       │
       │ 1. Admin Registers Application (POST /api/services)
       ▼
[ Central Spring Boot Gateway ] ──► [ Supabase PostgreSQL DB ]
       ▲
       │ 2. User clicks 'Launch' on Dashboard
       │    Redirects to: https://app.corp.com?ssoUserId=1&ssoEmail=user@corp.com
       ▼
[ Client Application (Port 3001/3002/3003) ]
       │
       │ 3. Client ingests ?ssoUserId=1 on load
       │ 4. Executes POST /api/auth/validate with { userId: 1 }
       ▼
[ Central Spring Boot Gateway ]
       │
       │ 5. Returns HTTP 200: { success: true, fullName: "Jane Doe", role: "USER" }
       ▼
[ Client Application Unlocked & Active ]`}</pre>
              </div>
            </section>

            {/* Section 3: Step 1 - Registration */}
            <section id="step-1-registration" className="scroll-mt-28 space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <span className="text-cyan-400">03.</span> Step 1: Registering Your Application
              </h2>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                To connect a web application, register it either via the Sentinel Web Dashboard or programmatically through the REST API.
              </p>

              <div className="p-6 rounded-2xl bg-[#070b14] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded">
                    POST /api/services
                  </span>
                  <span className="text-xs text-gray-400">Content-Type: application/json</span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Request Payload</p>
                  <pre className="bg-black border border-white/10 rounded-xl p-4 text-xs font-mono text-cyan-300 overflow-x-auto">{`{
  "userId": 1,
  "name": "Corporate Payroll Portal",
  "category": "Financial Disbursals",
  "iconType": "custom",
  "authProtocol": "SSO_OAUTH",
  "loginUrl": "https://payroll.company.internal",
  "clientId": "payroll_service_3002",
  "mfaRequired": true
}`}</pre>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Response (HTTP 201 Created)</p>
                  <pre className="bg-black border border-white/10 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto">{`{
  "success": true,
  "message": "Service integrated successfully.",
  "data": {
    "id": 18,
    "name": "Corporate Payroll Portal",
    "category": "Financial Disbursals",
    "status": "Active",
    "mfaRequired": true,
    "loginUrl": "https://payroll.company.internal"
  }
}`}</pre>
                </div>
              </div>
            </section>

            {/* Section 4: Step 2 - Handoff */}
            <section id="step-2-handoff" className="scroll-mt-28 space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <span className="text-cyan-400">04.</span> Step 2: Single Sign-On (SSO) Launch Handoff
              </h2>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                When an authenticated user clicks Launch on their Sentinel Dashboard, the portal opens the registered <code className="text-cyan-300 bg-cyan-950/40 px-1.5 py-0.5 rounded">loginUrl</code> in a new tab, appending the SSO handoff parameters:
              </p>

              <div className="bg-[#05080e] border border-white/10 rounded-xl p-4 font-mono text-xs text-cyan-300 break-all">
                https://payroll.company.internal?ssoUserId=1&ssoEmail=user%40example.com
              </div>

              <p className="text-xs sm:text-sm text-gray-400">
                Your application reads <code className="text-white">ssoUserId</code> on initial page render and immediately executes validation against the central backend.
              </p>
            </section>

            {/* Section 5: Step 3 - Session Validation */}
            <section id="step-3-validation" className="scroll-mt-28 space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <span className="text-cyan-400">05.</span> Step 3: Session Validation API
              </h2>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                To confirm that the incoming user is authorized and retrieve their verified identity, call the validation endpoint:
              </p>

              <div className="p-6 rounded-2xl bg-[#070b14] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded">
                    POST /api/auth/validate
                  </span>
                  <span className="text-xs text-gray-400">Content-Type: application/json</span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Request Payload</p>
                  <pre className="bg-black border border-white/10 rounded-xl p-4 text-xs font-mono text-cyan-300 overflow-x-auto">{`{
  "userId": 1
}`}</pre>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Response (HTTP 200 OK)</p>
                  <pre className="bg-black border border-white/10 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto">{`{
  "success": true,
  "message": "SSO session validated.",
  "userId": 1,
  "email": "user@example.com",
  "fullName": "Jane Doe",
  "role": "USER",
  "company": "Sentinel Corp",
  "mfaEnabled": true
}`}</pre>
                </div>
              </div>
            </section>

            {/* Section 6: Zero-Trust Step-Up MFA */}
            <section id="step-up-mfa" className="scroll-mt-28 space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <span className="text-cyan-400">06.</span> Zero-Trust Step-Up MFA Enforcement
              </h2>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                Sentinel allows administrators to flag sensitive services with <code className="text-cyan-300 bg-cyan-950/40 px-1.5 py-0.5 rounded">mfaRequired: true</code>.
                When configured, the user must provide an active 6-digit TOTP token generated by their paired mobile authenticator before launch authorization is granted:
              </p>

              <div className="p-6 rounded-2xl bg-[#070b14] border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  POST /api/services/{`{id}`}/launch
                </div>
                <pre className="bg-black border border-white/10 rounded-xl p-4 text-xs font-mono text-gray-300 overflow-x-auto">{`// If mfaRequired is true, request must include code:
{
  "userId": 1,
  "code": "849201"
}`}</pre>
                <p className="text-xs text-gray-400">
                  If the code is invalid or missing, the central gateway responds with <code className="text-red-400">HTTP 401 Unauthorized</code> and aborts service handoff.
                </p>
              </div>
            </section>

            {/* Section 7: Interactive Code Quickstart */}
            <section id="client-sdk-code" className="scroll-mt-28 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                  <span className="text-cyan-400">07.</span> Client Implementation Quickstart
                </h2>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>{copiedSnippet ? "Copied to Clipboard" : "Copy Code"}</span>
                </button>
              </div>

              {/* Language Tabs */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("ts")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === "ts"
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-[#05080e] text-slate-400 hover:text-white"
                  }`}
                >
                  TypeScript / React
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("curl")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === "curl"
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-[#05080e] text-slate-400 hover:text-white"
                  }`}
                >
                  cURL CLI
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("py")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === "py"
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-[#05080e] text-slate-400 hover:text-white"
                  }`}
                >
                  Python (FastAPI)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("go")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === "go"
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-[#05080e] text-slate-400 hover:text-white"
                  }`}
                >
                  Go (Golang)
                </button>
              </div>

              {/* Code Display */}
              <div className="relative rounded-2xl bg-[#05080e] border border-white/10 p-6 overflow-hidden">
                <pre className="text-xs font-mono text-cyan-200 overflow-x-auto leading-relaxed">
                  {snippets[activeTab]}
                </pre>
              </div>
            </section>

            {/* Section 8: Showcase Clients Reference */}
            <section id="showcase-clients" className="scroll-mt-28 space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <span className="text-cyan-400">08.</span> Showcase Client Implementations
              </h2>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                Reference implementations for the 3 official demo clients are open-sourced in the Sentinel Security repository:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-[#070b14] border border-blue-500/30 space-y-2">
                  <div className="text-xs font-mono font-bold text-blue-400">Port 3001</div>
                  <h4 className="text-base font-bold text-white">Acme HR Portal</h4>
                  <p className="text-xs text-gray-400">Employee records and HR directory client demonstrating URL parameter ingestion.</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#070b14] border border-pink-500/30 space-y-2">
                  <div className="text-xs font-mono font-bold text-pink-400">Port 3002</div>
                  <h4 className="text-base font-bold text-white">FinTech Payroll</h4>
                  <p className="text-xs text-gray-400">Payroll disbursement client demonstrating step-up MFA and central validation.</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#070b14] border border-emerald-500/30 space-y-2">
                  <div className="text-xs font-mono font-bold text-emerald-400">Port 3003</div>
                  <h4 className="text-base font-bold text-white">DevOps Incident</h4>
                  <p className="text-xs text-gray-400">Production telemetry and uptime monitor client with automatic session recovery.</p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* 9. Footer */}
      <Footer />
    </div>
  );
}
