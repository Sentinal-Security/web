"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function OmniAuthPage() {
  const [env, setEnv] = useState<"live" | "sandbox">("live");
  const [codeLang, setCodeLang] = useState<"curl" | "node" | "python">("curl");
  const [copiedKey, setCopiedKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const activeApiKey =
    env === "live"
      ? "oa_live_948f2c918a004ef1a89b027cd9103e"
      : "oa_test_301b814ef9011a4b889d102ab39811";

  const codeSnippets = {
    curl: `curl -X POST https://auth.sentinel.internal/api/oauth/token \\
  -H "Authorization: Bearer ${activeApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "client_credentials",
    "scope": "openid profile mfa:verify",
    "audience": "https://api.sentinel.internal/v2"
  }'`,
    node: `import { OmniAuthClient } from "@sentinel/omniauth-sdk";

const auth = new OmniAuthClient({
  apiKey: "${activeApiKey}",
  environment: "${env}",
});

const token = await auth.tokens.issue({
  grantType: "client_credentials",
  scopes: ["openid", "profile", "mfa:verify"],
});
console.log("JWT Issued:", token.access_token);`,
    python: `from sentinel_omniauth import OmniAuth

client = OmniAuth(
    api_key="${activeApiKey}",
    environment="${env}"
)

token = client.tokens.create(
    grant_type="client_credentials",
    scopes=["openid", "profile", "mfa:verify"]
)
print("JWT Token:", token.access_token)`,
  };

  const copyKey = () => {
    navigator.clipboard.writeText(activeApiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0d0903] text-slate-200 font-sans antialiased flex flex-col">
      {/* =========================================================
          DISTINCT NAVBAR: Developer Command Bar (Stripe / Auth0 style)
      ========================================================= */}
      <header className="bg-[#150e05] border-b border-amber-950 px-6 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-5">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/logo-omniauth.svg"
              alt="OmniAuth"
              width={28}
              height={28}
              className="w-7 h-7 object-contain"
            />
            <span className="font-bold text-sm tracking-tight text-white">OmniAuth Developer Console</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800/40">
              v2.4 LTS
            </span>
          </div>

          <div className="h-4 w-[1px] bg-amber-900/60 hidden md:block" />

          {/* Environment Switcher Pills */}
          <div className="flex rounded-xl bg-[#221708] p-1 border border-amber-800/40 text-xs">
            <button
              onClick={() => setEnv("live")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                env === "live"
                  ? "bg-amber-500 text-slate-950 font-bold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${env === "live" ? "bg-slate-950" : "bg-emerald-400"}`} />
              <span>Live Prod</span>
            </button>
            <button
              onClick={() => setEnv("sandbox")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                env === "sandbox"
                  ? "bg-amber-500 text-slate-950 font-bold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${env === "sandbox" ? "bg-slate-950" : "bg-amber-400"}`} />
              <span>Sandbox</span>
            </button>
          </div>
        </div>

        {/* Right Section: Docs Search & Back to Portal */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#221708] border border-amber-800/40 text-xs text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Quick Find Docs...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-amber-950/80 text-[10px] font-mono text-amber-300">⌘K</kbd>
          </div>

          <div className="h-4 w-[1px] bg-amber-900/60 hidden sm:block" />

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900/60 text-amber-200 border border-amber-700/40 text-xs font-semibold transition-all"
          >
            <span>Exit to Sentinel IAM</span>
          </Link>
        </div>
      </header>

      {/* =========================================================
          DEVELOPER CONSOLE BODY: Split Grid (Keys on Left, Code Playground on Right)
      ========================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: API Keys & OIDC Clients (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Key Vault Card */}
          <div className="p-6 rounded-2xl bg-[#191107] border border-amber-900/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Active API Credentials</h2>
                <p className="text-xs text-slate-400">
                  Used by backend daemons and microservices for machine-to-machine authentication.
                </p>
              </div>
              <button
                onClick={() => alert("Rotating Key: Old credentials remain valid for 24 hours.")}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
              >
                Rotate Key
              </button>
            </div>

            {/* Key Field Display */}
            <div className="p-3.5 rounded-xl bg-[#0c0803] border border-amber-950 flex items-center justify-between gap-3">
              <div className="font-mono text-xs text-amber-200 truncate">
                {showSecret
                  ? activeApiKey
                  : activeApiKey.slice(0, 12) + "•".repeat(24) + activeApiKey.slice(-4)}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
                  title={showSecret ? "Hide key" : "Reveal key"}
                >
                  {showSecret ? "Hide" : "Show"}
                </button>
                <button
                  onClick={copyKey}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all cursor-pointer shadow"
                >
                  {copiedKey ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-amber-950/60">
              <span>Rate limit: <strong>10,000 requests/minute</strong></span>
              <span className="text-emerald-400 font-mono">JWKS Signature: RS256 Valid</span>
            </div>
          </div>

          {/* Registered OAuth2 Clients List */}
          <div className="p-6 rounded-2xl bg-[#191107] border border-amber-900/40 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Registered OAuth2 Applications</h3>

            <div className="space-y-3">
              {[
                {
                  name: "Sentinel Mobile Authenticator Bridge",
                  id: "client_app_0912fa",
                  grants: ["authorization_code", "refresh_token"],
                  redirect: "sentinel://oauth/callback",
                },
                {
                  name: "Kubernetes IAM Ingress Controller",
                  id: "client_app_3391cb",
                  grants: ["client_credentials"],
                  redirect: "https://k8s.sentinel.internal/callback",
                },
                {
                  name: "Audit Log Collector Daemon",
                  id: "client_app_8422aa",
                  grants: ["client_credentials"],
                  redirect: "internal://daemon/collect",
                },
              ].map((app, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#100a04] border border-amber-950 hover:border-amber-800/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white">{app.name}</span>
                    <span className="font-mono text-[10px] text-amber-300">{app.id}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    Redirect URI: <span className="text-slate-300">{app.redirect}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Code & Token Playground (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-[#171006] border border-amber-900/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                API Quickstart Playground
              </span>

              {/* Language Selector */}
              <div className="flex rounded-lg bg-[#0e0903] p-1 border border-amber-950 text-xs">
                {(["curl", "node", "python"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setCodeLang(lang)}
                    className={`px-2 py-0.5 rounded capitalize text-[11px] font-mono transition-all cursor-pointer ${
                      codeLang === lang
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Box */}
            <div className="p-4 rounded-xl bg-[#090602] border border-amber-950 font-mono text-[11px] text-amber-200 overflow-x-auto leading-relaxed">
              <pre>{codeSnippets[codeLang]}</pre>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/30 text-[11px] text-amber-300 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>JWT tokens expire in 3600 seconds and include standard RFC 7519 claims.</span>
            </div>
          </div>

          {/* Token Claims Inspector */}
          <div className="p-5 rounded-2xl bg-[#171006] border border-amber-900/40 shadow-xl space-y-2">
            <div className="text-xs font-bold text-white">Live JWT Token Header & Payload (Decoded)</div>
            <div className="p-3 rounded-xl bg-[#090602] border border-amber-950 font-mono text-[11px] text-slate-300 space-y-1">
              <div><span className="text-amber-400">&quot;iss&quot;:</span> &quot;https://auth.sentinel.internal&quot;</div>
              <div><span className="text-amber-400">&quot;sub&quot;:</span> &quot;nadia@sentinel.internal&quot;</div>
              <div><span className="text-amber-400">&quot;aud&quot;:</span> &quot;https://api.sentinel.internal&quot;</div>
              <div><span className="text-amber-400">&quot;scope&quot;:</span> &quot;openid profile mfa:verify&quot;</div>
              <div><span className="text-amber-400">&quot;mfa_verified&quot;:</span> <span className="text-emerald-400">true</span></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
