"use client";

import React, { useState } from "react";
import Link from "next/link";

interface StepData {
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  codeSnippets: {
    ts: string;
    curl: string;
    py: string;
  };
  endpoint: string;
  benefit: string;
}

const STEPS: StepData[] = [
  {
    title: "1. Initiate SSO Handoff",
    badge: "FRONTEND / REDIRECT",
    subtitle: "Direct user to Sentinel IAM with your Client ID and Callback URL",
    description:
      "Client applications do not need login forms or credential storage. When a user requests access, redirect them to the Sentinel Central Gateway. Sentinel handles authentication, password hashing (BCrypt), and session tokens.",
    endpoint: "GET /api/auth/login?client_id={clientId}&redirect_uri={redirectUri}",
    benefit: "Zero credential liability: your database never touches or stores employee passwords.",
    codeSnippets: {
      ts: `// Initiate SSO sign-in from your company application
const clientId = "acme_hr";
const redirectUri = encodeURIComponent("https://hr.company.internal/callback");
const appName = encodeURIComponent("Acme HR Portal");

// Redirect browser to Sentinel Gateway
window.location.href = 
  \`https://backend-pi68.onrender.com/login?client_id=\${clientId}&redirect_uri=\${redirectUri}&app_name=\${appName}\`;`,
      curl: `# Test the central authentication endpoint
curl -X POST https://backend-pi68.onrender.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "employee@company.internal",
    "password": "SecurePassword123"
  }'`,
      py: `# Python (FastAPI / Django) SSO Redirect Generator
from urllib.parse import urlencode

def get_sentinel_login_url(client_id: str, callback_url: str, app_name: str) -> str:
    params = urlencode({
        "client_id": client_id,
        "redirect_uri": callback_url,
        "app_name": app_name
    })
    return f"https://backend-pi68.onrender.com/login?{params}"`,
    },
  },
  {
    title: "2. Dual-Choice MFA Challenge",
    badge: "POSSESSION FACTOR",
    subtitle: "Real-time push approval with number matching or manual TOTP",
    description:
      "When MFA is enabled, Sentinel pauses access and presents two options: an in-app push approval matching a 2-digit number (e.g. [ 42 ]) to eliminate push fatigue, or an RFC 6238 6-digit TOTP code from the mobile authenticator.",
    endpoint: "POST /api/mfa/challenge/initiate & POST /api/mfa/challenge/respond",
    benefit: "Guards against session hijacking and credential stuffing with hardware-bound possession.",
    codeSnippets: {
      ts: `// Polling push challenge resolution status on client
const pollChallenge = async (challengeId: number) => {
  const res = await fetch(
    \`https://backend-pi68.onrender.com/api/mfa/challenge/\${challengeId}/status\`
  );
  const data = await res.json();
  if (data.success && data.data?.status === "APPROVED") {
    // Challenge approved by mobile device! Ingest ssoToken
    return data.data.ssoToken;
  }
};`,
      curl: `# Query active pending challenges for an enrolled account
curl -X GET "https://backend-pi68.onrender.com/api/mfa/challenge/pending?email=employee@company.internal" \\
  -H "Accept: application/json"

# Respond to challenge from mobile authenticator
curl -X POST https://backend-pi68.onrender.com/api/mfa/challenge/respond \\
  -H "Content-Type: application/json" \\
  -d '{
    "challengeId": 128,
    "action": "APPROVE",
    "selectedCode": "42"
  }'`,
      py: `# Python server-side MFA verification check
import requests

def check_mfa_status(challenge_id: int):
    url = f"https://backend-pi68.onrender.com/api/mfa/challenge/{challenge_id}/status"
    resp = requests.get(url, timeout=4)
    data = resp.json()
    return data.get("data", {}).get("status") == "APPROVED"`,
    },
  },
  {
    title: "3. JIT Provisioning & Validation",
    badge: "BACKEND API VALIDATION",
    subtitle: "Validate session token and auto-create local user profile",
    description:
      "Upon successful login, Sentinel redirects back to your redirect_uri with ssoUserId and ssoToken. Your client app validates the token with Sentinel via POST /api/auth/validate and provisions the employee profile Just-In-Time.",
    endpoint: "POST /api/auth/validate",
    benefit: "No manual employee directory sync required; profiles auto-provision seamlessly on first sign-in.",
    codeSnippets: {
      ts: `// Ingest SSO callback parameters and validate session
const params = new URLSearchParams(window.location.search);
const ssoUserId = params.get("ssoUserId");
const ssoToken = params.get("ssoToken");

if (ssoUserId) {
  const res = await fetch("https://backend-pi68.onrender.com/api/auth/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: Number(ssoUserId), ssoToken }),
  });
  const session = await res.json();
  // Provision user: { userId: 1, email: "...", fullName: "...", role: "USER" }
}`,
      curl: `# Validate incoming SSO session on company backend
curl -X POST https://backend-pi68.onrender.com/api/auth/validate \\
  -H "Content-Type: application/json" \\
  -d '{
    "userId": 1,
    "ssoToken": "sso_a94f83b1"
  }'`,
      py: `# Python (FastAPI) Session Validation Dependency
from fastapi import FastAPI, HTTPException, Depends
import requests

def get_current_sentinel_user(user_id: int):
    res = requests.post(
        "https://backend-pi68.onrender.com/api/auth/validate",
        json={"userId": user_id},
        timeout=5.0
    )
    if res.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    return res.json()`,
    },
  },
];

