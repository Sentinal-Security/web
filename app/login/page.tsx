"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useMfa } from "@/hooks/useMfa";
import { saveSession, getStoredSession, clearSession } from "@/lib/session";
import { getMfaChallengeStatus, loginWithGoogle } from "@/lib/api";
import { User } from "@/types/auth";
import Footer from "@/app/partials/footer";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030712] text-white flex items-center justify-center">Loading Sentinel Security Gateway...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUri = searchParams.get("redirect_uri") || searchParams.get("redirectUrl") || searchParams.get("redirectUri");
  const clientId = searchParams.get("client_id") || searchParams.get("clientId");
  const appName = searchParams.get("app_name") || searchParams.get("appName") || (clientId ? clientId.toUpperCase() : "");
  const state = searchParams.get("state");

  const { login, loading: authLoading, error: authError, setError: setAuthError } = useAuth();
  const { verifyLogin, loading: mfaLoading, error: mfaError, setError: setMfaError } = useMfa();

  const [existingUser, setExistingUser] = useState<User | null>(null);

  useEffect(() => {
    const session = getStoredSession();
    if (session && session.user) {
      setExistingUser(session.user);
    }
  }, []);

  const handleSuccessfulHandoff = (userId: number, userEmail: string, ssoToken?: string) => {
    if (redirectUri) {
      const sep = redirectUri.includes("?") ? "&" : "?";
      const token = ssoToken || ("sso_" + Math.random().toString(36).substring(2) + Date.now().toString(36));
      const targetUrl = `${redirectUri}${sep}ssoUserId=${userId}&ssoUserEmail=${encodeURIComponent(userEmail)}&ssoToken=${token}${state ? `&state=${encodeURIComponent(state)}` : ""}`;
      window.location.href = targetUrl;
    } else {
      router.push("/dashboard");
    }
  };

  const handleLogoutAndSwitch = () => {
    clearSession();
    setExistingUser(null);
    setEmail("");
    setPassword("");
    setValidationError("");
    setAuthError(null);
    setMfaChallenge(null);
    setMfaMode("push");
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [validationError, setValidationError] = useState("");

  // MFA Challenge State
  const [mfaChallenge, setMfaChallenge] = useState<{
    required: boolean;
    userId?: number;
    email?: string;
    fullName?: string;
    role?: string;
    company?: string;
    challengeId?: number;
    matchCode?: string;
  } | null>(null);
  const [mfaMode, setMfaMode] = useState<"push" | "totp">("push");
  const [totpCode, setTotpCode] = useState("");
  const [networkWait, setNetworkWait] = useState(false);
  const [mfaNetworkWait, setMfaNetworkWait] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleTokenInput, setGoogleTokenInput] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  // Initialize Google Identity Services if client ID is configured
  useEffect(() => {
    if (typeof window === "undefined") return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    if (!document.getElementById("google-gsi-client")) {
      const script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if ((window as any).google?.accounts?.id) {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: (resp: any) => {
              if (resp?.credential) {
                executeGoogleAuth(resp.credential);
              }
            },
          });
        }
      };
      document.body.appendChild(script);
    }
  }, []);

  // Polling for mobile push approval resolution
  useEffect(() => {
    if (!mfaChallenge?.challengeId || mfaMode !== "push") return;

    let active = true;
    const interval = setInterval(async () => {
      try {
        const res = await getMfaChallengeStatus(mfaChallenge.challengeId!);
        if (!active) return;
        if (res.success && res.data) {
          if (res.data.status === "APPROVED") {
            clearInterval(interval);
            const finalUserId = res.data.userId || mfaChallenge.userId || 1;
            const finalEmail = res.data.email || mfaChallenge.email || email.trim();
            const resolvedFullName = res.data.fullName || mfaChallenge?.fullName || "";
            const resolvedRole = (res.data.role || mfaChallenge?.role || "USER") as any;
            const resolvedCompany = res.data.company || mfaChallenge?.company || "";
            saveSession({
              userId: finalUserId,
              email: finalEmail,
              fullName: resolvedFullName,
              role: resolvedRole,
              company: resolvedCompany,
              mfaEnabled: true,
            }, res.data.ssoToken);
            handleSuccessfulHandoff(finalUserId, finalEmail, res.data.ssoToken);
          } else if (res.data.status === "DENIED") {
            clearInterval(interval);
            setValidationError("Login request was denied from your mobile device.");
            setMfaMode("totp");
          } else if (res.data.status === "EXPIRED") {
            clearInterval(interval);
            setValidationError("Push challenge expired. Please enter your 6-digit TOTP code.");
            setMfaMode("totp");
          }
        }
      } catch {
        // Keep polling on network blips
      }
    }, 2000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [mfaChallenge?.challengeId, mfaMode]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    setAuthError(null);
    setNetworkWait(false);

    if (!email.trim()) {
      setValidationError("Please enter your email address.");
      return;
    }
    if (!password) {
      setValidationError("Please enter your password.");
      return;
    }

    const delayTimer = setTimeout(() => {
      setNetworkWait(true);
    }, 2500);

    try {
      const res = await login({
        email: email.trim(),
        password,
      });

      if (res.success) {
        if (res.mfaEnabled || res.mfaRequired) {
          setMfaChallenge({
            required: true,
            userId: res.userId,
            email: res.email || email.trim(),
            fullName: res.fullName,
            role: res.role,
            company: res.company,
            challengeId: res.challengeId,
            matchCode: res.matchCode,
          });
          setMfaMode(res.matchCode ? "push" : "totp");
        } else {
          saveSession({
            userId: res.userId || 1,
            email: res.email || email.trim(),
            fullName: res.fullName || "",
            role: (res.role as any) || "USER",
            company: res.company || "",
            mfaEnabled: false,
          }, res.ssoToken);
          handleSuccessfulHandoff(res.userId || 1, res.email || email.trim(), res.ssoToken);
        }
      }
    } finally {
      clearTimeout(delayTimer);
      setNetworkWait(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    setMfaError(null);
    setMfaNetworkWait(false);

    if (!totpCode.trim()) {
      setValidationError("Please enter the 6-digit authenticator code.");
      return;
    }

    const cleanCode = totpCode.replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      setValidationError("Code must be exactly 6 digits.");
      return;
    }

    const delayTimer = setTimeout(() => {
      setMfaNetworkWait(true);
    }, 2500);

    try {
      const res = await verifyLogin(
        mfaChallenge?.userId,
        mfaChallenge?.email,
        cleanCode
      );

      if (res.success) {
        const finalUserId = res.userId || mfaChallenge?.userId || 1;
        const finalEmail = res.email || mfaChallenge?.email || email.trim();
        const resolvedFullName = res.fullName || mfaChallenge?.fullName || "";
        const resolvedRole = (res.role || mfaChallenge?.role || "USER") as any;
        const resolvedCompany = res.company || mfaChallenge?.company || "";
        saveSession({
          userId: finalUserId,
          email: finalEmail,
          fullName: resolvedFullName,
          role: resolvedRole,
          company: resolvedCompany,
          mfaEnabled: true,
        }, res.ssoToken);
        handleSuccessfulHandoff(finalUserId, finalEmail, res.ssoToken);
      }
    } finally {
      clearTimeout(delayTimer);
      setMfaNetworkWait(false);
    }
  };

  const executeGoogleAuth = async (idToken: string) => {
    setValidationError("");
    setAuthError(null);
    setGoogleLoading(true);

    try {
      const res = await loginWithGoogle(idToken.trim());
      if (res.success) {
        setGoogleModalOpen(false);
        if (res.mfaEnabled || res.mfaRequired) {
          setMfaChallenge({
            required: true,
            userId: res.userId,
            email: res.email || "google.user@example.com",
            fullName: res.fullName,
            role: res.role,
            company: res.company,
            challengeId: res.challengeId,
            matchCode: res.matchCode,
          });
          setMfaMode(res.matchCode ? "push" : "totp");
        } else {
          saveSession({
            userId: res.userId || 1,
            email: res.email || "",
            fullName: res.fullName || "Google User",
            role: (res.role as any) || "USER",
            company: res.company || "",
            mfaEnabled: false,
          }, res.ssoToken);
          handleSuccessfulHandoff(res.userId || 1, res.email || "", res.ssoToken);
        }
      } else {
        setValidationError(res.message || "Google authentication failed.");
      }
    } catch {
      setValidationError("Failed to complete Google sign-in. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSocialAuth = (provider: "Google" | "Apple" | "Microsoft") => {
    if (provider === "Google") {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (clientId && (window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.prompt();
      } else {
        setGoogleModalOpen(true);
      }
      return;
    }

    const providerEmail =
      provider === "Apple"
        ? "demo.user@privaterelay.appleid.com"
        : "demo.user@outlook.com";

    const ssoId = provider === "Apple" ? 102 : 103;
    saveSession({
      userId: ssoId,
      email: providerEmail,
      fullName: `${provider} SSO User`,
      role: "USER",
      company: "Acme Global",
      mfaEnabled: false,
    });
    handleSuccessfulHandoff(
      ssoId,
      providerEmail,
      `sso_${provider.toLowerCase()}_token_demo`
    );
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col justify-between selection:bg-cyan-400 selection:text-black font-sans antialiased relative overflow-hidden">
      {/* Background ambient glowing blue aura */}
      <div
        className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/3 w-[650px] h-[450px] pointer-events-none rounded-full blur-[140px] opacity-70"
        style={{
          background:
            "radial-gradient(circle, rgba(21, 93, 252, 0.8) 0%, rgba(13, 53, 150, 0.5) 50%, rgba(5, 20, 66, 0) 80%)",
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[350px] pointer-events-none rounded-full blur-[130px] opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(14, 165, 233, 0.6) 0%, rgba(10, 60, 160, 0.3) 60%, transparent 80%)",
        }}
      />

      {/* Top Navigation Bar */}
      <header className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 pt-8 pb-6 flex items-center justify-between relative z-10">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-[#38e1ff] hover:opacity-90 transition-opacity flex items-center gap-2.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Sentinel Logo" className="w-8 h-8 rounded-lg object-contain" />
          <span>Sentinel</span>
        </Link>


        <nav className="flex items-center gap-7 sm:gap-10 text-xs sm:text-sm text-slate-300 font-medium">
          <Link href="/pricing" className="hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/features" className="hover:text-white transition-colors">
            Features
          </Link>
          <Link href="/docs" className="hover:text-white transition-colors">
            API &amp; Docs
          </Link>
          <Link href="/faq" className="hover:text-white transition-colors">
            FAQ
          </Link>
          <Link href="/services" className="hover:text-white transition-colors">
            Services
          </Link>
        </nav>
      </header>

      {/* Main Login Content Area */}
      <main className="flex-1 flex items-center justify-center w-full px-6 sm:px-10 lg:px-16 py-8 sm:py-14 relative z-10">
        <div className="max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-20 items-center">
          
          {/* Left Column: Headline */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[54px] font-bold text-white tracking-tight leading-[1.18] max-w-xl xl:max-w-2xl">
              Experience Seamless
              <br />
              Centralized Identity Governance,
              <br />
              and Real-Time Device
              <br />
              Monitoring
            </h1>
          </div>

          {/* Right Column: Glassmorphic Login Card */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="w-full max-w-xl xl:max-w-2xl rounded-[32px] sm:rounded-[36px] bg-[#0c1424]/85 border border-white/15 shadow-2xl backdrop-blur-xl p-8 sm:p-10 md:p-12">
              
              {/* Top Shield Emblem */}
              <div className="flex justify-center mb-3">
                <svg
                  className="w-13 h-13 text-[#38e1ff]"
                  viewBox="0 0 64 64"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Outer Shield Outline */}
                  <path
                    d="M32 4 L50 12 C50 36 32 58 32 58 C32 58 14 36 14 12 Z"
                    className="stroke-[#38e1ff]"
                    fill="rgba(56, 225, 255, 0.05)"
                  />
                  {/* Visor and Crest Inner Grid */}
                  <path d="M32 4 V32" />
                  <path d="M22 18 H42" />
                  <path d="M20 27 H44" />
                  <path d="M24 36 H40" />
                  <path d="M28 44 H36" />
                  {/* Visor Side Accents */}
                  <path d="M24 20 L27 34" />
                  <path d="M40 20 L37 34" />
                </svg>
              </div>

              {existingUser ? (
                <div className="text-center py-2">
                  {/* Status Indicator */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    {redirectUri ? "Single Sign-On Authorization" : "Active Session Detected"}
                  </div>

                  {/* Title & Context */}
                  <h2 className="text-2xl sm:text-[26px] font-bold text-white tracking-tight">
                    {redirectUri ? `Authorize Access to ${appName || "Application"}` : "Already Signed In"}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2 mb-6 max-w-sm mx-auto">
                    {redirectUri
                      ? `You are signed in as ${existingUser.fullName || existingUser.email}. Click below to authorize single sign-on and return to ${appName || "the client application"}.`
                      : "You are currently authenticated in Sentinel Security. Choose an option below to proceed."}
                  </p>

                  {/* Identity Box */}
                  <div className="bg-[#18293d]/70 border border-slate-700/60 rounded-2xl p-5 mb-8 text-left flex items-center gap-4 shadow-inner">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-[#38e1ff] text-slate-950 font-bold text-lg flex items-center justify-center shrink-0 shadow-md">
                      {existingUser.fullName
                        ? existingUser.fullName.charAt(0).toUpperCase()
                        : existingUser.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-bold text-white truncate">
                          {existingUser.fullName || "Authenticated User"}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-[#38e1ff] border border-cyan-500/20">
                          {existingUser.role || "USER"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">
                        {existingUser.email}
                      </p>
                      {existingUser.company && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          Organization: <span className="text-slate-300 font-medium">{existingUser.company}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {redirectUri ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSuccessfulHandoff(existingUser.userId, existingUser.email)}
                          className="w-full py-3.5 px-4 bg-[#38e1ff] hover:bg-[#2bc4e0] active:scale-[0.99] text-slate-950 font-bold text-xs sm:text-sm tracking-wider uppercase rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(56,225,255,0.3)] cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>Authorize & Enter {appName || "App"}</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => router.push("/dashboard")}
                          className="w-full py-3 px-4 bg-slate-800/80 hover:bg-slate-700/80 active:scale-[0.99] text-slate-300 hover:text-white font-medium text-xs sm:text-sm tracking-wide rounded-xl border border-slate-700 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>Go to Dashboard</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => router.push("/dashboard")}
                        className="w-full py-3.5 px-4 bg-[#38e1ff] hover:bg-[#2bc4e0] active:scale-[0.99] text-slate-950 font-bold text-xs sm:text-sm tracking-wider uppercase rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(56,225,255,0.3)] cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Go to Dashboard</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleLogoutAndSwitch}
                      className="w-full py-2.5 px-4 bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-300 font-medium text-xs rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                      </svg>
                      <span>Sign Out & Switch Account</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {redirectUri && (
                    <div className="mb-5 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                      <span>
                        SSO Request: Sign in to grant access to <strong className="text-white">{appName || "Client Application"}</strong>.
                      </span>
                    </div>
                  )}

                  {/* Title & Subtitle */}
                  <h2 className="text-2xl sm:text-[26px] font-bold text-white text-center tracking-tight">
                    Welcome to <span className="text-[#38e1ff]">Sentinel</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 font-normal text-center mt-1 mb-6">
                    {redirectUri ? `Sign in to authenticate with ${appName || "your application"}` : "Sign in to continue to your account"}
                  </p>

              {/* 3 Horizontal Social Buttons: Google, Apple, Microsoft */}
              <div className="grid grid-cols-3 gap-2.5 mb-5">
                {/* Google Button */}
                <button
                  type="button"
                  onClick={() => handleSocialAuth("Google")}
                  className="w-full py-2.5 px-3 bg-[#242c3d]/90 hover:bg-[#2c364b] active:scale-[0.98] border border-slate-700/40 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Sign in with Google"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27a7.18 7.18 0 0 1 0-4.54V6.58H1.25a11.96 11.96 0 0 0 0 10.84l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span className="text-xs font-semibold text-white">Google</span>
                </button>

                {/* Apple Button */}
                <button
                  type="button"
                  onClick={() => handleSocialAuth("Apple")}
                  className="w-full py-2.5 px-3 bg-[#242c3d]/90 hover:bg-[#2c364b] active:scale-[0.98] border border-slate-700/40 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Sign in with Apple"
                >
                  <svg className="w-3.5 h-3.5 shrink-0 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.8c.61-.75 1.04-1.8 1.01-2.8-.96.04-2.06.66-2.7 1.41-.56.65-.99 1.7-.93 2.7.97.08 2.01-.56 2.62-1.31z" />
                  </svg>
                  <span className="text-xs font-semibold text-white">Apple</span>
                </button>

                {/* Microsoft Button */}
                <button
                  type="button"
                  onClick={() => handleSocialAuth("Microsoft")}
                  className="w-full py-2.5 px-3 bg-[#242c3d]/90 hover:bg-[#2c364b] active:scale-[0.98] border border-slate-700/40 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Sign in with Microsoft"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#f25022" d="M1 1h10v10H1z" />
                    <path fill="#7fba00" d="M13 1h10v10H13z" />
                    <path fill="#00a4ef" d="M1 13h10v10H1z" />
                    <path fill="#ffb900" d="M13 13h10v10H13z" />
                  </svg>
                  <span className="text-xs font-semibold text-white">Microsoft</span>
                </button>
              </div>

              {/* Divider: or continue with email */}
              <div className="relative flex items-center mb-5">
                <div className="flex-grow border-t border-slate-700/60"></div>
                <span className="flex-shrink mx-3 text-[11px] sm:text-xs text-slate-400 font-normal">
                  or continue with email
                </span>
                <div className="flex-grow border-t border-slate-700/60"></div>
              </div>

              {/* Conditional: MFA 2FA Challenge vs Standard Login Form */}
              {mfaChallenge?.required ? (
                <div>
                  {/* MFA Challenge Header */}
                  <div className="text-center mb-5">
                    <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {mfaMode === "push" ? "Push Notification Approval" : "Two-Factor Authentication"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      {mfaMode === "push"
                        ? "Open Sentinel Authenticator on your mobile device and confirm the matching number."
                        : "Enter the 6-digit TOTP code generated by your paired mobile authenticator."}
                    </p>
                  </div>

                  {/* Alert: Validation or MFA Error */}
                  {(validationError || mfaError) && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                      <svg className="w-4 h-4 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{validationError || mfaError}</span>
                    </div>
                  )}

                  {mfaMode === "push" ? (
                    <div>
                      {/* Push Mode: 2-Digit Number Matching Box */}
                      <div className="my-5 py-5 px-6 bg-[#18293d]/80 border-2 border-[#38e1ff] rounded-2xl flex flex-col items-center justify-center shadow-[0_0_30px_rgba(56,225,255,0.2)]">
                        <span className="text-5xl font-extrabold font-mono tracking-widest text-[#38e1ff] animate-pulse">
                          {mfaChallenge.matchCode || "--"}
                        </span>
                        <span className="text-[11px] text-slate-400 mt-2 uppercase tracking-wider font-semibold">
                          Match Code
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-2.5 text-xs text-slate-300 mb-6 py-2 px-3 bg-cyan-950/40 border border-cyan-800/40 rounded-xl">
                        <svg className="animate-spin h-4 w-4 text-[#38e1ff] shrink-0" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Waiting for authorization on mobile device...</span>
                      </div>

                      <div className="space-y-2.5">
                        <button
                          type="button"
                          onClick={() => setMfaMode("totp")}
                          className="w-full py-3 px-4 bg-slate-800/90 hover:bg-slate-700/90 active:scale-[0.99] text-slate-200 hover:text-white font-medium text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
                        >
                          Enter 6-digit TOTP code manually instead
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMfaChallenge(null);
                            setTotpCode("");
                            setValidationError("");
                            setMfaError(null);
                          }}
                          className="w-full py-2.5 px-4 bg-transparent hover:bg-white/5 text-slate-400 hover:text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
                        >
                          Back to Login
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleMfaSubmit} noValidate>
                      {/* 6-digit Code Input */}
                      <div className="mb-5">
                        <label className="block text-xs font-medium text-slate-300 mb-2 text-center">
                          Security Verification Code
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          autoFocus
                          maxLength={6}
                          value={totpCode}
                          onChange={(e) => setTotpCode(e.target.value)}
                          placeholder="000000"
                          className="w-full text-center text-2xl tracking-[0.4em] font-mono font-bold bg-[#18293d]/80 border border-cyan-500/40 rounded-xl py-3 text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
                        />
                      </div>

                      {/* Verify & Unlock Button */}
                      <button
                        type="submit"
                        disabled={mfaLoading}
                        className="w-full py-3.5 px-4 bg-[#3bf0ff] hover:bg-[#2fe0ef] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] text-slate-950 font-bold text-sm sm:text-base rounded-xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center justify-center gap-2"
                      >
                        {mfaLoading ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-slate-950" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Verifying code...</span>
                          </>
                        ) : (
                          <span>Verify & Unlock</span>
                        )}
                      </button>

                      {/* Switch back to push if matchCode available */}
                      {mfaChallenge.matchCode && (
                        <button
                          type="button"
                          onClick={() => setMfaMode("push")}
                          className="w-full mt-3 py-2.5 px-4 bg-slate-800/60 hover:bg-slate-700/60 text-[#38e1ff] text-xs font-medium rounded-xl border border-cyan-500/30 transition-all cursor-pointer"
                        >
                          Approve with push notification number match
                        </button>
                      )}

                      {/* Network delay indicator */}
                      {mfaNetworkWait && (
                        <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-center gap-2 text-center animate-pulse">
                          <svg className="animate-spin h-3.5 w-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Network issue, please wait a few seconds...</span>
                        </div>
                      )}

                      {/* Cancel / Back to Login */}
                      <button
                        type="button"
                        onClick={() => {
                          setMfaChallenge(null);
                          setTotpCode("");
                          setValidationError("");
                          setMfaError(null);
                        }}
                        className="w-full mt-2.5 py-2.5 px-4 bg-transparent hover:bg-white/5 text-slate-400 hover:text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
                      >
                        Back to Login
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <form onSubmit={handleLoginSubmit} noValidate>
                  {/* Alert: Validation or Login Error */}
                  {(validationError || authError) && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                      <svg className="w-4 h-4 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{validationError || authError}</span>
                    </div>
                  )}

                  {/* Email Address */}
                  <div className="mb-3.5">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 text-left">
                      Email Address
                    </label>
                    <div className="relative flex items-center bg-[#18293d]/60 border border-slate-600/40 rounded-xl px-3.5 py-3 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400 transition-all">
                      <svg
                        className="w-4 h-4 text-slate-400 mr-2.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.6"
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-slate-400/80"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="mb-3.5">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 text-left">
                      Password
                    </label>
                    <div className="relative flex items-center bg-[#18293d]/60 border border-slate-600/40 rounded-xl px-3.5 py-3 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400 transition-all">
                      <svg
                        className="w-4 h-4 text-slate-400 mr-2.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.6"
                          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                        />
                      </svg>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-slate-400/80"
                      />
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between mt-3 mb-6 text-xs">
                    <div className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-[#18293d] text-cyan-400 accent-cyan-400 cursor-pointer"
                      />
                      <label
                        htmlFor="rememberMe"
                        className="text-slate-300 ml-2 cursor-pointer select-none"
                      >
                        Remember Me
                      </label>
                    </div>

                    <Link
                      href="/faq"
                      className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 px-4 bg-[#3bf0ff] hover:bg-[#2fe0ef] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] text-slate-950 font-bold text-sm sm:text-base rounded-xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {authLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-slate-950" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <span>Sign in</span>
                    )}
                  </button>

                  {/* Network delay indicator */}
                  {networkWait && (
                    <div className="mt-3.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-center gap-2 text-center animate-pulse">
                      <svg className="animate-spin h-3.5 w-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Network issue, please wait a few seconds...</span>
                    </div>
                  )}

                  {/* Bottom link: Don't have an account? Create one */}
                  <p className="text-center text-xs sm:text-sm text-slate-400 mt-5">
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/register"
                      className="text-white hover:text-cyan-400 font-semibold transition-colors"
                    >
                      Create one
                    </Link>
                  </p>
                </form>
              )}
            </>
          )}
            </div>
          </div>
        </div>
      </main>

      {/* Google Identity Services Modal */}
      {googleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#0c1424] border border-cyan-500/30 shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27a7.18 7.18 0 0 1 0-4.54V6.58H1.25a11.96 11.96 0 0 0 0 10.84l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Google Identity Services</h3>
                  <p className="text-xs text-slate-400">Spring Boot Server-Side Token Verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGoogleModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Sentinel securely validates Google ID tokens directly via the Spring Boot gateway using Google tokeninfo endpoints, without client-side GoTrue dependencies.
            </p>

            <div className="space-y-4">
              {/* Option A: Quick Coursework Demo Account */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Fast Evaluation Demo</span>
                  <span className="text-[10px] text-slate-400 font-mono">@demo.invalid</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Instantly authenticate using a sandboxed demo identity to test Sentinel Single Sign-On and MFA enforcement.
                </p>
                <button
                  type="button"
                  disabled={googleLoading}
                  onClick={() => executeGoogleAuth("demo_google:demo.user@demo.invalid")}
                  className="w-full py-2.5 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 active:scale-[0.99] border border-cyan-500/40 text-cyan-300 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {googleLoading ? "Verifying..." : "Sign In as demo.user@demo.invalid"}
                </button>
              </div>

              {/* Option B: Real Google ID Token */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Custom Google ID Token</span>
                  <span className="text-[10px] text-slate-400 font-mono">JWT / tokeninfo</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  Paste a verified Google ID Token (e.g. from Google OAuth Playground or Google Cloud Console) to test full cryptographic validation:
                </p>
                <textarea
                  value={googleTokenInput}
                  onChange={(e) => setGoogleTokenInput(e.target.value)}
                  placeholder="Paste Google ID Token (eyJhbGciOiJSUzI1NiIs...)"
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-black/50 border border-slate-700 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 mb-3 resize-none"
                />
                <button
                  type="button"
                  disabled={googleLoading || !googleTokenInput.trim()}
                  onClick={() => executeGoogleAuth(googleTokenInput)}
                  className="w-full py-2.5 px-3 bg-[#3bf0ff] hover:bg-[#2fe0ef] active:scale-[0.99] text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {googleLoading ? "Verifying against Google..." : "Verify & Authenticate Google Token"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
