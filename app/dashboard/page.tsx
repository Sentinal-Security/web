"use client";

import { useState } from "react";

interface AppIntegration {
  id: string;
  name: string;
  category: string;
  logo: string;
  status: string;
  statusColor: string;
}

const DASHBOARD_APPS: AppIntegration[] = [
  {
    id: "anzora",
    name: "Anzora",
    category: "Zero-Trust Access Mesh",
    logo: "/images/logo-anzora.svg",
    status: "Active",
    statusColor: "bg-purple-400",
  },
  {
    id: "calyx",
    name: "Calyx Cloud",
    category: "SaaS Governance Suite",
    logo: "/images/logo-calyx.svg",
    status: "Protected",
    statusColor: "bg-emerald-400",
  },
  {
    id: "omniauth",
    name: "OmniAuth API",
    category: "Cloud Auth API Service",
    logo: "/images/logo-omniauth.svg",
    status: "Operational",
    statusColor: "bg-amber-400",
  },
  {
    id: "skyeagle",
    name: "SkyEagle",
    category: "Continuous Threat Radar",
    logo: "/images/logo-skyeagle.svg",
    status: "Live Sync",
    statusColor: "bg-cyan-400",
  },
];

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Admin Right-Side Panel State
  const [adminUsersPanelOpen, setAdminUsersPanelOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [fastCreateModalOpen, setFastCreateModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"USER" | "ADMIN">("USER");
  const [fastCreateErr, setFastCreateErr] = useState("");
  const [fastCreateSuccess, setFastCreateSuccess] = useState("");

  // Service Assignment Modal State
  const [assignModalUser, setAssignModalUser] = useState<AdminUser | null>(null);

  // Email Invitation Modal State
  const [inviteModalUser, setInviteModalUser] = useState<AdminUser | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

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
      setUser((prev) => prev ? { ...prev, fullName: editFullName.trim() } : prev);
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
    if (app.metrics.mfaRequired && user?.mfaEnabled) {
      setSelectedSsoApp(app);
      setSsoTotpCode("");
      setSsoError("");
      setSsoSuccess("");
      setSsoModalOpen(true);
      return;
    }

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

  // Fast User Creation for Admins
  const handleGeneratePassword = () => {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUserPassword(pass);
  };

  const handleFastCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFastCreateErr("");
    setFastCreateSuccess("");

    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword) {
      setFastCreateErr("All fields are required.");
      return;
    }

    if (newUserPassword.length < 6) {
      setFastCreateErr("Password must be at least 6 characters.");
      return;
    }

    const created = await adminCreateUserAction({
      fullName: newUserName.trim(),
      email: newUserEmail.trim(),
      password: newUserPassword,
      role: newUserRole,
    });

    if (created) {
      setFastCreateSuccess(`User ${created.email} created.`);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setTimeout(() => {
        setFastCreateModalOpen(false);
        setFastCreateSuccess("");
      }, 1500);
    }
  };

  // Service Assignment Toggle
  const handleToggleServiceAssignment = async (serviceId: number, serviceName: string) => {
    if (!assignModalUser) return;
    const isAssigned = assignModalUser.assignedServiceIds.includes(serviceId);

    if (isAssigned) {
      await adminRevokeService(assignModalUser.id, serviceId);
      setAssignModalUser((prev) =>
        prev
          ? {
              ...prev,
              assignedServicesCount: Math.max(0, prev.assignedServicesCount - 1),
              assignedServiceIds: prev.assignedServiceIds.filter((id) => id !== serviceId),
              assignedServiceNames: prev.assignedServiceNames.filter((name) => name !== serviceName),
            }
          : null
      );
    } else {
      await adminAssignService(assignModalUser.id, serviceId, serviceName);
      setAssignModalUser((prev) =>
        prev
          ? {
              ...prev,
              assignedServicesCount: prev.assignedServicesCount + 1,
              assignedServiceIds: [...prev.assignedServiceIds, serviceId],
              assignedServiceNames: [...prev.assignedServiceNames, serviceName],
            }
          : null
      );
    }
  };

  // Onboarding Email Template Generator
  const generateEmailInviteText = (u: AdminUser) => {
    return `Subject: Welcome to Sentinel IAM - Account Provisioning & Setup Instructions

Hello ${u.fullName || "Team Member"},

Your Sentinel IAM enterprise identity account has been provisioned.

Access Portal: https://sentinel.iam/login
Username: ${u.email}
Initial Security Role: ${u.role}
Assigned Services (${u.assignedServicesCount}): ${
      u.assignedServiceNames?.length > 0 ? u.assignedServiceNames.join(", ") : "Standard IAM Access"
    }

Next Steps:
1. Log in to the Access Portal using your email address and initial password.
2. Complete your multi-factor authentication (MFA) device pairing under Dashboard > Security.
3. Access your assigned enterprise applications directly via Single Sign-On (SSO).

Sentinel Security Directorate
Information Assurance System`;
  };

  const handleCopyEmailInvite = (u: AdminUser) => {
    navigator.clipboard.writeText(generateEmailInviteText(u));
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const handleDispatchEmail = () => {
    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setInviteModalUser(null);
    }, 1500);
  };

  const filteredApps = apps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAdminUsers = adminUsers.filter(
    (u) =>
      u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearchQuery.toLowerCase())
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
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono text-purple-300">
                    {adminUsers.length}
                  </span>
                </Link>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm transition-all cursor-pointer text-left border border-transparent hover:border-white/10"
                >
                  <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Service</span>
                </button>
              )}

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
                placeholder="Search services or protocols"
                className="bg-transparent text-xs sm:text-sm text-slate-200 placeholder-slate-400 outline-none w-full"
              />
              {searchQuery && (
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
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 relative">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setFastCreateModalOpen(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/40 text-purple-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Quick User</span>
                </button>

                <button
                  type="button"
                  onClick={exportCsv}
                  title="Export Users to CSV Spreadsheet"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminUsersPanelOpen((prev) => !prev)}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    adminUsersPanelOpen
                      ? "bg-purple-500/20 border-purple-400 text-purple-300"
                      : "bg-black border-white/10 text-slate-300 hover:text-white"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Users Panel</span>
                </button>
              </>
            )}

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

        {/* 2x2 Grid of Dashboard App Cards - Adjusted corner radius to rounded-2xl so it's not too roundy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 flex-1 w-full">
          {(filteredApps.length > 0 ? filteredApps : DASHBOARD_APPS).map((app) => (
            <div
              key={app.id}
              className="group bg-black rounded-2xl border border-cyan-500/40 p-6 sm:p-7 lg:p-8 min-h-[220px] sm:min-h-[250px] lg:min-h-[260px] shadow-[0_0_20px_rgba(6,182,212,0.06)] hover:border-cyan-400/70 hover:shadow-[0_0_26px_rgba(6,182,212,0.12)] transition-all flex flex-col justify-between cursor-pointer select-none"
            >
              {/* Card Top Row: Custom App Logo & Launch Arrow */}
              <div className="flex items-start justify-between">
                <div className="p-2 sm:p-2.5 rounded-xl bg-[#070b14] border border-white/5 group-hover:border-cyan-500/30 transition-all">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={app.logo}
                    alt={`${app.name} Logo`}
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                  />
                </div>

                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-cyan-300 group-hover:border-cyan-500/40 group-hover:bg-cyan-950/20 transition-all">
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
                </div>
              </div>

              {/* Card Bottom Area: App Name, Category, and Connection Pill */}
              <div className="mt-6 sm:mt-8">
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-[#38bdf8] transition-colors">
                  {app.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 font-normal mt-1">
                  {app.category}
                </p>

                <div className="mt-3.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#08152e] border border-cyan-500/25 text-cyan-300">
                  <span className={`w-1.5 h-1.5 rounded-full ${app.statusColor}`} />
                  <span>{app.status}</span>
                </div>
              </div>
            </div>
          ))}
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