export default function InteractiveIntegration() {
  const [activeStep, setActiveStep] = useState(0);
  const [codeLang, setCodeLang] = useState<"ts" | "curl" | "py">("ts");
  const [copied, setCopied] = useState(false);

  const current = STEPS[activeStep];
  const activeCode = current.codeSnippets[codeLang];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-20 border-t border-white/5 max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
      {/* Header */}
      <div className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          API-First Architecture
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.15]">
          How Companies Integrate <span className="text-cyan-400">Sentinel IAM</span>
        </h2>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mt-4">
          Enable enterprise-grade identity, single sign-on, and push multi-factor verification for your web and mobile applications with three lightweight endpoints.
        </p>
      </div>

      {/* 3 Step Selector Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        {STEPS.map((step, idx) => {
          const isActive = activeStep === idx;
          return (
            <button
              key={step.title}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                isActive
                  ? "bg-[#0c1424] border-cyan-500/50"
                  : "bg-[#050811] border-white/10 hover:border-white/20 hover:bg-[#070e1c]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                      : "bg-slate-800 text-slate-400 border border-transparent"
                  }`}
                >
                  {step.badge}
                </span>
                <span className="text-xs font-mono text-slate-500">Step 0{idx + 1}</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {step.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-1">{step.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-[#080d1a] border border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10">
        {/* Left Side: Explanatory Context & Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
              Implementation Detail
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
              {current.subtitle}
            </h3>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">{current.description}</p>

          <div className="p-4 rounded-xl bg-[#050811] border border-white/10">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Primary Gateway Route
            </div>
            <div className="text-xs sm:text-sm font-mono text-cyan-300 font-semibold break-all">
              {current.endpoint}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              <strong className="text-white">Security Benefit:</strong> {current.benefit}
            </p>
          </div>

          {/* Quick Action Navigation */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/docs"
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
            >
              Explore Full API Docs
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs rounded-xl border border-slate-700 transition-all"
            >
              Test Sign-In Flow
            </Link>
          </div>
        </div>

        {/* Right Side: Code Snippet Card */}
        <div className="lg:col-span-6 bg-[#050811] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          {/* Code Window Header */}
          <div className="bg-[#080d1a] px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              </div>
              {/* Language Switcher Tabs */}
              <div className="flex items-center bg-black/60 p-0.5 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setCodeLang("ts")}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                    codeLang === "ts" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-white"
                  }`}
                >
                  TypeScript
                </button>
                <button
                  type="button"
                  onClick={() => setCodeLang("curl")}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                    codeLang === "curl" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-white"
                  }`}
                >
                  cURL
                </button>
                <button
                  type="button"
                  onClick={() => setCodeLang("py")}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                    codeLang === "py" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Python
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 px-2.5 py-1 rounded border border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer"
            >
              {copied ? "Copied" : "Copy Code"}
            </button>
          </div>

          {/* Code Body */}
          <div className="p-4 sm:p-5 font-mono text-xs leading-relaxed text-slate-200 overflow-x-auto min-h-[220px]">
            <pre className="text-cyan-100">
              <code>{activeCode}</code>
            </pre>
          </div>

          {/* Window Footer Status */}
          <div className="px-4 py-2.5 bg-[#080d1a] border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Gateway: Ready for Integration</span>
            <span className="text-cyan-400">Zero-Trust Validated</span>
          </div>
        </div>
      </div>
    </section>
  );
}
