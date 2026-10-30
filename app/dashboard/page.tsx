"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, MfaSetupResponse } from "@/types/auth";
import { AppIntegration, IntegrationType } from "@/types/integration";
import { getStoredSession, updateStoredUser, clearSession } from "@/lib/session";
import { useMfa } from "@/hooks/useMfa";
import { useIntegrations } from "@/hooks/useIntegrations";
import {
  updateUserProfile,
  checkBackendHealth,
  getRecoveryCodesStatus,
  regenerateRecoveryCodes,
  getUserSessions,
  revokeUserSession,
  revokeUserOtherSessions,
  getOrganizationPolicy,
  changeUserPassword,
  getPersonalAuditLogs,
} from "@/lib/api";
import { SessionDto } from "@/types/admin";
import { SecurityAuditRecord } from "@/types/audit";
import { PasswordEntropyMeter } from "@/components/PasswordEntropyMeter";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";
import { InactivityWarningModal } from "@/components/session/InactivityWarningModal";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Gateway Connectivity & Standby Detection
  const [gatewayStatus, setGatewayStatus] = useState<"checking" | "online" | "cold_starting" | "offline">("checking");
  const [gatewayLatency, setGatewayLatency] = useState<number | null>(null);
  const [coldStartSeconds, setColdStartSeconds] = useState(0);
  const [showConnectedNotice, setShowConnectedNotice] = useState(false);

  const probeGateway = useCallback(async () => {
    try {
      const startTime = Date.now();
      const res = await checkBackendHealth();
      const latency = res.databasePingMs ?? (Date.now() - startTime);
      setGatewayLatency(latency);
      setGatewayStatus((prev) => {
        if (prev === "cold_starting") {
          setShowConnectedNotice(true);
          setTimeout(() => setShowConnectedNotice(false), 5000);
        }
        return "online";
      });
    } catch {
      setGatewayStatus("offline");
    }
  }, []);

  useEffect(() => {
    probeGateway();
  }, [probeGateway]);

  useEffect(() => {
    if (gatewayStatus === "online" || gatewayStatus === "offline") return;

    const timer = setInterval(() => {
      setColdStartSeconds((prev) => {
        const next = prev + 1;
        if (next >= 3 && gatewayStatus === "checking") {
          setGatewayStatus("cold_starting");
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gatewayStatus]);

  const retryGatewayConnection = () => {
    setGatewayStatus("checking");
    setColdStartSeconds(0);
    probeGateway();
  };

  const { setup, verifySetup, disable: disableMfaAction, loading: mfaLoading, error: mfaError, setError: setMfaError } = useMfa();
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState("");

  const handleConfirmDisableMfa = async () => {
    if (!user) return;
    setDisableLoading(true);
    setDisableError("");

    const res = await disableMfaAction(user.userId);
    setDisableLoading(false);
    if (res && res.success) {
      updateStoredUser({ mfaEnabled: false });
      setUser((prev) => (prev ? { ...prev, mfaEnabled: false } : null));
      setDisableModalOpen(false);
      setRecoveryCodes([]);
      setRemainingRecoveryCount(0);
    } else {
      setDisableError(res?.message || "Failed to disable Two-Factor Authentication.");
    }
  };

  // Recovery Codes State
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [remainingRecoveryCount, setRemainingRecoveryCount] = useState<number>(0);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryCopied, setRecoveryCopied] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState("");
  const [recoveryError, setRecoveryError] = useState("");

  const handleRegenerateCodes = async () => {
    if (!user) return;
    setRecoveryLoading(true);
    setRecoveryError("");
    setRecoverySuccess("");
    const res = await regenerateRecoveryCodes(user.userId);
    setRecoveryLoading(false);
    if (res.success && res.data) {
      setRecoveryCodes(res.data.recoveryCodes);
      setRemainingRecoveryCount(res.data.remainingCount);
      setRecoverySuccess("8 fresh emergency recovery codes generated. Previous codes have been invalidated.");
    } else {
      setRecoveryError(res.message || "Failed to regenerate recovery codes.");
    }
  };

  const handleCopyRecoveryCodes = () => {
    if (recoveryCodes.length === 0) return;
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setRecoveryCopied(true);
    setTimeout(() => setRecoveryCopied(false), 2000);
  };

  const handleDownloadRecoveryCodes = () => {
    if (recoveryCodes.length === 0) return;
    const content = `SENTINEL SECURITY - EMERGENCY MFA BACKUP RECOVERY CODES\nGenerated: ${new Date().toISOString()}\nAccount: ${user?.email || ""}\n\nKeep these single-use recovery codes in a secure location.\nEach code can only be used once.\n\n` + recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join("\n") + "\n";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sentinel-recovery-codes-${user?.email || "backup"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
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
  const [ssoToken, setSsoToken] = useState<string | null>(null);

  // Compliance Mandate & Active Sessions Governance
  const [mfaMandateActive, setMfaMandateActive] = useState(false);
  const [userSessionsModalOpen, setUserSessionsModalOpen] = useState(false);
  const [userSessions, setUserSessions] = useState<SessionDto[]>([]);
  const [userSessionsLoading, setUserSessionsLoading] = useState(false);
  const [revokingUserSessionId, setRevokingUserSessionId] = useState<number | null>(null);
  const [sessionFeedbackMsg, setSessionFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Self-Service Password Change
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [revokeOtherSessionsOnPasswordChange, setRevokeOtherSessionsOnPasswordChange] = useState(true);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState("");

  // Personal Security Activity Audit Feed
  const [auditFeedModalOpen, setAuditFeedModalOpen] = useState(false);
  const [personalAuditLogs, setPersonalAuditLogs] = useState<SecurityAuditRecord[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);

  useEffect(() => {
    const session = getStoredSession();
    if (!session || !session.user) {
      router.push("/login");
      return;
    }
    setUser(session.user);
    setEditFullName(session.user.fullName || "");
    if (session.token) {
      setSsoToken(session.token);
    }

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("setup_mfa") === "required") {
        setMfaMandateActive(true);
        if (!session.user.mfaEnabled) {
          setPairingModalOpen(true);
        }
      }
    }

    if (session.user.company) {
      getOrganizationPolicy(session.user.userId, session.user.company).then((res) => {
        if (res.success && res.data?.mfaEnforced) {
          setMfaMandateActive(true);
        }
      });
    }
  }, [router]);

  const loadUserSessions = useCallback(async () => {
    if (!user) return;
    setUserSessionsLoading(true);
    setSessionFeedbackMsg(null);
    const res = await getUserSessions(user.userId, ssoToken || undefined);
    setUserSessionsLoading(false);
    if (res.success && res.data) {
      setUserSessions(res.data);
    }
  }, [user, ssoToken]);

  const handleRevokeSingleUserSession = async (sessionId: number) => {
    if (!user) return;
    setRevokingUserSessionId(sessionId);
    const res = await revokeUserSession(sessionId, user.userId);
    setRevokingUserSessionId(null);
    if (res.success) {
      setUserSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setSessionFeedbackMsg({ type: "success", text: "Session terminated successfully." });
    } else {
      setSessionFeedbackMsg({ type: "error", text: res.message || "Failed to terminate session." });
    }
  };

  const handleRevokeAllOtherUserSessions = async () => {
    if (!user || !ssoToken) return;
    setUserSessionsLoading(true);
    const res = await revokeUserOtherSessions(user.userId, ssoToken);
    setUserSessionsLoading(false);
    if (res.success) {
      setUserSessions((prev) => prev.filter((s) => s.currentSession));
      setSessionFeedbackMsg({ type: "success", text: "All other sessions have been logged out." });
    } else {
      setSessionFeedbackMsg({ type: "error", text: res.message || "Failed to terminate other sessions." });
    }
  };

  const loadPersonalAudit = useCallback(async () => {
    if (!user) return;
    setAuditLogsLoading(true);
    const res = await getPersonalAuditLogs(user.userId, 25);
    setAuditLogsLoading(false);
    if (res.success && res.data) {
      setPersonalAuditLogs(res.data);
    }
  }, [user]);

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setChangePasswordError("");
    setChangePasswordSuccess("");

    if (!currentPasswordInput) {
      setChangePasswordError("Please enter your current password.");
      return;
    }
    if (!newPasswordInput) {
      setChangePasswordError("Please enter your new password.");
      return;
    }
    if (newPasswordInput.length < 8) {
      setChangePasswordError("New password must be at least 8 characters long.");
      return;
    }
    const hasUpper = /[A-Z]/.test(newPasswordInput);
    const hasLower = /[a-z]/.test(newPasswordInput);
    const hasDigit = /[0-9]/.test(newPasswordInput);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?`~]/.test(newPasswordInput);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      setChangePasswordError("New password must include uppercase, lowercase, a digit, and a special character.");
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setChangePasswordError("New passwords do not match.");
      return;
    }

    setChangePasswordLoading(true);
    const res = await changeUserPassword({
      userId: user.userId,
      currentPassword: currentPasswordInput,
      newPassword: newPasswordInput,
      revokeOtherSessions: revokeOtherSessionsOnPasswordChange,
      currentToken: ssoToken || undefined,
    });
    setChangePasswordLoading(false);

    if (res.success) {
      setChangePasswordSuccess(res.message || "Password changed successfully.");
      setCurrentPasswordInput("");
      setNewPasswordInput("");
      setConfirmPasswordInput("");
    } else {
      setChangePasswordError(res.message || "Failed to update password.");
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  const handleInactivityTimeout = useCallback(() => {
    clearSession();
    router.push("/login?reason=inactivity_timeout");
  }, [router]);

  const {
    isWarningOpen: isInactivityWarningOpen,
    secondsRemaining: inactivitySecondsRemaining,
    extendSession: extendInactivitySession,
  } = useInactivityTimeout({
    timeoutMinutes: 15,
    warningSeconds: 60,
    onTimeout: handleInactivityTimeout,
    enabled: Boolean(user),
  });

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

      if (res.recoveryCodes && res.recoveryCodes.length > 0) {
        setRecoveryCodes(res.recoveryCodes);
        setRemainingRecoveryCount(res.recoveryCodes.length);
        setRecoverySuccess("MFA activated! Please save your 8 single-use emergency recovery codes below.");
      }

      setTimeout(() => {
        setPairingModalOpen(false);
        setSetupData(null);
        setTotpCode("");
        if (res.recoveryCodes && res.recoveryCodes.length > 0) {
          setRecoveryModalOpen(true);
        }
      }, 1200);
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
    <div className="min-h-screen w-full relative flex text-white font-sans antialiased selection:bg-cyan-500/30 selection:text-white bg-[#050811]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 w-64 sm:w-72 md:w-[260px] bg-slate-950 md:bg-[#070b16] self-stretch min-h-screen shrink-0 border-r border-white/10 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="sticky top-0 flex flex-col justify-between h-screen pt-7 pb-6 px-4 sm:px-5 w-full">
          <div>
            {/* Brand Logo & Tenant Badge */}
            <div className="flex items-center gap-3 select-none px-2 mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Sentinel Logo"
                className="w-8 h-8 rounded-lg object-contain"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-base font-bold tracking-wider text-white truncate font-orbitron">
                  Sentinel IAM
                </span>
                {isAdmin ? (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold uppercase tracking-wider w-max mt-0.5">
                    Administrator
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 truncate font-mono">
                    {user?.company ? `@${user.company}` : "Employee Portal"}
                  </span>
                )}
              </div>
            </div>

            {/* Primary Navigation */}
            <div className="w-full space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Workspace
              </div>

              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-medium text-xs transition-all cursor-pointer text-left"
              >
                <svg
                  className="w-4 h-4 text-cyan-400 shrink-0"
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
                <span>Applications</span>
              </button>

              {isAdmin && (
                <>
                  <Link
                    href="/users"
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left border border-transparent hover:border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>User Directory</span>
                    </div>
                  </Link>

                  <Link
                    href="/users?tab=audit"
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left border border-transparent hover:border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Audit Logs</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                      Live
                    </span>
                  </Link>
                </>
              )}

              {/* Developer & Integration */}
              <div className="pt-4 px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Developer &amp; SSO
              </div>

              <Link
                href="/docs"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white font-medium text-xs transition-all text-left border border-transparent hover:border-white/10"
              >
                <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span>API &amp; Docs</span>
              </Link>

              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white font-medium text-xs transition-all text-left border border-transparent hover:border-white/10 cursor-pointer"
              >
                <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Connect Service</span>
              </button>

              {/* Security & Device */}
              <div className="pt-4 px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Security &amp; MFA
              </div>

              <button
                type="button"
                onClick={handleOpenPairingModal}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white font-medium text-xs transition-all cursor-pointer text-left border border-transparent hover:border-white/10"
              >
                <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Pair Mobile 2FA</span>
              </button>

              <Link
                href="/download"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white font-medium text-xs transition-all text-left border border-transparent hover:border-white/10"
              >
                <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
                <span>Download Sentinel App</span>
              </Link>

              {/* Billing & Subscription Plan */}
              <div className="pt-4 px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Subscription &amp; Tier
              </div>

              <Link
                href="/pricing"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white font-medium text-xs transition-all text-left border border-transparent hover:border-white/10"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>Plan &amp; Billing</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase font-bold">
                  {user?.subscriptionTier || "COMMUNITY"}
                </span>
              </Link>
            </div>
          </div>

          {/* Bottom Utility Area */}
          <div className="pt-3 border-t border-white/10 space-y-1">
            <Link
              href="/terms"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 transition-colors text-xs font-medium"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Terms &amp; Agreements</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors text-xs font-medium cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        {/* Backend Cold Start / Gateway Status Banner */}
        {gatewayStatus === "cold_starting" && (
          <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <div>
                <span className="font-semibold text-amber-300">Backend API Gateway Cold Start</span>
                <span className="text-slate-400 mx-2 hidden sm:inline">•</span>
                <span className="text-slate-300 text-[11px]">
                  Free Render instance is resuming from inactivity standby ({coldStartSeconds}s elapsed). Services and MFA challenges may take up to 60s to respond.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-amber-400 font-mono shrink-0">
              <svg className="animate-spin h-3.5 w-3.5 text-amber-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Waking container...</span>
            </div>
          </div>
        )}

        {gatewayStatus === "offline" && (
          <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
              <div>
                <span className="font-semibold text-red-300">Backend API Gateway Unreachable</span>
                <span className="text-slate-400 mx-2 hidden sm:inline">•</span>
                <span className="text-slate-300 text-[11px]">
                  Unable to connect to the central authentication service. Retrying in background...
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={retryGatewayConnection}
              className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-medium transition-colors cursor-pointer shrink-0"
            >
              Retry Connection
            </button>
          </div>
        )}

        {showConnectedNotice && (
          <div className="mb-4 px-3.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="font-semibold text-emerald-300">Backend Gateway Connected</span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-slate-300 text-[11px]">
                Central API and Supabase PostgreSQL operational {gatewayLatency ? `(${gatewayLatency}ms)` : ""}.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowConnectedNotice(false)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Dismiss notice"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Organization MFA Mandate Policy Alert Banner */}
        {mfaMandateActive && !user?.mfaEnabled && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold text-amber-300">Organization Compliance Mandate: Multi-Factor Authentication Required</p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Your enterprise administrator enforces Multi-Factor Authentication (MFA) for all accounts at <span className="font-mono text-amber-300">{user?.company || "your organization"}</span>. Access to single sign-on applications is restricted until an authenticator device is paired.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenPairingModal}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 cursor-pointer transition-colors"
            >
              Pair Device Now
            </button>
          </div>
        )}

        {/* Top Header */}
        <header className="flex items-center justify-between gap-3 sm:gap-4 w-full">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-[280px] sm:max-w-xs md:max-w-md">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
              aria-label="Open sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="relative flex items-center bg-slate-900/60 rounded-lg px-3 py-1.5 w-full border border-white/10 focus-within:border-cyan-500/40 transition-colors">
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
            {/* Gateway Status Badge */}
            <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-white/10 text-[11px] text-slate-300 font-mono">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  gatewayStatus === "online"
                    ? "bg-emerald-400"
                    : gatewayStatus === "cold_starting"
                    ? "bg-amber-400 animate-pulse"
                    : "bg-red-400"
                }`}
              />
              <span className="text-slate-400">Gateway:</span>
              <span
                className={
                  gatewayStatus === "online"
                    ? "text-emerald-400"
                    : gatewayStatus === "cold_starting"
                    ? "text-amber-300"
                    : "text-red-400"
                }
              >
                {gatewayStatus === "online"
                  ? gatewayLatency
                    ? `${gatewayLatency}ms`
                    : "Online"
                  : gatewayStatus === "cold_starting"
                  ? "Standby Wake"
                  : "Offline"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Configure Apps</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 bg-slate-900/60 py-1 pl-1 pr-2.5 rounded-lg border border-white/10 cursor-pointer hover:border-white/20 transition-colors select-none"
              >
                <div className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xs font-semibold text-cyan-300 uppercase shrink-0">
                  {displayName.charAt(0)}
                </div>
                <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[120px]">{displayName}</span>
                <svg className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-950 border border-white/10 shadow-2xl p-3 z-50">
                  <div className="px-3 py-2 border-b border-white/10 mb-2">
                    <p className="text-xs font-semibold text-white truncate">{user?.fullName || displayName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-purple-400 uppercase font-mono font-medium">
                        Role: {user?.role || "USER"}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase font-bold">
                        {user?.subscriptionTier || "COMMUNITY"}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/pricing"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-between cursor-pointer mb-1"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span>Subscription &amp; Plans</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-medium">Manage</span>
                  </Link>

                  <div className="px-3 py-1 mb-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">MFA Status</span>
                    <span className={`font-medium px-2 py-0.5 rounded text-[10px] ${user?.mfaEnabled ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"}`}>
                      {user?.mfaEnabled ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setAddModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer mb-1"
                  >
                    <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer mb-1"
                  >
                    <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span>Edit Profile Name</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setUserSessionsModalOpen(true);
                      loadUserSessions();
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-between cursor-pointer mb-1"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Active Sessions &amp; Devices</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Manage</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setChangePasswordError("");
                      setChangePasswordSuccess("");
                      setCurrentPasswordInput("");
                      setNewPasswordInput("");
                      setConfirmPasswordInput("");
                      setChangePasswordModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-between cursor-pointer mb-1"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <span>Change Password</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Security</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setAuditFeedModalOpen(true);
                      loadPersonalAudit();
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-between cursor-pointer mb-1"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Security Activity Log</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Audit</span>
                  </button>

                  {user?.mfaEnabled ? (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          setProfileDropdownOpen(false);
                          setRecoveryModalOpen(true);
                          setRecoveryError("");
                          setRecoverySuccess("");
                          if (user) {
                            setRecoveryLoading(true);
                            const res = await getRecoveryCodesStatus(user.userId);
                            setRecoveryLoading(false);
                            if (res.success && res.data) {
                              setRemainingRecoveryCount(res.data.remainingCount);
                            }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-amber-300 hover:bg-amber-500/10 transition-colors flex items-center gap-2 cursor-pointer mb-1"
                      >
                        <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        <span>MFA Recovery Codes</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setDisableError("");
                          setDisableModalOpen(true);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        <span>Disable 2FA</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleOpenPairingModal();
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Enable 2FA (Pair App)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 cursor-pointer mt-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Consolidated Section Header & Actions */}
        <div className="mt-6 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold text-white tracking-tight">Applications</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-white/5 border border-white/10 text-slate-300">
                {apps.length} active
              </span>
              {isAdmin && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 border border-purple-400/30 text-purple-300 font-semibold uppercase">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Enterprise single sign-on directory for <span className="text-slate-300 font-mono">{user?.email || "internal tenant"}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {user?.mfaEnabled ? (
              <button
                type="button"
                onClick={() => {
                  setDisableError("");
                  setDisableModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                title="2-Factor Authentication is active. Click to disable."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>2FA: ON</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenPairingModal}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                title="2-Factor Authentication is disabled. Click to pair device."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>2FA: OFF (Pair)</span>
              </button>
            )}

            <Link
              href="/docs"
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span>API Docs</span>
            </Link>

            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Application</span>
            </button>
          </div>
        </div>

        {/* Dynamic Content: Loading vs Empty State vs Configured Services Grid */}
        {servicesLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 text-center">
            {gatewayStatus === "cold_starting" ? (
              <>
                <svg className="animate-spin h-7 w-7 text-amber-400 mb-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xs font-semibold text-white">Backend Gateway Cold Start in Progress</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm leading-relaxed">
                  The Render cloud container is resuming from standby ({coldStartSeconds}s elapsed). Loaded services will appear automatically.
                </p>
              </>
            ) : (
              <>
                <svg className="animate-spin h-6 w-6 text-cyan-400 mb-2.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xs">Loading configured applications...</p>
              </>
            )}
          </div>
        ) : filteredApps.length === 0 ? (
          /* Clean Empty State (Newly Created Accounts Start Clean) */
          <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 rounded-xl bg-slate-900/20 border border-dashed border-white/10 text-center min-h-[300px]">
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-white tracking-tight">No Applications Configured</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
              Your account currently has no active integrations. Connect an enterprise template or register a custom application.
            </p>

            {/* Quick 1-Click Template Accelerators */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {boilerplateTemplates.slice(0, 3).map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  disabled={connectingId === tpl.id}
                  onClick={() => handleConnectTemplate(tpl.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-medium text-slate-200 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>+ Add {tpl.name}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
              >
                Browse All Templates
              </button>
            </div>
          </div>
        ) : (
          /* Configured Services Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 w-full">
            {filteredApps.map((app) => {
              const isExternal = Boolean(app.loginUrl && (app.loginUrl.startsWith("http://") || app.loginUrl.startsWith("https://")));
              const tokenParam = ssoToken ? `&ssoToken=${ssoToken}` : "";
              const launchHref = isExternal && app.loginUrl && user?.userId
                ? `${app.loginUrl}${app.loginUrl.includes("?") ? "&" : "?"}ssoUserId=${user.userId}&ssoEmail=${encodeURIComponent(user.email || "")}${tokenParam}`
                : (app.loginUrl || `/apps/${app.id}`);
              return (
                <div
                  key={app.id}
                  className="group relative bg-slate-900/30 hover:bg-slate-900/60 border border-white/10 hover:border-cyan-500/40 rounded-xl p-4 transition-all flex flex-col justify-between"
                >
                  {/* Card Top Row: Custom App Logo & Actions */}
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-lg bg-slate-950 border border-white/10 flex items-center justify-center p-1.5 shrink-0">
                      {app.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={app.logo}
                          alt={`${app.name} Logo`}
                          className="w-6 h-6 object-contain"
                        />
                      ) : (
                        <div className="w-6 h-6 flex items-center justify-center">
                          <AppIcon iconType={app.iconType} />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => removeApp(app.id)}
                        title="Remove integration"
                        className="w-7 h-7 rounded-md bg-white/5 border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      <Link
                        href={launchHref}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        className="w-7 h-7 rounded-md bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-300 flex items-center justify-center transition-colors cursor-pointer"
                        title="Launch service"
                      >
                        <svg
                          className="w-3.5 h-3.5"
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
                  <div className="mt-4">
                    <Link
                      href={launchHref}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                    >
                      <h3 className="text-sm font-semibold text-white tracking-tight group-hover:text-cyan-300 transition-colors cursor-pointer truncate">
                        {app.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {app.category}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 border border-white/10 text-slate-300">
                        <span className={`w-1.5 h-1.5 rounded-full ${app.statusColor || "bg-cyan-400"}`} />
                        <span>{app.status || "Active"}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Logins: {app.metrics?.totalLogins || 0}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Configure / Add Application Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-xl bg-slate-950 border border-white/10 p-5 sm:p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-5">
              <h3 className="text-base font-semibold tracking-tight text-white">Configure Applications</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Select enterprise templates or register custom applications to add them to your dashboard.
              </p>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-5">
              <button
                type="button"
                onClick={() => setActiveModalTab("templates")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeModalTab === "templates"
                    ? "bg-cyan-500 text-slate-950 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Enterprise Templates
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab("custom")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeModalTab === "custom"
                    ? "bg-cyan-500 text-slate-950 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Custom Integration
              </button>
            </div>

            {modalSuccess && (
              <div className="mb-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{modalSuccess}</span>
              </div>
            )}

            {modalErr && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{modalErr}</span>
              </div>
            )}

            {activeModalTab === "templates" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {boilerplateTemplates.map((template) => {
                  const isConnected = apps.some(
                    (a) => a.id === template.id || a.name.toLowerCase() === template.name.toLowerCase()
                  );
                  const isConnecting = connectingId === template.id;

                  return (
                    <div
                      key={template.id}
                      className="p-3.5 rounded-lg bg-slate-900/40 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-950 border border-white/10 flex items-center justify-center p-1 shrink-0">
                            {template.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={template.logo} alt={template.name} className="w-5 h-5 object-contain" />
                            ) : (
                              <AppIcon iconType={template.iconType} />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-white leading-tight">{template.name}</h4>
                            <p className="text-[10px] text-slate-400">{template.category}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                          {template.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={isConnected || isConnecting}
                        onClick={() => handleConnectTemplate(template.id)}
                        className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                          isConnected
                            ? "bg-white/5 border border-white/10 text-emerald-400 cursor-default"
                            : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
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
              <form onSubmit={handleAddCustom} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Application Name *</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Internal Payroll, CRM Portal"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-500/60"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Enterprise HR, Finance"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Auth Protocol</label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as IntegrationType)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-500/60"
                  >
                    <option value="sso_oauth">OAuth 2.0 / OpenID Connect</option>
                    <option value="saml">SAML 2.0 Web SSO</option>
                    <option value="rest_api">REST API / Bearer Token</option>
                    <option value="webhook">Webhook Integration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Launch / Login URL *</label>
                  <input
                    type="url"
                    value={customLoginUrl}
                    onChange={(e) => setCustomLoginUrl(e.target.value)}
                    placeholder="https://app.company.internal/login"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-500/60"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Client ID / Entity ID</label>
                  <input
                    type="text"
                    value={customClientId}
                    onChange={(e) => setCustomClientId(e.target.value)}
                    placeholder="e.g. client_sentinel_8492"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-500/60"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="enforceMfa"
                    checked={customMfaRequired}
                    onChange={(e) => setCustomMfaRequired(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-400 accent-cyan-500 cursor-pointer"
                  />
                  <label htmlFor="enforceMfa" className="text-xs text-slate-300 cursor-pointer select-none">
                    Enforce Multi-Factor Authentication (MFA) before launch
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-xl bg-slate-950 border border-white/10 p-5 sm:p-6 shadow-2xl text-white">
            <button
              type="button"
              onClick={() => setPairingModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-5">
              <div className="inline-flex p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-2.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold tracking-tight text-white">Pair Mobile Authenticator</h3>
              <p className="text-xs text-slate-400 mt-1">
                Scan the QR code with your mobile authenticator app or enter the manual pairing key.
              </p>
            </div>

            {(pairingValidationErr || mfaError) && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{pairingValidationErr || mfaError}</span>
              </div>
            )}

            {pairingSuccess && (
              <div className="mb-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{pairingSuccess}</span>
              </div>
            )}

            {mfaLoading && !setupData ? (
              <div className="py-10 flex flex-col items-center justify-center gap-2.5">
                <svg className="animate-spin h-6 w-6 text-cyan-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xs text-slate-400">Generating secure pairing secret...</p>
              </div>
            ) : setupData ? (
              <div className="space-y-3.5">
                {setupData.otpAuthUri && (
                  <div className="flex flex-col items-center p-3 rounded-xl bg-slate-900 border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setupData.otpAuthUri)}`}
                      alt="Authenticator QR Code"
                      className="w-36 h-36 rounded-lg bg-white p-2 object-contain"
                    />
                    <span className="text-[11px] text-slate-400 mt-2 font-mono">{setupData.accountEmail || user?.email}</span>
                  </div>
                )}

                {setupData.secretKey && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Manual Secret Key
                    </label>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-white/10">
                      <code className="text-xs text-cyan-300 font-mono tracking-wider flex-1 truncate">
                        {setupData.secretKey}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-colors cursor-pointer shrink-0"
                      >
                        {copiedKey ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleVerifyPairing} className="pt-1">
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
                    className="w-full text-center text-lg tracking-[0.3em] font-mono font-bold bg-slate-900 border border-white/15 rounded-lg py-2 text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-colors mb-3.5"
                  />

                  <button
                    type="submit"
                    disabled={mfaLoading || !!pairingSuccess}
                    className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {mfaLoading ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-slate-950" viewBox="0 0 24 24" fill="none">
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

                <div className="mt-3 pt-3 border-t border-slate-800 text-center">
                  <Link
                    href="/download"
                    target="_blank"
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors inline-flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    <span>Need the app? Download Sentinel Authenticator APK</span>
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 2FA Disable Confirmation Modal */}
      {disableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0d1522] border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Disable Two-Factor Authentication</h3>
                <p className="text-xs text-slate-400 mt-0.5">MFA Security Policy Adjustment</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Are you sure you want to turn off 2FA for <span className="font-mono text-cyan-300">{user?.email}</span>?
            </p>
            <div className="p-3 bg-amber-950/30 border border-amber-500/20 rounded-xl text-[11px] text-amber-200/90 leading-relaxed mb-6">
              Disabling 2FA will delete your paired secret key. Subsequent sign-ins will only require your password without secondary authenticator challenge.
            </div>

            {disableError && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {disableError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={disableLoading}
                onClick={() => setDisableModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                Keep 2FA Enabled
              </button>
              <button
                type="button"
                disabled={disableLoading}
                onClick={handleConfirmDisableMfa}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {disableLoading ? "Disabling..." : "Confirm & Turn Off 2FA"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Profile Modal (Name Edit Only with Locked Credentials) */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-white/10 rounded-xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Account Profile Settings</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Manage identity details and view credential permissions.</p>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {profileSuccess && (
              <div className="mb-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {profileError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Account Display Name <span className="text-cyan-400 font-normal">(Editable)</span>
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-500/60"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-400">Login Credential / Email</label>
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
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/5 text-xs text-slate-400 outline-none cursor-not-allowed select-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Login credentials and emails are governed by Sentinel IAM policy and cannot be modified by account owners. Contact an administrator to request a credential update.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Assigned Privilege Tier</label>
                <input
                  type="text"
                  value={user?.role || "USER"}
                  disabled
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/5 text-xs text-slate-400 outline-none cursor-not-allowed select-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {profileSaving ? "Saving..." : "Save Name"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency MFA Backup Recovery Codes Modal */}
      {recoveryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-amber-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Emergency MFA Backup Recovery Codes</h3>
                  <p className="text-[11px] text-slate-400">Single-use disaster recovery authentication tokens</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRecoveryModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Store these emergency recovery codes in a secure password manager. If you lose, damage, or wipe your paired mobile device, each code can be used <span className="text-amber-400 font-semibold">exactly once</span> to bypass the MFA challenge and unlock your account.
            </p>

            {recoverySuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {recoverySuccess}
              </div>
            )}
            {recoveryError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {recoveryError}
              </div>
            )}

            {recoveryCodes.length > 0 ? (
              <div className="mb-5">
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 grid grid-cols-2 gap-2 mb-3">
                  {recoveryCodes.map((code, idx) => (
                    <div
                      key={code}
                      className="p-2 rounded-lg bg-slate-950 border border-white/5 font-mono text-center font-bold text-xs tracking-wider text-amber-300 select-all"
                    >
                      <span className="text-slate-500 mr-1.5 text-[10px] select-none font-normal">#{idx + 1}</span>
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyRecoveryCodes}
                    className="flex-1 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-white/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{recoveryCopied ? "Copied to Clipboard!" : "Copy All Codes"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadRecoveryCodes}
                    className="flex-1 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-white/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download .txt</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-5 p-4 rounded-xl bg-slate-900/60 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-300">Active Unused Recovery Codes:</span>
                  <span className="text-sm font-mono font-bold text-amber-400">
                    {recoveryLoading ? "Checking..." : `${remainingRecoveryCount} of 8 remaining`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                  For security, individual code values cannot be displayed again once dismissed. If you misplaced your codes, generate a new set of 8 codes below.
                </p>
                <button
                  type="button"
                  disabled={recoveryLoading}
                  onClick={handleRegenerateCodes}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {recoveryLoading ? (
                    <span>Regenerating codes...</span>
                  ) : (
                    <span>Generate 8 New Emergency Codes</span>
                  )}
                </button>
              </div>
            )}

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setRecoveryModalOpen(false)}
                className="py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Sessions Governance Modal */}
      {userSessionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-950 border border-white/10 rounded-2xl shadow-2xl p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="text-base font-bold text-white">Active Sessions &amp; Connected Devices</h3>
              </div>
              <button
                type="button"
                onClick={() => setUserSessionsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="py-3 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5">
              <p className="text-xs text-slate-400">
                Manage your authenticated sessions across web browsers and client applications.
              </p>
              {userSessions.filter((s) => !s.currentSession).length > 0 && (
                <button
                  type="button"
                  disabled={userSessionsLoading}
                  onClick={handleRevokeAllOtherUserSessions}
                  className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-semibold shrink-0 cursor-pointer transition-colors disabled:opacity-50"
                >
                  Terminate All Other Sessions
                </button>
              )}
            </div>

            {sessionFeedbackMsg && (
              <div
                className={`my-3 p-3 rounded-xl text-xs shrink-0 ${
                  sessionFeedbackMsg.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border border-red-500/30 text-red-300"
                }`}
              >
                {sessionFeedbackMsg.text}
              </div>
            )}

            <div className="overflow-y-auto space-y-2.5 py-4 flex-1">
              {userSessionsLoading && userSessions.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading active session telemetry...</div>
              ) : userSessions.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No active sessions found.</div>
              ) : (
                userSessions.map((s) => (
                  <div
                    key={s.id}
                    className={`p-3.5 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      s.currentSession
                        ? "bg-cyan-950/20 border-cyan-500/40"
                        : "bg-slate-900/60 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-white">
                            {s.userAgent
                              ? s.userAgent.includes("Firefox")
                                ? "Mozilla Firefox"
                                : s.userAgent.includes("Edg")
                                ? "Microsoft Edge"
                                : s.userAgent.includes("Chrome")
                                ? "Google Chrome"
                                : s.userAgent.includes("Safari")
                                ? "Apple Safari"
                                : "Web Browser"
                              : "Web Client"}
                          </span>
                          {s.currentSession ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              Current Session
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                              Active Remote
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono flex-wrap">
                          <span>IP: {s.clientIp || "Direct Gateway"}</span>
                          <span>•</span>
                          <span>Origin: {s.clientOrigin || "Sentinel Portal"}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Established: {new Date(s.createdAt).toLocaleString()} (Valid until {new Date(s.expiresAt).toLocaleTimeString()})
                        </p>
                      </div>
                    </div>

                    {!s.currentSession && (
                      <button
                        type="button"
                        disabled={revokingUserSessionId === s.id}
                        onClick={() => handleRevokeSingleUserSession(s.id)}
                        className="self-end sm:self-center px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {revokingUserSessionId === s.id ? "Terminating..." : "Terminate"}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-white/10 shrink-0 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                {userSessions.length} total active session{userSessions.length === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={() => setUserSessionsModalOpen(false)}
                className="py-1.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Self-Service Password Change Modal */}
      {changePasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-950 border border-white/10 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <h3 className="text-base font-bold text-white">Change Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setChangePasswordModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-3 mb-4 leading-relaxed">
              Verify your current password and establish a new credential meeting enterprise complexity standards.
            </p>

            {changePasswordError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {changePasswordError}
              </div>
            )}

            {changePasswordSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {changePasswordSuccess}
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Min. 8 characters (mixed case, digit, symbol)"
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <PasswordEntropyMeter password={newPasswordInput} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={revokeOtherSessionsOnPasswordChange}
                    onChange={(e) => setRevokeOtherSessionsOnPasswordChange(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 bg-slate-900 text-cyan-500 focus:ring-0"
                  />
                  <span className="text-[11px] text-slate-300 leading-snug">
                    Terminate all other active sessions and remote devices upon password update
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setChangePasswordModalOpen(false)}
                  className="py-2 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changePasswordLoading}
                  className="py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {changePasswordLoading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-slate-950" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Personal Security Activity Log Modal */}
      {auditFeedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-950 border border-white/10 rounded-2xl shadow-2xl p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-base font-bold text-white">Security Activity &amp; Audit Trail</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadPersonalAudit}
                  disabled={auditLogsLoading}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-mono transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  title="Refresh activity logs"
                >
                  <svg className={`w-3.5 h-3.5 ${auditLogsLoading ? "animate-spin text-cyan-400" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuditFeedModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 py-3 border-b border-white/5 shrink-0">
              Detailed audit trail of authentication events, MFA challenges, password updates, and session governance for your account.
            </p>

            <div className="overflow-y-auto space-y-2 py-3 flex-1">
              {auditLogsLoading && personalAuditLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading security audit records...</div>
              ) : personalAuditLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No security audit records logged yet.</div>
              ) : (
                personalAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-white/10 transition-colors text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-white">
                          {log.actionType}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                            log.severity === "CRITICAL" || log.severity === "SECURITY_ALERT"
                              ? "bg-red-500/10 text-red-400 border border-red-500/30"
                              : log.severity === "WARNING" || log.severity === "WARN"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                          }`}
                        >
                          {log.severity}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.createdAt}
                      </span>
                    </div>

                    <p className="text-slate-300 text-[11px] mb-1.5 leading-relaxed">
                      {log.details || "No additional event details."}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono flex-wrap">
                      <span>Resource: {log.targetResource || "IAM Portal"}</span>
                      {log.ipAddress && (
                        <>
                          <span>•</span>
                          <span>IP: {log.ipAddress}</span>
                        </>
                      )}
                      {log.userAgent && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[200px]" title={log.userAgent}>
                            {log.userAgent}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-white/10 shrink-0 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                {personalAuditLogs.length} event record{personalAuditLogs.length === 1 ? "" : "s"} shown
              </span>
              <button
                type="button"
                onClick={() => setAuditFeedModalOpen(false)}
                className="py-1.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zero-Trust Inactivity Timeout Countdown Modal */}
      <InactivityWarningModal
        isOpen={isInactivityWarningOpen}
        secondsRemaining={inactivitySecondsRemaining}
        onExtend={extendInactivitySession}
        onLogout={handleLogout}
      />
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
