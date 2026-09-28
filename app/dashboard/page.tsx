"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, MfaSetupResponse } from "@/types/auth";
import { AppIntegration, IntegrationType } from "@/types/integration";
import { getStoredSession, updateStoredUser, clearSession } from "@/lib/session";
import { useMfa } from "@/hooks/useMfa";
import { useIntegrations } from "@/hooks/useIntegrations";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const { setup, verifySetup, loading: mfaLoading, error: mfaError, setError: setMfaError } = useMfa();
  const {
    apps,
    loading: servicesLoading,
    boilerplateTemplates,
    connectBoilerplate,
    addCustomApp,
    removeApp,
    launchApp,
    testPing,
    testingPing,
    pingResult,
    clearPingResult,
  } = useIntegrations(user?.userId);

  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // MFA Pairing Modal State
  const [pairingModalOpen, setPairingModalOpen] = useState(false);
  const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [pairingSuccess, setPairingSuccess] = useState("");
  const [pairingValidationErr, setPairingValidationErr] = useState("");

  // Add Service Integration Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<"boilerplate" | "custom">("boilerplate");
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [customType, setCustomType] = useState<IntegrationType>("sso_oauth");
  const [customLoginUrl, setCustomLoginUrl] = useState("");
  const [customClientId, setCustomClientId] = useState("");
  const [customMfaRequired, setCustomMfaRequired] = useState(true);
  const [customValidationErr, setCustomValidationErr] = useState("");
  const [customSuccessMsg, setCustomSuccessMsg] = useState("");

  // SSO Login Challenge Modal State ("Login Chu2 Step")
  const [ssoModalOpen, setSsoModalOpen] = useState(false);
  const [selectedSsoApp, setSelectedSsoApp] = useState<AppIntegration | null>(null);
  const [ssoTotpCode, setSsoTotpCode] = useState("");
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoError, setSsoError] = useState("");
  const [ssoSuccess, setSsoSuccess] = useState("");
  const [launchedAppId, setLaunchedAppId] = useState<string | number | null>(null);

  useEffect(() => {
    const session = getStoredSession();
    if (!session || !session.user) {
      router.push("/login");
      return;
    }
    setUser(session.user);
  }, [router]);

  const handleOpenPairingModal = async () => {
    if (!user) return;
    setPairingModalOpen(true);
    setProfileDropdownOpen(false);
    setPairingSuccess("");
    setPairingValidationErr("");
    setTotpCode("");
    setMfaError(null);
    setCopiedKey(false);

    const res = await setup(user.userId);
    if (res.success) {
      setSetupData(res);
    }
  };

  const handleVerifyPairing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPairingValidationErr("");
    setMfaError(null);

    const cleanCode = totpCode.replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      setPairingValidationErr("Code must be exactly 6 digits.");
      return;
    }

    const res = await verifySetup(user.userId, cleanCode);
    if (res.success) {
      setPairingSuccess(res.message || "MFA device paired and activated successfully.");
      updateStoredUser({ mfaEnabled: true });
      setUser((prev) => (prev ? { ...prev, mfaEnabled: true } : null));
      setTimeout(() => {
        setPairingModalOpen(false);
      }, 1600);
    }
  };

  const handleCopySecret = () => {
    if (!setupData?.secretKey) return;
    navigator.clipboard.writeText(setupData.secretKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  const handleOpenAddModal = () => {
    setAddModalOpen(true);
    setCustomValidationErr("");
    setCustomSuccessMsg("");
    clearPingResult();
  };

  const handleConnectBoilerplate = async (templateId: string) => {
    const success = await connectBoilerplate(templateId);
    if (success) {
      setCustomSuccessMsg("Integration connected and persisted successfully.");
      setTimeout(() => {
        setCustomSuccessMsg("");
      }, 2000);
    }
  };

  const handleAddCustomApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomValidationErr("");

    if (!customName.trim()) {
      setCustomValidationErr("Service name is required.");
      return;
    }

    if (customLoginUrl.trim() && !customLoginUrl.startsWith("http://") && !customLoginUrl.startsWith("https://")) {
      setCustomValidationErr("Endpoint must start with http:// or https://");
      return;
    }

    const success = await addCustomApp({
      name: customName,
      category: customCategory || "Custom Enterprise Service",
      type: customType,
      loginUrl: customLoginUrl,
      clientId: customClientId,
      mfaRequired: customMfaRequired,
    });

    if (success) {
      setCustomSuccessMsg("Custom integration registered successfully.");
      setCustomName("");
      setCustomCategory("");
      setCustomLoginUrl("");
      setCustomClientId("");
      setTimeout(() => {
        setAddModalOpen(false);
        setCustomSuccessMsg("");
      }, 1200);
    }
  };

  // Launch SSO Handler - Triggers MFA Step if enforced
  const handleInitiateSsoLaunch = async (app: AppIntegration) => {
    // If MFA is enforced on this app AND user has MFA active on their profile:
    if (app.metrics.mfaRequired && user?.mfaEnabled) {
      setSelectedSsoApp(app);
      setSsoTotpCode("");
      setSsoError("");
      setSsoSuccess("");
      setSsoModalOpen(true);
      return;
    }

    // Direct SSO launch (no MFA challenge required)
    setLaunchedAppId(app.id);
    await launchApp(app);
    setTimeout(() => {
      setLaunchedAppId(null);
    }, 2500);
  };

  const handleConfirmSsoChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSsoApp) return;

    setSsoError("");
    setSsoSuccess("");

    const cleanCode = ssoTotpCode.replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      setSsoError("Authentication code must be exactly 6 digits.");
      return;
    }

    setSsoLoading(true);
    const res = await launchApp(selectedSsoApp, cleanCode);
    setSsoLoading(false);

    if (res.success) {
      setSsoSuccess("SSO authentication verified. Access granted.");
      setLaunchedAppId(selectedSsoApp.id);
      setTimeout(() => {
        setSsoModalOpen(false);
        setLaunchedAppId(null);
      }, 1500);
    } else {
      setSsoError(res.message || "MFA challenge failed. Access denied.");
    }
  };

  const filteredApps = apps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayName = user?.fullName || user?.email?.split("@")[0] || "User";

  return (
    <div
      className="min-h-screen w-full relative flex text-white font-sans antialiased selection:bg-cyan-400 selection:text-black"
      style={{
        background:
          "radial-gradient(ellipse at 60% 36%, #15398a 0%, #0d2561 38%, #071539 72%, #040c21 100%)",
      }}
    >
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 w-64 sm:w-72 md:w-[290px] lg:w-[306px] bg-black self-stretch min-h-screen shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.5)] border-r border-white/5 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="sticky top-0 flex flex-col justify-between h-screen pt-9 pb-6 px-5 sm:px-6 w-full">
          <div>
            <div className="flex flex-col items-center select-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/sentinel-shield.png"
                alt="Sentinel Shield"
                className="w-16 h-16 object-contain drop-shadow-[0_0_16px_rgba(46,224,236,0.6)]"
              />
              <span className="mt-3 text-2xl font-bold tracking-tight text-[#2ee0ec] drop-shadow-[0_0_12px_rgba(46,224,236,0.45)]">
                Sentinel
              </span>
            </div>

            <div className="mt-10 w-full space-y-2">
              <button
                type="button"
                className="w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#175beb] via-[#1249c5] to-[#0c338e] text-white font-semibold text-base shadow-[0_4px_24px_rgba(23,91,235,0.55)] transition-all cursor-pointer text-left"
              >
                <svg
                  className="w-5 h-5 text-white shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="3" width="20" height="15" rx="2" />
                  <path d="M6 14l3.5-4.5 3 3 4-5" />
                </svg>
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddModal}
                className="w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm transition-all cursor-pointer text-left border border-transparent hover:border-white/10"
              >
                <svg
                  className="w-5 h-5 text-cyan-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Service</span>
              </button>

              <button
                type="button"
                onClick={handleOpenPairingModal}
                className="w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm transition-all cursor-pointer text-left border border-transparent hover:border-white/10"
              >
                <svg
                  className="w-5 h-5 text-cyan-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span>Pair Authenticator</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors text-xs font-medium cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 px-5 sm:px-7 lg:px-9 pt-6 pb-8">
        {/* Top Header */}
        <header className="flex items-center justify-between gap-3 sm:gap-4 w-full">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 max-w-[280px] sm:max-w-xs md:max-w-md">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-black border border-white/10 text-slate-300 hover:text-white cursor-pointer"
              aria-label="Open sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="relative flex items-center bg-black rounded-full px-4 py-2.5 w-full border border-white/5 focus-within:border-cyan-500/40 transition-colors">
              <svg
                className="w-4 h-4 text-slate-400 shrink-0 mr-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services or protocols"
                className="bg-transparent text-xs sm:text-sm text-slate-200 placeholder-slate-400 outline-none w-full"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-white transition-colors ml-1 cursor-pointer"
                  aria-label="Clear search"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <span className="text-slate-500 text-xs ml-1 select-none pointer-events-none">/</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 md:gap-5 relative">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Service</span>
            </button>

            <button
              type="button"
              className="relative p-1.5 sm:p-2 text-slate-200 hover:text-white transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 w-2 h-2 rounded-full bg-[#0066ff] shadow-[0_0_8px_#0066ff]" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 sm:gap-2.5 bg-black py-1 sm:py-1.5 pl-1.5 pr-2.5 sm:pr-3.5 rounded-full border border-white/5 cursor-pointer hover:border-white/15 transition-all select-none"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-slate-950 uppercase shrink-0">
                  {displayName.charAt(0)}
                </div>
                <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[120px]">{displayName}</span>
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0c1424] border border-white/15 shadow-2xl backdrop-blur-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-white/10 mb-2">
                    <p className="text-xs font-bold text-white truncate">{user?.fullName || displayName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  </div>

                  <div className="px-3 py-1.5 mb-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">MFA Posture</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                        user?.mfaEnabled
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {user?.mfaEnabled ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenPairingModal}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Pair Authenticator</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 cursor-pointer mt-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Welcome Greeting & Active Security Banner */}
        <div className="mt-7 sm:mt-9 mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-normal text-white tracking-tight">
              Welcome, <span className="text-[#38bdf8]">{displayName}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Central IAM Identity: <span className="text-slate-300 font-mono">{user?.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user?.mfaEnabled ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Two-Factor Authentication: Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>MFA Unpaired</span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenPairingModal}
                  className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  Pair Device
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Service Grid or Empty State */}
        {servicesLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
            <svg className="animate-spin h-8 w-8 text-cyan-400 mb-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xs">Synchronizing integrated enterprise services...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          /* Clean Empty State (Default Dummy Apps Removed) */
          <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl bg-black/60 border border-dashed border-white/10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">No Integrated Services Enrolled</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mt-1.5">
              Connect pre-configured identity providers or register your company applications to track sessions, telemetry, and MFA policy enforcement.
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Your First Service</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 flex-1 w-full">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="group bg-black rounded-2xl border border-cyan-500/40 p-5 sm:p-6 lg:p-7 shadow-[0_0_20px_rgba(6,182,212,0.06)] hover:border-cyan-400/70 hover:shadow-[0_0_26px_rgba(6,182,212,0.12)] transition-all flex flex-col justify-between select-none"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#070b14] border border-white/10 flex items-center justify-center p-2 shrink-0 group-hover:border-cyan-500/30 transition-all">
                        {app.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={app.logo} alt={`${app.name} Logo`} className="w-8 h-8 object-contain" />
                        ) : (
                          <AppIcon iconType={app.iconType} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight group-hover:text-[#38bdf8] transition-colors">
                            {app.name}
                          </h3>
                          {app.isBoilerplate && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-300 font-medium">
                              Federated
                            </span>
                          )}
                          {app.isCustom && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 font-medium">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{app.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#08152e] border border-cyan-500/25 text-cyan-300">
                        <span className={`w-1.5 h-1.5 rounded-full ${app.statusColor}`} />
                        <span>{app.status}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeApp(app.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Disconnect service"
                        aria-label="Disconnect service"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
                    <div className="bg-[#070d1a] border border-white/5 rounded-xl p-2.5">
                      <span className="block text-[10px] uppercase font-semibold tracking-wider text-slate-500">Last Login</span>
                      <span className="block text-xs font-medium text-slate-200 mt-1 truncate" title={app.metrics.lastLogin}>
                        {app.metrics.lastLogin}
                      </span>
                    </div>

                    <div className="bg-[#070d1a] border border-white/5 rounded-xl p-2.5">
                      <span className="block text-[10px] uppercase font-semibold tracking-wider text-slate-500">Last Active</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {app.metrics.lastActive.includes("now") && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                        <span className="text-xs font-medium text-slate-200 truncate">{app.metrics.lastActive}</span>
                      </div>
                    </div>

                    <div className="bg-[#070d1a] border border-white/5 rounded-xl p-2.5">
                      <span className="block text-[10px] uppercase font-semibold tracking-wider text-slate-500">Total Sign-ins</span>
                      <span className="block text-xs font-semibold text-cyan-400 mt-1">
                        {app.metrics.totalLogins}
                      </span>
                    </div>

                    <div className="bg-[#070d1a] border border-white/5 rounded-xl p-2.5">
                      <span className="block text-[10px] uppercase font-semibold tracking-wider text-slate-500">Access Policy</span>
                      <span
                        className={`block text-[11px] font-semibold mt-1 truncate ${
                          app.metrics.mfaRequired ? "text-emerald-400" : "text-slate-300"
                        }`}
                      >
                        {app.metrics.mfaRequired ? "MFA Enforced" : "Direct SSO"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Protocol: {app.type.replace("_", " ").toUpperCase()}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleInitiateSsoLaunch(app)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-400/40 text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-all cursor-pointer"
                  >
                    {launchedAppId === app.id ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-emerald-300">Access Granted</span>
                      </>
                    ) : (
                      <>
                        <span>Launch SSO</span>
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* SSO Authentication Challenge Modal ("Login Chu2 Step") */}
      {ssoModalOpen && selectedSsoApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0c1424] border border-cyan-500/30 p-6 sm:p-7 shadow-2xl text-white">
            <button
              type="button"
              onClick={() => setSsoModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-5">
              <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white">SSO Authentication Challenge</h3>
              <p className="text-xs text-slate-400 mt-1">
                Access to <span className="text-cyan-300 font-semibold">{selectedSsoApp.name}</span> enforces multi-factor verification before session unlock.
              </p>
            </div>

            {ssoError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{ssoError}</span>
              </div>
            )}

            {ssoSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{ssoSuccess}</span>
              </div>
            )}

            <form onSubmit={handleConfirmSsoChallenge} className="pt-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5 text-center">
                Enter 6-Digit Authenticator Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={ssoTotpCode}
                onChange={(e) => setSsoTotpCode(e.target.value)}
                placeholder="000000"
                className="w-full text-center text-xl tracking-[0.4em] font-mono font-bold bg-[#131926] border border-cyan-500/40 rounded-xl py-2.5 text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all mb-4 shadow-inner"
              />

              <button
                type="submit"
                disabled={ssoLoading || !!ssoSuccess}
                className="w-full py-3 px-4 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {ssoLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-slate-950" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Authorize & Launch SSO</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Service Integration Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl bg-[#0c1424] border border-cyan-500/30 p-6 sm:p-7 shadow-2xl text-white">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-5">
              <h3 className="text-xl font-bold tracking-tight text-white">Add Service Integration</h3>
              <p className="text-xs text-slate-400 mt-1">
                Connect federated identity providers or register custom enterprise applications into Sentinel IAM.
              </p>
            </div>

            <div className="flex border-b border-white/10 mb-5">
              <button
                type="button"
                onClick={() => {
                  setActiveModalTab("boilerplate");
                  setCustomValidationErr("");
                }}
                className={`flex-1 pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
                  activeModalTab === "boilerplate"
                    ? "border-cyan-400 text-cyan-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Pre-Configured Providers
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModalTab("custom");
                  setCustomValidationErr("");
                }}
                className={`flex-1 pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
                  activeModalTab === "custom"
                    ? "border-cyan-400 text-cyan-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Custom Service Registration
              </button>
            </div>

            {customValidationErr && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{customValidationErr}</span>
              </div>
            )}

            {customSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{customSuccessMsg}</span>
              </div>
            )}

            {activeModalTab === "boilerplate" && (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {boilerplateTemplates.map((template) => {
                  const isConnected = apps.some((a) => a.name.toLowerCase() === template.name.toLowerCase());
                  return (
                    <div
                      key={template.id}
                      className="p-3.5 rounded-2xl bg-[#080e1c] border border-white/5 hover:border-cyan-500/30 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center shrink-0">
                          <AppIcon iconType={template.iconType} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white">{template.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-400">
                              {template.type.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{template.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 font-mono">
                              Scopes: {template.defaultScopes.join(", ")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleConnectBoilerplate(template.id)}
                        disabled={isConnected}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          isConnected
                            ? "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                            : "bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-md shadow-cyan-500/20"
                        }`}
                      >
                        {isConnected ? "Connected" : "Connect"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {activeModalTab === "custom" && (
              <form onSubmit={handleAddCustomApp} className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Service / App Name *</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Internal Payroll Portal"
                    className="w-full bg-[#131926] border border-white/10 focus:border-cyan-400 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g. Operations / Finance"
                      className="w-full bg-[#131926] border border-white/10 focus:border-cyan-400 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Auth Protocol</label>
                    <select
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value as IntegrationType)}
                      className="w-full bg-[#131926] border border-white/10 focus:border-cyan-400 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 text-white outline-none transition-colors"
                    >
                      <option value="sso_oauth">OAuth 2.0 / OIDC</option>
                      <option value="saml">SAML 2.0</option>
                      <option value="rest_api">REST Health API</option>
                      <option value="webhook">Security Webhook</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-300">Login / Endpoint URL</label>
                    {customLoginUrl.trim() && (
                      <button
                        type="button"
                        onClick={() => testPing(customLoginUrl)}
                        disabled={testingPing}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer underline"
                      >
                        {testingPing ? "Pinging..." : "Test Ping"}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={customLoginUrl}
                    onChange={(e) => setCustomLoginUrl(e.target.value)}
                    placeholder="https://app.company.internal/sso/login"
                    className="w-full bg-[#131926] border border-white/10 focus:border-cyan-400 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none transition-colors"
                  />
                  {pingResult && (
                    <p
                      className={`text-[11px] mt-1.5 ${
                        pingResult.success ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {pingResult.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Client ID / App Key (Optional)</label>
                  <input
                    type="text"
                    value={customClientId}
                    onChange={(e) => setCustomClientId(e.target.value)}
                    placeholder="client_corp_94829103"
                    className="w-full bg-[#131926] border border-white/10 focus:border-cyan-400 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="mfaToggle"
                    checked={customMfaRequired}
                    onChange={(e) => setCustomMfaRequired(e.target.checked)}
                    className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                  />
                  <label htmlFor="mfaToggle" className="text-xs text-slate-300 select-none cursor-pointer">
                    Enforce Multi-Factor Authentication (MFA) before access
                  </label>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                  >
                    Register Service Integration
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Authenticator Pairing Modal */}
      {pairingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0c1424] border border-cyan-500/30 p-6 sm:p-8 shadow-2xl text-white">
            <button
              type="button"
              onClick={() => setPairingModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white">Pair Mobile Authenticator</h3>
              <p className="text-xs text-slate-400 mt-1.5">
                Scan the QR code with your mobile authenticator app or enter the manual pairing key.
              </p>
            </div>

            {(pairingValidationErr || mfaError) && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{pairingValidationErr || mfaError}</span>
              </div>
            )}

            {pairingSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{pairingSuccess}</span>
              </div>
            )}

            {mfaLoading && !setupData ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <svg className="animate-spin h-8 w-8 text-cyan-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xs text-slate-400">Generating secure pairing secret...</p>
              </div>
            ) : setupData ? (
              <div className="space-y-4">
                {setupData.otpAuthUri && (
                  <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setupData.otpAuthUri)}`}
                      alt="Authenticator QR Code"
                      className="w-40 h-40 rounded-xl bg-white p-2 object-contain"
                    />
                    <span className="text-[11px] text-slate-400 mt-2 font-mono">{setupData.accountEmail || user?.email}</span>
                  </div>
                )}

                {setupData.secretKey && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Manual Secret Key
                    </label>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#131926] border border-slate-700/60">
                      <code className="text-xs text-cyan-300 font-mono tracking-wider flex-1 truncate">
                        {setupData.secretKey}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer shrink-0"
                      >
                        {copiedKey ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleVerifyPairing} className="pt-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 text-center">
                    Enter 6-Digit Authenticator Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="000000"
                    className="w-full text-center text-xl tracking-[0.4em] font-mono font-bold bg-[#131926] border border-cyan-500/40 rounded-xl py-2.5 text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all mb-4 shadow-inner"
                  />

                  <button
                    type="submit"
                    disabled={mfaLoading || !!pairingSuccess}
                    className="w-full py-3 px-4 bg-[#3bf0ff] hover:bg-[#2fe0ef] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {mfaLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-slate-950" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Verifying code...</span>
                      </>
                    ) : (
                      <span>Verify & Activate MFA</span>
                    )}
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

// Vector Icon Renderer for Services (Zero Emojis)
function AppIcon({ iconType }: { iconType?: string }) {
  switch (iconType) {
    case "facebook":
      return (
        <svg className="w-6 h-6 text-[#1877f2] fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "google":
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      );
    case "github":
      return (
        <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      );
    case "microsoft":
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24">
          <path fill="#f25022" d="M1 1h10v10H1z" />
          <path fill="#7fba00" d="M13 1h10v10H13z" />
          <path fill="#00a4ef" d="M1 13h10v10H1z" />
          <path fill="#ffb900" d="M13 13h10v10H13z" />
        </svg>
      );
    case "cloud":
      return (
        <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      );
    case "key":
      return (
        <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      );
    case "terminal":
      return (
        <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    default:
      return (
        <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
  }
}
