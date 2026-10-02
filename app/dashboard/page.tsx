"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, MfaSetupResponse } from "@/types/auth";
import { AppIntegration, IntegrationType } from "@/types/integration";
import { getStoredSession, updateStoredUser, clearSession } from "@/lib/session";
import { useMfa } from "@/hooks/useMfa";
import { useIntegrations } from "@/hooks/useIntegrations";
import { updateUserProfile } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const { setup, verifySetup, loading: mfaLoading, error: mfaError, setError: setMfaError } = useMfa();
  const {
    apps,
    loading: servicesLoading,
    boilerplateTemplates,
    connectBoilerplate,
    addCustomApp,
    removeApp,
  } = useIntegrations(user?.userId);

  const isAdmin = user?.role === "ADMIN";

  // MFA Pairing Modal State
  const [pairingModalOpen, setPairingModalOpen] = useState(false);
  const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [pairingSuccess, setPairingSuccess] = useState("");
  const [pairingValidationErr, setPairingValidationErr] = useState("");

  // Add / Configure Service Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<"templates" | "custom">("templates");
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [customType, setCustomType] = useState<IntegrationType>("sso_oauth");
  const [customLoginUrl, setCustomLoginUrl] = useState("");
  const [customClientId, setCustomClientId] = useState("");
  const [customMfaRequired, setCustomMfaRequired] = useState(true);
  const [modalErr, setModalErr] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // Profile Modal State (Self-Service Name Edit with Locked Credentials)
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  useEffect(() => {
    const session = getStoredSession();
    if (!session || !session.user) {
      router.push("/login");
      return;
    }
    setUser(session.user);
    setEditFullName(session.user.fullName || "");
  }, [router]);

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!editFullName.trim()) {
      setProfileError("Account name cannot be empty.");
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    const res = await updateUserProfile(user.userId, editFullName.trim());
    setProfileSaving(false);

    if (res.success) {
      updateStoredUser({ fullName: editFullName.trim() });
      setUser((prev) => (prev ? { ...prev, fullName: editFullName.trim() } : prev));
      setProfileSuccess("Account name updated successfully.");
      setTimeout(() => {
        setProfileModalOpen(false);
        setProfileSuccess("");
      }, 1200);
    } else {
      setProfileError(res.message || "Failed to update account name.");
    }
  };

  const handleOpenPairingModal = async () => {
    if (!user) return;
    setPairingModalOpen(true);
    setPairingSuccess("");
    setPairingValidationErr("");
    setTotpCode("");
    setCopiedKey(false);
    setMfaError(null);

    const res = await setup(user.userId);
    if (res) {
      setSetupData(res);
    }
  };

  const handleCopySecret = () => {
    if (!setupData?.secretKey) return;
    navigator.clipboard.writeText(setupData.secretKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleVerifyPairing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPairingValidationErr("");

    const cleanCode = totpCode.trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      setPairingValidationErr("Please enter a valid 6-digit TOTP code.");
      return;
    }

    const res = await verifySetup(user.userId, cleanCode);
    if (res && res.success) {
      setPairingSuccess("Authenticator successfully paired and activated.");
      updateStoredUser({ mfaEnabled: true });
      setUser((prev) => (prev ? { ...prev, mfaEnabled: true } : null));
      setTimeout(() => {
        setPairingModalOpen(false);
        setSetupData(null);
        setTotpCode("");
      }, 1500);
    }
  };

  const handleConnectTemplate = async (templateId: string) => {
    setConnectingId(templateId);
    setModalErr("");
    setModalSuccess("");

    const ok = await connectBoilerplate(templateId);
    setConnectingId(null);

    if (ok) {
      setModalSuccess("Application successfully configured and added to your dashboard.");
      setTimeout(() => {
        setModalSuccess("");
      }, 2000);
    } else {
      setModalErr("Failed to configure application. Please try again.");
    }
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalErr("");
    setModalSuccess("");

    if (!customName.trim()) {
      setModalErr("Application name is required.");
      return;
    }
    if (!customLoginUrl.trim()) {
      setModalErr("Launch or login URL is required.");
      return;
    }

    const ok = await addCustomApp({
      name: customName.trim(),
      category: customCategory.trim() || "Custom Service",
      type: customType,
      loginUrl: customLoginUrl.trim(),
      clientId: customClientId.trim() || undefined,
      mfaRequired: customMfaRequired,
    });

    if (ok) {
      setModalSuccess("Custom application registered successfully.");
      setCustomName("");
      setCustomCategory("");
      setCustomLoginUrl("");
      setCustomClientId("");
      setTimeout(() => {
        setAddModalOpen(false);
        setModalSuccess("");
      }, 1200);
    } else {
      setModalErr("Failed to register custom application.");
    }
  };

  const filteredApps = apps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase())
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
        className={`fixed md:relative inset-y-0 left-0 z-40 w-64 sm:w-72 md:w-[280px] bg-black self-stretch min-h-screen shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.5)] border-r border-white/5 transition-transform duration-300 ease-in-out md:translate-x-0 ${
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
              {isAdmin && (
                <span className="mt-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 font-bold uppercase tracking-wider">
                  IAM Admin
                </span>
              )}
            </div>

            <div className="mt-8 w-full space-y-2">
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#175beb] via-[#1249c5] to-[#0c338e] text-white font-semibold text-sm shadow-[0_4px_24px_rgba(23,91,235,0.55)] transition-all cursor-pointer text-left"
              >
                <svg
                  className="w-4 h-4 text-white shrink-0"
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
                <span>{isAdmin ? "Admin Overview" : "My Dashboard"}</span>
              </button>

              {isAdmin && (
                <Link
                  href="/users"
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left border hover:bg-purple-500/15 text-slate-300 hover:text-white border-transparent hover:border-purple-400/40"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>User Directory</span>
                  </div>
                </Link>
              )}

              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm transition-all text-left border border-transparent hover:border-white/10 cursor-pointer"
              >
                <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Configure Services</span>
              </button>

              <Link
                href="/terms"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm transition-all text-left border border-transparent hover:border-white/10"
              >
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Terms & Policy</span>
              </Link>

              <button
                type="button"
                onClick={handleOpenPairingModal}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm transition-all cursor-pointer text-left border border-transparent hover:border-white/10"
              >
                <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
      <main className="flex-1 flex flex-col min-w-0 px-4 sm:px-6 lg:px-8 pt-6 pb-8">
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
              <svg className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search configured applications..."
                className="bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 outline-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Configure Apps</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 bg-black py-1.5 pl-1.5 pr-3 rounded-full border border-white/10 cursor-pointer hover:border-white/20 transition-all select-none"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-slate-950 uppercase shrink-0">
                  {displayName.charAt(0)}
                </div>
                <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[120px]">{displayName}</span>
                <svg className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0c1424] border border-white/15 shadow-2xl backdrop-blur-xl p-3 z-50">
                  <div className="px-3 py-2 border-b border-white/10 mb-2">
                    <p className="text-xs font-bold text-white truncate">{user?.fullName || displayName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    <p className="text-[10px] text-purple-400 mt-1 uppercase font-mono font-semibold">
                      Role: {user?.role || "USER"}
                    </p>
                  </div>

                  <div className="px-3 py-1.5 mb-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">MFA Status</span>
                    <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${user?.mfaEnabled ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"}`}>
                      {user?.mfaEnabled ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setAddModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer mb-1"
                  >
                    <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Configure Applications</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setProfileModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer mb-1"
                  >
                    <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span>Edit Profile Name</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleOpenPairingModal();
                    }}
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

        {/* Welcome Greeting Banner */}
        <div className="mt-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-normal text-white tracking-tight">
                Welcome, <span className="text-[#38bdf8]">{displayName}</span>
              </h2>
              {isAdmin && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 font-bold uppercase">
                  Central IAM Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Identity: <span className="text-slate-300 font-mono">{user?.email}</span>
              {isAdmin && " • Full Tenant Control: All Loaded Services & User Provisioning"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user?.mfaEnabled ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Two-Factor Authentication: Active</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleOpenPairingModal}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                Pair MFA Authenticator
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Content: Loading vs Empty State vs Configured Services Grid */}
        {servicesLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-400">
            <svg className="animate-spin h-8 w-8 text-cyan-400 mb-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xs">Loading configured applications...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          /* Clean Empty State (Newly Created Accounts Start Clean) */
          <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-14 rounded-3xl bg-black/40 border border-dashed border-white/15 text-center min-h-[380px]">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">No Applications Configured</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mt-2 leading-relaxed">
              Your account currently has no active applications or integrations. Choose from enterprise application templates or configure custom integrations to get started.
            </p>
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Configure Applications</span>
            </button>
          </div>
        ) : (
          /* Configured Services Grid */
          <div className="space-y-4 flex-1 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-300 tracking-tight">
                Configured Services ({filteredApps.length})
              </h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer"
              >
                <span>+ Add Service</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 w-full">
              {filteredApps.map((app) => {
                const isExternal = Boolean(app.loginUrl && (app.loginUrl.startsWith("http://") || app.loginUrl.startsWith("https://")));
                const launchHref = isExternal && app.loginUrl && user?.userId
                  ? `${app.loginUrl}${app.loginUrl.includes("?") ? "&" : "?"}ssoUserId=${user.userId}&ssoEmail=${encodeURIComponent(user.email || "")}`
                  : (app.loginUrl || `/apps/${app.id}`);
                return (
                  <div
                    key={app.id}
                    className="group bg-black rounded-2xl border border-cyan-500/40 p-6 sm:p-7 shadow-[0_0_20px_rgba(6,182,212,0.06)] hover:border-cyan-400/70 hover:shadow-[0_0_26px_rgba(6,182,212,0.12)] transition-all flex flex-col justify-between"
                  >
                    {/* Card Top Row: Custom App Logo & Actions */}
                    <div className="flex items-start justify-between">
                      <div className="p-2 sm:p-2.5 rounded-xl bg-[#070b14] border border-white/5 group-hover:border-cyan-500/30 transition-all">
                        {app.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={app.logo}
                            alt={`${app.name} Logo`}
                            className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                          />
                        ) : (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
                            <AppIcon iconType={app.iconType} />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => removeApp(app.id)}
                          title="Remove integration"
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:border-red-500/40 hover:bg-red-500/10 text-slate-400 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>

                        <Link
                          href={launchHref}
                          target={isExternal ? "_blank" : undefined}
                          rel={isExternal ? "noopener noreferrer" : undefined}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-cyan-300 group-hover:border-cyan-500/40 group-hover:bg-cyan-950/20 transition-all cursor-pointer"
                          title="Launch service"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M7 17L17 7M17 7H9M17 7V15"
                            />
                          </svg>
                        </Link>
                      </div>
                    </div>

                    {/* Card Bottom Area: App Name, Category, and Status Pill */}
                    <div className="mt-6 sm:mt-8">
                      <Link
                        href={launchHref}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                      >
                        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-[#38bdf8] transition-colors cursor-pointer">
                          {app.name}
                        </h3>
                      </Link>
                      <p className="text-xs sm:text-sm text-slate-400 font-normal mt-1">
                        {app.category}
                      </p>

                      <div className="mt-3.5 flex items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#08152e] border border-cyan-500/25 text-cyan-300">
                          <span className={`w-1.5 h-1.5 rounded-full ${app.statusColor || "bg-cyan-400"}`} />
                          <span>{app.status || "Active"}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Total Logins: {app.metrics?.totalLogins || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Configure / Add Application Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#0c1424] border border-cyan-500/30 p-6 sm:p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold tracking-tight text-white">Configure Applications</h3>
              <p className="text-xs text-slate-400 mt-1">
                Select enterprise templates or register custom applications to add them to your dashboard.
              </p>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-5">
              <button
                type="button"
                onClick={() => setActiveModalTab("templates")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeModalTab === "templates"
                    ? "bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Enterprise Templates
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab("custom")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeModalTab === "custom"
                    ? "bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Custom Integration
              </button>
            </div>

            {modalSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{modalSuccess}</span>
              </div>
            )}

            {modalErr && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{modalErr}</span>
              </div>
            )}

            {activeModalTab === "templates" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {boilerplateTemplates.map((template) => {
                  const isConnected = apps.some(
                    (a) => a.id === template.id || a.name.toLowerCase() === template.name.toLowerCase()
                  );
                  const isConnecting = connectingId === template.id;

                  return (
                    <div
                      key={template.id}
                      className="p-4 rounded-2xl bg-black border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-2.5">
                          <div className="w-10 h-10 rounded-xl bg-[#070b14] border border-white/10 flex items-center justify-center p-1.5 shrink-0">
                            {template.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={template.logo} alt={template.name} className="w-7 h-7 object-contain" />
                            ) : (
                              <AppIcon iconType={template.iconType} />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white leading-tight">{template.name}</h4>
                            <p className="text-[11px] text-slate-400">{template.category}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                          {template.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={isConnected || isConnecting}
                        onClick={() => handleConnectTemplate(template.id)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          isConnected
                            ? "bg-white/5 border border-white/10 text-emerald-400 cursor-default"
                            : "bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-md shadow-cyan-500/20"
                        }`}
                      >
                        {isConnecting ? (
                          <>
                            <svg className="animate-spin h-3.5 w-3.5 text-slate-950" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Connecting...</span>
                          </>
                        ) : isConnected ? (
                          <span>Connected</span>
                        ) : (
                          <span>Connect Service</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <form onSubmit={handleAddCustom} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Application Name *</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Internal Payroll, CRM Portal"
                    className="w-full px-3 py-2 rounded-xl bg-black border border-white/20 text-xs text-white outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Enterprise HR, Finance"
                    className="w-full px-3 py-2 rounded-xl bg-black border border-white/20 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Auth Protocol</label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as IntegrationType)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-white/20 text-xs text-white outline-none focus:border-cyan-400"
                  >
                    <option value="sso_oauth">OAuth 2.0 / OpenID Connect</option>
                    <option value="saml">SAML 2.0 Web SSO</option>
                    <option value="rest_api">REST API / Bearer Token</option>
                    <option value="webhook">Webhook Integration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Launch / Login URL *</label>
                  <input
                    type="url"
                    value={customLoginUrl}
                    onChange={(e) => setCustomLoginUrl(e.target.value)}
                    placeholder="https://app.company.internal/login"
                    className="w-full px-3 py-2 rounded-xl bg-black border border-white/20 text-xs text-white outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Client ID / Entity ID</label>
                  <input
                    type="text"
                    value={customClientId}
                    onChange={(e) => setCustomClientId(e.target.value)}
                    placeholder="e.g. client_sentinel_8492"
                    className="w-full px-3 py-2 rounded-xl bg-black border border-white/20 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="enforceMfa"
                    checked={customMfaRequired}
                    onChange={(e) => setCustomMfaRequired(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-black text-cyan-400 accent-cyan-400 cursor-pointer"
                  />
                  <label htmlFor="enforceMfa" className="text-xs text-slate-300 cursor-pointer select-none">
                    Enforce Multi-Factor Authentication (MFA) before launch
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                  >
                    Register Application
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MFA Pairing Modal */}
      {pairingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0c1424] border border-cyan-500/30 p-6 sm:p-8 shadow-2xl text-white">
            <button
              type="button"
              onClick={() => setPairingModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
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

      {/* Account Profile Modal (Name Edit Only with Locked Credentials) */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Account Profile Settings</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Manage identity details and view credential permissions.</p>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {profileSuccess && (
              <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {profileError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Display Name <span className="text-cyan-400 font-normal">(Editable)</span>
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/20 text-xs text-white outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-400">Login Credential / Email</label>
                  <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Locked by IAM
                  </span>
                </div>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-400 outline-none cursor-not-allowed select-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Login credentials and emails are governed by Sentinel IAM policy and cannot be modified by account owners. Contact an administrator to request a credential update.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned Privilege Tier</label>
                <input
                  type="text"
                  value={user?.role || "USER"}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-400 outline-none cursor-not-allowed select-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-4 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {profileSaving ? "Saving..." : "Save Name"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Vector Icon Renderer for Services (Zero Emojis)
function AppIcon({ iconType }: { iconType?: string }) {
  switch (iconType) {
    case "acme-hr":
      return (
        <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      );
    case "fintech-payroll":
      return (
        <svg className="w-6 h-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      );
    case "devops-incident":
      return (
        <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
        </svg>
      );
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
