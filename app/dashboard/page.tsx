"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, MfaSetupResponse } from "@/types/auth";
import { AppIntegration, IntegrationType } from "@/types/integration";
import { getStoredSession, updateStoredUser, clearSession } from "@/lib/session";
import { useMfa } from "@/hooks/useMfa";
import { useIntegrations } from "@/hooks/useIntegrations";
import { resolveServiceUrl } from "@/lib/integrations";
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
  validateSsoSession,
  launchUserService,
  initiateMfaChallenge,
  getMfaChallengeStatus,
  updateMfaPreference,
  verifyMfaLogin,
} from "@/lib/api";
import { SessionDto } from "@/types/admin";
import { SecurityAuditRecord } from "@/types/audit";
import { PasswordEntropyMeter } from "@/components/PasswordEntropyMeter";
import { PasswordToggleAdornment } from "@/components/PasswordToggleAdornment";
import { WorkstationOnboardingModal } from "@/components/WorkstationOnboardingModal";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";
import { InactivityWarningModal } from "@/components/session/InactivityWarningModal";

export interface SidebarPreferences {
  applications: boolean;
  userDirectory: boolean;
  auditLogs: boolean;
  apiDocs: boolean;
  connectService: boolean;
  mobileMfa: boolean;
  downloadApp: boolean;
  planBilling: boolean;
  termsAgreements: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Sidebar Collapse & Nav Customization State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [navCustomizerOpen, setNavCustomizerOpen] = useState(false);
  const [sidebarPrefs, setSidebarPrefs] = useState<SidebarPreferences>({
    applications: true,
    userDirectory: true,
    auditLogs: true,
    apiDocs: true,
    connectService: true,
    mobileMfa: true,
    downloadApp: true,
    planBilling: true,
    termsAgreements: true,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sentinel_sidebar_collapsed");
      if (saved !== null) {
        setSidebarCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sentinel_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (!user) return;
    try {
      const saved = localStorage.getItem(`sentinel_sidebar_prefs_${user.userId}`);
      if (saved) {
        setSidebarPrefs(JSON.parse(saved));
      } else {
        const isEmp = Boolean(user.company && user.company.toLowerCase() !== "personal" && user.role !== "ADMIN");
        const isAdm = user.role === "ADMIN";
        if (isEmp) {
          setSidebarPrefs({
            applications: true,
            userDirectory: false,
            auditLogs: false,
            apiDocs: false,
            connectService: false,
            mobileMfa: true,
            downloadApp: true,
            planBilling: false,
            termsAgreements: true,
          });
        } else if (isAdm) {
          setSidebarPrefs({
            applications: true,
            userDirectory: true,
            auditLogs: true,
            apiDocs: true,
            connectService: true,
            mobileMfa: true,
            downloadApp: true,
            planBilling: true,
            termsAgreements: true,
          });
        } else {
          setSidebarPrefs({
            applications: true,
            userDirectory: false,
            auditLogs: false,
            apiDocs: true,
            connectService: true,
            mobileMfa: true,
            downloadApp: true,
            planBilling: true,
            termsAgreements: true,
          });
        }
      }
    } catch {}
  }, [user]);

  const updateSidebarPrefs = (newPrefs: SidebarPreferences) => {
    setSidebarPrefs(newPrefs);
    if (user?.userId) {
      try {
        localStorage.setItem(`sentinel_sidebar_prefs_${user.userId}`, JSON.stringify(newPrefs));
      } catch {}
    }
  };

  // Gateway Connectivity & Standby Detection
  const [gatewayStatus, setGatewayStatus] = useState<"checking" | "online" | "cold_starting" | "offline">("checking");
  const [gatewayLatency, setGatewayLatency] = useState<number | null>(null);
  const [coldStartSeconds, setColdStartSeconds] = useState(0);
  const [showConnectedNotice, setShowConnectedNotice] = useState(false);

  const probeGateway = useCallback(async () => {
    if (typeof window !== "undefined" && !navigator.onLine) {
      setGatewayStatus("offline");
      return;
    }
    try {
      const startTime = Date.now();
      const res = await checkBackendHealth();
      const latency = res.databasePingMs ?? (Date.now() - startTime);
      setGatewayLatency(latency);
      setGatewayStatus((prev) => {
        if (prev === "cold_starting" || prev === "offline") {
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

    // 10-second periodic heartbeat to continuously monitor and reflect system/backend status in real-time
    const heartbeat = setInterval(() => {
      probeGateway();
    }, 10000);

    const handleOnline = () => {
      setGatewayStatus("checking");
      probeGateway();
    };
    const handleOffline = () => {
      setGatewayStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
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

  // 2FA Delivery Method Preference State
  const [mfaMethodModalOpen, setMfaMethodModalOpen] = useState(false);
  const [preferredMfaMethod, setPreferredMfaMethod] = useState<"APP" | "EMAIL">(
    (user?.preferredMfaMethod as "APP" | "EMAIL") || "APP"
  );
  const [mfaMethodLoading, setMfaMethodLoading] = useState(false);
  const [mfaMethodSuccess, setMfaMethodSuccess] = useState("");
  const [mfaMethodError, setMfaMethodError] = useState("");

  useEffect(() => {
    if (user?.preferredMfaMethod) {
      setPreferredMfaMethod((user.preferredMfaMethod as "APP" | "EMAIL") || "APP");
    }
  }, [user?.preferredMfaMethod]);

  const handleSaveMfaPreference = async (newMethod: "APP" | "EMAIL") => {
    if (!user) return;
    setMfaMethodLoading(true);
    setMfaMethodError("");
    setMfaMethodSuccess("");
    try {
      const res = await updateMfaPreference(user.userId, newMethod);
      if (res.success) {
        setPreferredMfaMethod(newMethod);
        updateStoredUser({ preferredMfaMethod: newMethod });
        setUser((prev) => (prev ? { ...prev, preferredMfaMethod: newMethod } : null));
        setMfaMethodSuccess(
          newMethod === "EMAIL"
            ? "Preferred 2FA method set to Email OTP. Future sign-ins will dispatch codes to your email."
            : "Preferred 2FA method set to Sentinel Authenticator (TOTP / Push)."
        );
      } else {
        setMfaMethodError(res.message || "Failed to update 2FA preference.");
      }
    } catch (e: any) {
      setMfaMethodError(e?.message || "Network error updating 2FA preference.");
    } finally {
      setMfaMethodLoading(false);
    }
  };
  const {
    apps,
    loading: servicesLoading,
    boilerplateTemplates,
    connectBoilerplate,
    addCustomApp,
    removeApp,
    loadServices,
  } = useIntegrations(user?.userId);

  const isAdmin = user?.role === "ADMIN";
  const isEnterpriseEmployee = Boolean(user?.company && user.company.toLowerCase() !== "personal" && user.role !== "ADMIN");
  const [forbiddenModal, setForbiddenModal] = useState<{ appName: string; reason: string; title?: string } | null>(null);
  const [launchingAppId, setLaunchingAppId] = useState<string | null>(null);

  // Step-Up Service Sign-In Approval State (approval is mobile-only; web can never self-approve)
  const [serviceApprovalModal, setServiceApprovalModal] = useState<{
    app: AppIntegration;
    challengeId: number;
    matchCode: string;
    status: "PENDING" | "APPROVED" | "DENIED" | "EXPIRED";
    destination?: string;
    isExternal?: boolean;
    isVault?: boolean;
    vaultUsername?: string;
    vaultPassword?: string;
  } | null>(null);
  const [approvalOtpCode, setApprovalOtpCode] = useState("");
  const [approvalOtpError, setApprovalOtpError] = useState("");
  const [approvalOtpLoading, setApprovalOtpLoading] = useState(false);
  const finalizingLaunchRef = useRef(false);
  const [vaultPasswordVisible, setVaultPasswordVisible] = useState(false);
  const [copiedVaultField, setCopiedVaultField] = useState<"user" | "pass" | null>(null);
  const [vaultAutofillDispatched, setVaultAutofillDispatched] = useState(false);

  // Browser Extension Presence & Middleware Gate State
  const [isExtensionInstalled, setIsExtensionInstalled] = useState<boolean>(false);
  const [extensionChecking, setExtensionChecking] = useState<boolean>(false);
  const [showExtensionGuideModal, setShowExtensionGuideModal] = useState<boolean>(false);
  const [guideBrowserTab, setGuideBrowserTab] = useState<"chromium" | "firefox">("chromium");
  const [extensionWarningDismissed, setExtensionWarningDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.userAgent.toLowerCase().includes("firefox")) {
      setGuideBrowserTab("firefox");
    }
  }, []);

  // Live active ping to detect Sentinel Autofill Bridge extension
  const checkExtensionPresence = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }
      setExtensionChecking(true);
      let responded = false;

      const handlePong = () => {
        responded = true;
        window.removeEventListener("SENTINEL_EXTENSION_PONG", handlePong);
        setIsExtensionInstalled(true);
        setExtensionChecking(false);
        resolve(true);
      };

      window.addEventListener("SENTINEL_EXTENSION_PONG", handlePong);
      window.dispatchEvent(new CustomEvent("SENTINEL_EXTENSION_PING"));

      // Check current DOM attribute and verify heartbeat timestamp freshness (< 4500ms)
      const lastHeartbeat = Number(document.documentElement.getAttribute("data-sentinel-heartbeat") || 0);
      const isFresh =
        document.documentElement.getAttribute("data-sentinel-extension") === "active" &&
        Date.now() - lastHeartbeat < 4500;

      setTimeout(() => {
        window.removeEventListener("SENTINEL_EXTENSION_PONG", handlePong);
        setExtensionChecking(false);
        if (!responded) {
          setIsExtensionInstalled(isFresh);
          resolve(isFresh);
        }
      }, 300);
    });
  }, []);

  // Resolve the destination URL directly to the application dashboard with SSO tokens
  const buildLaunchTarget = (
    app: AppIntegration,
    data?: { redirectUrl?: string; ssoToken?: string }
  ): { destination: string; isExternal: boolean } => {
    const isVault = Boolean(app.isVault || app.type === "vault");
    const rawTarget = data?.redirectUrl || app.loginUrl;
    const targetUrl = resolveServiceUrl(rawTarget, String(app.id));
    if (isVault) {
      return { destination: targetUrl || "https://", isExternal: true };
    }
    const ssoTokenValue =
      data?.ssoToken || ssoToken || ("sso_" + Math.random().toString(36).substring(2) + Date.now().toString(36));
    const isExternal = Boolean(targetUrl && (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")));
    const tokenParam = ssoTokenValue ? `&ssoToken=${ssoTokenValue}` : "";
    const destination =
      isExternal && targetUrl && user?.userId
        ? `${targetUrl}${targetUrl.includes("?") ? "&" : "?"}ssoUserId=${user.userId}&ssoUserEmail=${encodeURIComponent(user.email || "")}${tokenParam}`
        : (targetUrl || `/apps/${app.id}`);
    return { destination, isExternal };
  };

  const openLaunchTarget = (destination: string, isExternal: boolean) => {
    if (isExternal) {
      window.open(destination, "_blank", "noopener,noreferrer");
    } else {
      router.push(destination);
    }
  };

  // Complete a launch after the user proved MFA (mobile approval challengeId or TOTP code).
  // The backend validates the proof; this returns an error message on failure.
  const finalizeServiceLaunch = async (
    app: AppIntegration,
    proof: { challengeId?: number; code?: string }
  ): Promise<{ ok: true } | { ok: false; message: string }> => {
    let launchData: {
      redirectUrl?: string;
      ssoToken?: string;
      isVault?: boolean;
      vaultUsername?: string;
      vaultPassword?: string;
    } | undefined;

    if (app.backendId && user?.userId) {
      const res = await launchUserService(Number(app.backendId), { userId: user.userId, ...proof });
      if (!res.success) {
        return { ok: false, message: res.message || "Service launch could not be authorized." };
      }
      launchData = res.data;
    }

    const isVault = Boolean(launchData?.isVault || app.isVault || app.type === "vault");
    const vaultUsername = launchData?.vaultUsername || app.vaultUsername || "";
    const vaultPassword = launchData?.vaultPassword || "";
    const { destination, isExternal } = buildLaunchTarget(app, launchData);

    setServiceApprovalModal((prev) => (prev ? {
      ...prev,
      status: "APPROVED",
      destination,
      isExternal,
      isVault,
      vaultUsername,
      vaultPassword,
    } : null));

    if (!isVault) {
      setTimeout(() => {
        openLaunchTarget(destination, isExternal);
        setServiceApprovalModal(null);
      }, 700);
    }
    return { ok: true };
  };

  // Poll for the Mobile Push Challenge result while the approval modal is active
  useEffect(() => {
    if (!serviceApprovalModal || serviceApprovalModal.status !== "PENDING") return;

    const modal = serviceApprovalModal;
    const interval = setInterval(async () => {
      try {
        const res = await getMfaChallengeStatus(modal.challengeId);
        if (res.success && res.data) {
          if (res.data.status === "APPROVED") {
            clearInterval(interval);
            if (finalizingLaunchRef.current) return;
            finalizingLaunchRef.current = true;
            try {
              const result = await finalizeServiceLaunch(modal.app, { challengeId: modal.challengeId });
              if (!result.ok) {
                setServiceApprovalModal(null);
                setForbiddenModal({
                  appName: modal.app.name,
                  title: "Authentication Required",
                  reason: result.message,
                });
              }
            } finally {
              finalizingLaunchRef.current = false;
            }
          } else if (res.data.status === "DENIED") {
            clearInterval(interval);
            setServiceApprovalModal((prev) => (prev ? { ...prev, status: "DENIED" } : null));
          } else if (res.data.status === "EXPIRED") {
            clearInterval(interval);
            setServiceApprovalModal((prev) => (prev ? { ...prev, status: "EXPIRED" } : null));
          }
        }
      } catch {}
    }, 1500);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceApprovalModal]);

  const handleVerifyOtpForService = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!serviceApprovalModal || !user) return;
    if (approvalOtpCode.trim().length !== 6) {
      setApprovalOtpError("Please enter a 6-digit passcode.");
      return;
    }
    setApprovalOtpLoading(true);
    setApprovalOtpError("");
    try {
      const app = serviceApprovalModal.app;
      const code = approvalOtpCode.trim();
      if (!app.backendId) {
        // Local (non-managed) integration: verify identity directly
        const res = await verifyMfaLogin({ userId: user.userId, email: user.email, code });
        if (!res.success) {
          setApprovalOtpError(res.message || "Invalid passcode. Please check your authenticator app.");
          return;
        }
      }
      const result = await finalizeServiceLaunch(app, { code });
      if (!result.ok) {
        setApprovalOtpError(result.message);
      }
    } catch {
      setApprovalOtpError("Error verifying passcode. Please try again.");
    } finally {
      setApprovalOtpLoading(false);
    }
  };

  // Start the mobile step-up flow: push a number-match challenge to the paired authenticator
  const startServiceStepUp = async (app: AppIntegration) => {
    if (!user?.userId) return;
    setLaunchingAppId(String(app.id));
    let challengeRes;
    try {
      challengeRes = await initiateMfaChallenge(user.userId, user.email, `${app.name} Workstation Login`);
    } catch {
      challengeRes = undefined;
    }
    setLaunchingAppId(null);

    if (!challengeRes || !challengeRes.success || !challengeRes.data) {
      setForbiddenModal({
        appName: app.name,
        title: "Approval Request Failed",
        reason: challengeRes?.message || "Could not send the sign-in approval request to your mobile authenticator. Please try again.",
      });
      return;
    }

    setApprovalOtpCode("");
    setApprovalOtpError("");
    setServiceApprovalModal({
      app,
      challengeId: challengeRes.data.challengeId,
      matchCode: challengeRes.data.matchCode,
      status: "PENDING",
    });
  };

  const handleLaunchApp = async (app: AppIntegration, e: React.MouseEvent) => {
    e.preventDefault();
    if (gatewayStatus === "offline") {
      setForbiddenModal({
        appName: app.name,
        reason: "The Sentinel IAM Gateway is currently unreachable or offline. Service launch authorization cannot be verified until the system connection is restored.",
      });
      return;
    }

    // 2FA enabled, Vault app, or service enforces MFA -> mobile step-up approval is mandatory
    const serviceEnforcesMfa = Boolean(app.mfaRequired || app.metrics?.mfaRequired);
    if (user?.mfaEnabled || app.isVault || app.type === "vault" || serviceEnforcesMfa) {
      if (!user?.mfaEnabled && !app.isVault && app.type !== "vault") {
        setForbiddenModal({
          appName: app.name,
          title: "Multi-Factor Authentication Required",
          reason: `Access to ${app.name} requires mobile authenticator verification under Sentinel Zero-Trust policy. Please pair your Sentinel Mobile Authenticator app to access this service.`,
        });
        return;
      }
      await startServiceStepUp(app);
      return;
    }

    // If MFA is not yet configured, inform user that mobile authentication is mandatory
    setForbiddenModal({
      appName: app.name,
      title: "Mobile Authenticator Required",
      reason: "Sentinel Zero-Trust access control requires mobile authenticator verification before launching applications. Please pair your mobile authenticator in Security Settings.",
    });
  };

  // MFA Pairing Modal State
  const [pairingModalOpen, setPairingModalOpen] = useState(false);
  const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [pairingSuccess, setPairingSuccess] = useState("");
  const [pairingValidationErr, setPairingValidationErr] = useState("");

  // Add / Configure Service Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<"templates" | "custom" | "vault">("templates");
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [customType, setCustomType] = useState<IntegrationType>("sso_oauth");
  const [customLoginUrl, setCustomLoginUrl] = useState("");
  const [customClientId, setCustomClientId] = useState("");
  const [customMfaRequired, setCustomMfaRequired] = useState(true);
  const [modalErr, setModalErr] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // Vault form state
  const [vaultPreset, setVaultPreset] = useState<"facebook" | "github" | "google" | "custom">("facebook");
  const [vaultName, setVaultName] = useState("Facebook");
  const [vaultCategory, setVaultCategory] = useState("Social Network");
  const [vaultLoginUrl, setVaultLoginUrl] = useState("https://www.facebook.com/login");
  const [vaultUsername, setVaultUsername] = useState("");
  const [vaultPassword, setVaultPassword] = useState("");
  const [vaultShowPassword, setVaultShowPassword] = useState(false);
  const [vaultMfaRequired, setVaultMfaRequired] = useState(true);
  const [vaultSaving, setVaultSaving] = useState(false);

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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [revokeOtherSessionsOnPasswordChange, setRevokeOtherSessionsOnPasswordChange] = useState(true);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState("");

  // Personal Security Activity Audit Feed
  const [auditFeedModalOpen, setAuditFeedModalOpen] = useState(false);
  const [personalAuditLogs, setPersonalAuditLogs] = useState<SecurityAuditRecord[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);

  // Root Super Admin Impersonation Moderator Banner
  const [impersonationNotice, setImpersonationNotice] = useState<{
    active: boolean;
    targetEmail: string;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sentinel_impersonated_session");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.impersonated) {
          setImpersonationNotice({
            active: true,
            targetEmail: parsed.targetEmail || user?.email || "User",
          });
          return;
        }
      }
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("impersonated") === "true") {
          setImpersonationNotice({
            active: true,
            targetEmail: user?.email || "User",
          });
        }
      }
    } catch {}
  }, [user]);

  const handleExitImpersonation = () => {
    try {
      localStorage.removeItem("sentinel_impersonated_session");
    } catch {}
    clearSession();
    const controlUrl =
      typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "http://localhost:3004"
        : "https://sentinel-control-green.vercel.app";
    window.location.href = controlUrl;
  };

  useEffect(() => {
    const session = getStoredSession();
    if (!session || !session.user) {
      router.push("/login");
      return;
    }

    // Active server-side verification: force logout if account was deleted, purged, or session revoked
    validateSsoSession(session.user.userId, session.token).then((res) => {
      if (!res.success) {
        clearSession();
        router.push("/login?error=session_terminated");
      }
    });

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

    const handleGetSession = () => {
      const stored = getStoredSession();
      window.dispatchEvent(
        new CustomEvent("SENTINEL_SESSION_RESPONSE", {
          detail: {
            isLoggedIn: Boolean(stored?.user),
            user: stored?.user || null,
          },
        })
      );
    };
    window.addEventListener("SENTINEL_GET_SESSION", handleGetSession);

    // Listen for extension presence responses
    const handleExtensionPong = () => {
      setIsExtensionInstalled(true);
    };
    window.addEventListener("SENTINEL_EXTENSION_PONG", handleExtensionPong);

    // Initial on-load presence probe
    checkExtensionPresence();

    // Dynamic heartbeat every 3.5s to detect if user disabled or removed extension mid-session
    const extCheckInterval = setInterval(() => {
      const attr = document.documentElement.getAttribute("data-sentinel-extension");
      const lastHeartbeat = Number(document.documentElement.getAttribute("data-sentinel-heartbeat") || 0);
      const isFresh = attr === "active" && (Date.now() - lastHeartbeat < 4500);

      if (!isFresh) {
        setIsExtensionInstalled(false);
      } else {
        window.dispatchEvent(new CustomEvent("SENTINEL_EXTENSION_PING"));
      }
    }, 3500);

    if (session.user.company) {
      getOrganizationPolicy(session.user.userId, session.user.company).then((res) => {
        if (res.success && res.data?.mfaEnforced) {
          setMfaMandateActive(true);
        }
      });
    }

    return () => {
      window.removeEventListener("SENTINEL_GET_SESSION", handleGetSession);
      window.removeEventListener("SENTINEL_EXTENSION_PONG", handleExtensionPong);
      clearInterval(extCheckInterval);
    };
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
    try {
      localStorage.removeItem("sentinel_impersonated_session");
    } catch {}
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

    // Force live check of extension presence
    const active = await checkExtensionPresence();
    if (!active && !extensionWarningDismissed) {
      setExtensionWarningDismissed(true);
      setModalErr("Extension Not Detected: Sentinel Autofill Bridge is offline or uninstalled. In-browser form autofill will not work automatically. Click 'Add Integration' again to proceed with manual copy/paste mode, or open the setup guide below.");
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
      setExtensionWarningDismissed(false);
      setModalSuccess(
        active
          ? "Application registered. Sentinel Autofill Bridge is active for this service."
          : "Application registered. Note: Manual fallback mode active (extension offline)."
      );
      setCustomName("");
      setCustomCategory("");
      setCustomLoginUrl("");
      setCustomClientId("");
      setTimeout(() => {
        setAddModalOpen(false);
        setModalSuccess("");
      }, 1400);
    } else {
      setModalErr("Failed to register custom application.");
    }
  };

  const handleSelectVaultPreset = (preset: "facebook" | "github" | "google" | "custom") => {
    setVaultPreset(preset);
    setModalErr("");
    if (preset === "facebook") {
      setVaultName("Facebook");
      setVaultCategory("Social Network");
      setVaultLoginUrl("https://www.facebook.com/login");
    } else if (preset === "github") {
      setVaultName("GitHub");
      setVaultCategory("Developer Platform");
      setVaultLoginUrl("https://github.com/login");
    } else if (preset === "google") {
      setVaultName("Gmail / Google");
      setVaultCategory("Email & Workspace");
      setVaultLoginUrl("https://accounts.google.com/signin");
    } else {
      setVaultName("");
      setVaultCategory("Personal Account");
      setVaultLoginUrl("https://");
    }
  };

  const handleAddVaultApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalErr("");
    setModalSuccess("");

    if (!vaultName.trim()) {
      setModalErr("Application or service name is required.");
      return;
    }
    if (!vaultLoginUrl.trim()) {
      setModalErr("Login URL is required.");
      return;
    }
    if (!vaultUsername.trim()) {
      setModalErr("Username or email is required.");
      return;
    }
    if (!vaultPassword.trim()) {
      setModalErr("Password is required.");
      return;
    }

    // Force live check of extension presence
    const active = await checkExtensionPresence();
    if (!active && !extensionWarningDismissed) {
      setExtensionWarningDismissed(true);
      setModalErr("Extension Not Detected: Sentinel Autofill Bridge is offline or was removed. Credentials will still be stored in your encrypted vault, but automatic in-page injection cannot run. Click 'Save to Secure Vault' again to confirm manual copy mode, or load the extension.");
      return;
    }

    setVaultSaving(true);
    const iconType = vaultPreset !== "custom" ? vaultPreset : "key";
    const ok = await addCustomApp({
      name: vaultName.trim(),
      category: vaultCategory.trim() || "Credential Vault",
      type: "vault",
      iconType,
      loginUrl: vaultLoginUrl.trim(),
      mfaRequired: vaultMfaRequired,
      vaultUsername: vaultUsername.trim(),
      vaultPassword: vaultPassword.trim(),
    });
    setVaultSaving(false);

    if (ok) {
      setExtensionWarningDismissed(false);
      setModalSuccess(
        active
          ? `Credentials for ${vaultName} securely vaulted. Autofill bridge active.`
          : `Credentials for ${vaultName} vaulted. Manual copy mode active (extension offline).`
      );
      setVaultUsername("");
      setVaultPassword("");
      setTimeout(() => {
        setAddModalOpen(false);
        setModalSuccess("");
      }, 1400);
    } else {
      setModalErr("Failed to save credentials to vault.");
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
        className={`fixed md:relative inset-y-0 left-0 z-40 bg-slate-950 md:bg-[#070b16] self-stretch min-h-screen shrink-0 border-r border-white/10 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "w-16 md:w-16" : "w-64 sm:w-72 md:w-[260px]"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className={`sticky top-0 flex flex-col justify-between h-screen pt-6 pb-6 w-full ${sidebarCollapsed ? "px-2" : "px-4 sm:px-5"}`}>
          <div>
            {/* Brand Logo & Collapse Toggle */}
            <div className={`flex items-center select-none mb-6 ${sidebarCollapsed ? "flex-col gap-3 justify-center" : "justify-between px-2"}`}>
              <div className="flex items-center gap-3 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Sentinel Logo"
                  className="w-8 h-8 rounded-lg object-contain shrink-0"
                />
                {!sidebarCollapsed && (
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
                )}
              </div>

              {/* Minimize / Expand Toggle Button */}
              <button
                type="button"
                onClick={toggleSidebarCollapsed}
                title={sidebarCollapsed ? "Expand sidebar navigation" : "Minimize sidebar navigation"}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                {sidebarCollapsed ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                )}
              </button>
            </div>

            {/* Primary Navigation */}
            <div className="w-full space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Workspace
                </div>
              )}

              {/* Applications / Launchpad */}
              {sidebarPrefs.applications && (
                <button
                  type="button"
                  title="Applications"
                  className={`w-full flex items-center rounded-xl bg-white/5 border border-white/10 text-white font-medium text-xs transition-all cursor-pointer text-left ${
                    sidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
                  }`}
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
                  {!sidebarCollapsed && <span>Applications</span>}
                </button>
              )}

              {/* User Directory (Admin only) */}
              {isAdmin && sidebarPrefs.userDirectory && (
                <Link
                  href="/users"
                  title="User Directory"
                  className={`w-full flex items-center rounded-xl text-xs font-medium transition-all text-left border border-transparent hover:border-white/10 text-slate-400 hover:text-white hover:bg-white/5 ${
                    sidebarCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
                  }`}
                >
                  <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"}`}>
                    <svg className="w-4 h-4 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {!sidebarCollapsed && <span>User Directory</span>}
                  </div>
                </Link>
              )}

              {/* Audit Logs (Admin only) */}
              {isAdmin && sidebarPrefs.auditLogs && (
                <Link
                  href="/users?tab=audit"
                  title="Audit Logs"
                  className={`w-full flex items-center rounded-xl text-xs font-medium transition-all text-left border border-transparent hover:border-white/10 text-slate-400 hover:text-white hover:bg-white/5 ${
                    sidebarCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
                  }`}
                >
                  <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"}`}>
                    <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {!sidebarCollapsed && <span>Audit Logs</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                      Live
                    </span>
                  )}
                </Link>
              )}

              {/* Developer & Integration Section */}
              {!isEnterpriseEmployee && (sidebarPrefs.apiDocs || sidebarPrefs.connectService) && !sidebarCollapsed && (
                <div className="pt-4 px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Developer &amp; SSO
                </div>
              )}

              {!isEnterpriseEmployee && sidebarPrefs.apiDocs && (
                <Link
                  href="/docs"
                  title="API & Documentation"
                  className={`w-full flex items-center rounded-xl hover:bg-white/5 text-slate-400 hover:text-white font-medium text-xs transition-all text-left border border-transparent hover:border-white/10 ${
                    sidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
                  }`}
                >
                  <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  {!sidebarCollapsed && <span>API &amp; Docs</span>}
                </Link>
              )}

              {!isEnterpriseEmployee && sidebarPrefs.connectService && (
                <button
                  type="button"
                  title="Connect Service"
                  onClick={() => setAddModalOpen(true)}
                  className={`w-full flex items-center rounded-xl hover:bg-white/5 text-slate-400 hover:text-white font-medium text-xs transition-all text-left border border-transparent hover:border-white/10 cursor-pointer ${
                    sidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
                  }`}
                >
                  <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  {!sidebarCollapsed && <span>Connect Service</span>}
                </button>
              )}

              {/* Security & Device Section */}
              {(sidebarPrefs.mobileMfa || sidebarPrefs.downloadApp) && !sidebarCollapsed && (
                <div className="pt-4 px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Security &amp; MFA
                </div>
              )}

              {sidebarPrefs.mobileMfa && (
                <button
                  type="button"
                  title="Pair Mobile 2FA"
                  onClick={handleOpenPairingModal}
                  className={`w-full flex items-center rounded-xl hover:bg-white/5 text-slate-400 hover:text-white font-medium text-xs transition-all cursor-pointer text-left border border-transparent hover:border-white/10 ${
                    sidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
                  }`}
                >
                  <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {!sidebarCollapsed && <span>Pair Mobile 2FA</span>}
                </button>
              )}

              {sidebarPrefs.downloadApp && (
                <Link
                  href="/download"
                  title="Download Sentinel App"
                  className={`w-full flex items-center rounded-xl hover:bg-white/5 text-slate-300 hover:text-white font-medium text-xs transition-all text-left border border-transparent hover:border-white/10 ${
                    sidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
                  }`}
                >
                  <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                  {!sidebarCollapsed && <span>Download App</span>}
                </Link>
              )}

              {/* Billing & Subscription Plan (Admin only) */}
              {isAdmin && sidebarPrefs.planBilling && !sidebarCollapsed && (
                <div className="pt-4 px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Subscription &amp; Tier
                </div>
              )}

              {isAdmin && sidebarPrefs.planBilling && (
                <Link
                  href="/pricing"
                  title="Plan & Billing"
                  className={`w-full flex items-center rounded-xl hover:bg-white/5 text-slate-400 hover:text-white font-medium text-xs transition-all text-left border border-transparent hover:border-white/10 ${
                    sidebarCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
                  }`}
                >
                  <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"}`}>
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    {!sidebarCollapsed && <span>Plan &amp; Billing</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase font-bold">
                      {user?.subscriptionTier || "COMMUNITY"}
                    </span>
                  )}
                </Link>
              )}
            </div>
          </div>

          {/* Bottom Utility Area */}
          <div className="pt-3 border-t border-white/10 space-y-1">
            {/* Customize Navigation Button */}
            <button
              type="button"
              onClick={() => setNavCustomizerOpen(true)}
              title="Customize Sidebar Navigation"
              className={`w-full flex items-center rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors text-xs font-medium cursor-pointer ${
                sidebarCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"
              }`}
            >
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {!sidebarCollapsed && <span>Customize View</span>}
            </button>

            {sidebarPrefs.termsAgreements && (
              <Link
                href="/terms"
                title="Terms & Agreements"
                className={`w-full flex items-center rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors text-xs font-medium ${
                  sidebarCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"
                }`}
              >
                <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {!sidebarCollapsed && <span>Terms &amp; Agreements</span>}
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className={`w-full flex items-center rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors text-xs font-medium cursor-pointer ${
                sidebarCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!sidebarCollapsed && <span>Sign out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        {/* Root Super Admin Impersonation Moderator Banner */}
        {impersonationNotice?.active && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                    Root Impersonation Active
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/60 border border-cyan-700/60 text-cyan-200">
                    MODERATOR MODE
                  </span>
                </div>
                <p className="text-xs text-slate-300 truncate">
                  You are viewing the workstation space of <span className="font-semibold text-white font-mono">{impersonationNotice.targetEmail}</span>. All actions are logged.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExitImpersonation}
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Exit Session &amp; Return to Control</span>
              </button>
            </div>
          </div>
        )}
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
                <span className="text-slate-400 mx-2 hidden sm:inline">â€¢</span>
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
                <span className="text-slate-400 mx-2 hidden sm:inline">â€¢</span>
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
              <span className="text-slate-400 hidden sm:inline">â€¢</span>
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

            {!isEnterpriseEmployee && (
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
            )}

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

                  {!isEnterpriseEmployee && (
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
                  )}

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

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setShowExtensionGuideModal(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Autofill Extension</span>
                    </div>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isExtensionInstalled
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }`}>
                      {isExtensionInstalled ? "Active" : "Install"}
                    </span>
                  </button>

            {user?.mfaEnabled ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setMfaMethodModalOpen(true);
                          setMfaMethodError("");
                          setMfaMethodSuccess("");
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-cyan-300 hover:bg-cyan-500/10 transition-colors flex items-center justify-between cursor-pointer mb-1"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          <span>2FA Delivery Method</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-300">
                          {user?.preferredMfaMethod === "EMAIL" ? "Email OTP" : "App / Push"}
                        </span>
                      </button>

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
              <h1 className="text-lg font-semibold text-white tracking-tight">
                {isEnterpriseEmployee ? "Workstation Launchpad" : "Applications"}
              </h1>
              {gatewayStatus === "offline" ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span>System Offline</span>
                </span>
              ) : gatewayStatus === "cold_starting" ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Reconnecting ({coldStartSeconds}s)</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>{apps.length} active</span>
                </span>
              )}
              {isAdmin ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 border border-purple-400/30 text-purple-300 font-semibold uppercase">
                  Admin
                </span>
              ) : isEnterpriseEmployee ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-semibold uppercase font-mono">
                  Whitelist Policy Enforced
                </span>
              ) : null}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEnterpriseEmployee
                ? `Whitelisted company applications for ${user?.fullName || user?.email} (${user?.role}) under ${user?.company}`
                : `Enterprise single sign-on directory for ${user?.email || "internal tenant"}`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isEnterpriseEmployee && (
              <button
                type="button"
                onClick={() => loadServices()}
                disabled={servicesLoading}
                title="Sync assigned workstation services from organization IT directory"
                className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <svg className={`w-3.5 h-3.5 ${servicesLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{servicesLoading ? "Syncing..." : "Sync Services"}</span>
              </button>
            )}

            {/* Browser Autofill Extension Status / Setup Gate */}
            <button
              type="button"
              onClick={() => setShowExtensionGuideModal(true)}
              title={
                isExtensionInstalled
                  ? "Sentinel Autofill Bridge Extension is active and connected"
                  : "Install Sentinel Autofill Bridge Extension for Chrome or Firefox"
              }
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                isExtensionInstalled
                  ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                  : "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300"
              }`}
            >
              {isExtensionInstalled ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Extension Active</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Install Extension</span>
                </>
              )}
            </button>

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

            {!isEnterpriseEmployee && (
              <>
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
              </>
            )}
          </div>
        </div>

        {gatewayStatus === "offline" && (
          <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Sentinel Security Gateway is initializing. If services are slow to load, please wait a moment and refresh.</span>
            </div>
            <button
              type="button"
              onClick={probeGateway}
              className="px-2.5 py-1 rounded bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

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
          /* Clean Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 rounded-xl bg-slate-900/20 border border-dashed border-white/10 text-center min-h-[300px]">
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              {isEnterpriseEmployee ? "No Workstation Services Assigned" : "No Applications Configured"}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
              {isEnterpriseEmployee
                ? "Your company IT administrator has not assigned any enterprise applications to your profile yet. Please contact IT support to request access."
                : "Your account currently has no active integrations. Connect an enterprise template or register a custom application."}
            </p>

            {isEnterpriseEmployee && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => loadServices()}
                  disabled={servicesLoading}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  <svg className={`w-3.5 h-3.5 ${servicesLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{servicesLoading ? "Checking Access..." : "Check Assigned Services"}</span>
                </button>
              </div>
            )}

            {!isEnterpriseEmployee && (
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
            )}
          </div>
        ) : (
          /* Configured Services Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 w-full">
            {filteredApps.map((app) => {
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
                      {!isEnterpriseEmployee && (
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
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleLaunchApp(app, e)}
                        className="w-7 h-7 rounded-md bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-300 flex items-center justify-center transition-colors cursor-pointer"
                        title="Launch service"
                      >
                        {launchingAppId === String(app.id) ? (
                          <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
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
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Card Bottom Area: App Name, Category, and Status Pill */}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={(e) => handleLaunchApp(app, e)}
                      className="text-left w-full group-hover:text-cyan-300 transition-colors cursor-pointer truncate"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <h3 className="text-sm font-semibold text-white tracking-tight truncate">
                          {app.name}
                        </h3>
                        {(app.isVault || app.type === "vault") && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 shrink-0">
                            Vault
                          </span>
                        )}
                      </div>
                    </button>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {app.category}
                    </p>
                    {app.vaultUsername && (
                      <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                        {app.vaultUsername}
                      </p>
                    )}

                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 border border-white/10 text-slate-300">
                        {gatewayStatus === "offline" ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            <span className="text-red-300 font-semibold">Offline</span>
                          </>
                        ) : gatewayStatus === "cold_starting" ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-amber-300">Standby</span>
                          </>
                        ) : (
                          <>
                            <span className={`w-1.5 h-1.5 rounded-full ${app.statusColor || "bg-cyan-400"}`} />
                            <span>{app.status || "Active"}</span>
                          </>
                        )}
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
      {addModalOpen && !isEnterpriseEmployee && (
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
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-5 overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveModalTab("templates");
                  setModalErr("");
                  setModalSuccess("");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  activeModalTab === "templates"
                    ? "bg-cyan-500 text-slate-950 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Enterprise Templates
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModalTab("custom");
                  setModalErr("");
                  setModalSuccess("");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  activeModalTab === "custom"
                    ? "bg-cyan-500 text-slate-950 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Custom Integration
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModalTab("vault");
                  setModalErr("");
                  setModalSuccess("");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  activeModalTab === "vault"
                    ? "bg-cyan-500 text-slate-950 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Credential Vault (Password Manager)
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
            ) : activeModalTab === "vault" ? (
              <form onSubmit={handleAddVaultApp} className="space-y-4">
                {/* Live Extension Presence Banner */}
                {isExtensionInstalled ? (
                  <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Sentinel Autofill Bridge: Connected</span>
                    </div>
                    <span className="text-[10px] text-emerald-300 font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      In-Page Autofill Active
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-300 font-semibold">
                        <svg className="w-4 h-4 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Autofill Bridge Extension Not Detected</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowExtensionGuideModal(true)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
                      >
                        Setup Guide
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      If the extension was uninstalled or disabled in your browser, automatic in-page credential injection is disabled. Saved credentials will operate via manual copy/paste mode upon push approval.
                    </p>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/30 text-xs text-slate-300 space-y-1">
                  <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Secure Password Vault & Out-of-Band Push Gate</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Store account credentials for external platforms like Facebook, GitHub, or Gmail. Credentials are encrypted at rest with AES-256 and will remain locked until verified with a 2-digit Sentinel Mobile number match challenge.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Quick Service Presets</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "facebook", name: "Facebook", icon: "facebook" },
                      { id: "github", name: "GitHub", icon: "github" },
                      { id: "google", name: "Gmail", icon: "google" },
                      { id: "custom", name: "Custom Site", icon: "key" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectVaultPreset(item.id as any)}
                        className={`p-2.5 rounded-lg border flex items-center gap-2 transition-all cursor-pointer ${
                          vaultPreset === item.id
                            ? "bg-cyan-500/10 border-cyan-500 text-cyan-300 font-semibold"
                            : "bg-slate-900/50 border-white/10 hover:border-white/20 text-slate-300"
                        }`}
                      >
                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                          <AppIcon iconType={item.icon} />
                        </div>
                        <span className="text-xs truncate">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Service Name *</label>
                    <input
                      type="text"
                      value={vaultName}
                      onChange={(e) => setVaultName(e.target.value)}
                      placeholder="e.g. Facebook, GitHub, Gmail"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-500/60"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                    <input
                      type="text"
                      value={vaultCategory}
                      onChange={(e) => setVaultCategory(e.target.value)}
                      placeholder="e.g. Social Network, Developer"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-500/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Launch / Login URL *</label>
                  <input
                    type="url"
                    value={vaultLoginUrl}
                    onChange={(e) => setVaultLoginUrl(e.target.value)}
                    placeholder="https://www.facebook.com/login"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-500/60 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Username / Email *</label>
                  <input
                    type="text"
                    value={vaultUsername}
                    onChange={(e) => setVaultUsername(e.target.value)}
                    placeholder={
                      vaultPreset === "facebook"
                        ? "name@example.com or mobile number"
                        : vaultPreset === "github"
                        ? "username or email"
                        : vaultPreset === "google"
                        ? "username@gmail.com"
                        : "user@example.com"
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-500/60 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Account Password *</label>
                  <div className="relative">
                    <input
                      type={vaultShowPassword ? "text" : "password"}
                      value={vaultPassword}
                      onChange={(e) => setVaultPassword(e.target.value)}
                      placeholder="Enter account password to vault"
                      className="w-full px-3 py-2 pr-10 rounded-lg bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-500/60 font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setVaultShowPassword(!vaultShowPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      title={vaultShowPassword ? "Hide password" : "Show password"}
                    >
                      {vaultShowPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="mt-1.5">
                    <PasswordEntropyMeter password={vaultPassword} />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="vaultEnforceMfa"
                    checked={vaultMfaRequired}
                    onChange={(e) => setVaultMfaRequired(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-400 accent-cyan-500 cursor-pointer"
                  />
                  <label htmlFor="vaultEnforceMfa" className="text-xs text-slate-300 cursor-pointer select-none">
                    Require Sentinel Push Verification (Number Match) before unlocking credentials
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
                    disabled={vaultSaving}
                    className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {vaultSaving ? "Saving to Vault..." : "Save to Secure Vault"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddCustom} className="space-y-3.5">
                {/* Live Extension Presence Banner for Custom App */}
                {isExtensionInstalled ? (
                  <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Sentinel Autofill Bridge: Connected</span>
                    </div>
                    <span className="text-[10px] text-emerald-300 font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      Autofill Available
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-300 font-semibold">
                        <svg className="w-4 h-4 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Autofill Bridge Extension Not Detected</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowExtensionGuideModal(true)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
                      >
                        Setup Guide
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      If you uninstalled or disabled the extension, automatic login form injection cannot run for this custom application. You will be able to launch via manual copy/paste fallback.
                    </p>
                  </div>
                )}
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

              {user?.mfaEnabled && (
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      2FA Delivery Channel
                    </label>
                    {mfaMethodSuccess && (
                      <span className="text-[10px] text-emerald-400 font-medium">Updated</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveMfaPreference("APP")}
                      disabled={mfaMethodLoading}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        preferredMfaMethod === "APP"
                          ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-300"
                          : "bg-slate-900 border-white/10 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="font-semibold text-xs text-white">Authenticator App</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">TOTP &amp; Push number match</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveMfaPreference("EMAIL")}
                      disabled={mfaMethodLoading}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        preferredMfaMethod === "EMAIL"
                          ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-300"
                          : "bg-slate-900 border-white/10 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="font-semibold text-xs text-white">Email Verification</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">6-digit OTP code to email</div>
                    </button>
                  </div>
                </div>
              )}

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

      {/* 2FA Delivery Method Modal */}
      {mfaMethodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Two-Factor Authentication Method</h3>
                  <p className="text-[11px] text-slate-400">Configure your primary 2FA verification channel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMfaMethodModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {mfaMethodSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {mfaMethodSuccess}
              </div>
            )}
            {mfaMethodError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {mfaMethodError}
              </div>
            )}

            <div className="space-y-3 mb-5">
              {/* Option 1: Mobile App */}
              <div
                onClick={() => handleSaveMfaPreference("APP")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  preferredMfaMethod === "APP"
                    ? "bg-cyan-500/10 border-cyan-500/60 shadow-[0_0_15px_rgba(56,225,255,0.15)]"
                    : "bg-slate-900/60 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                      preferredMfaMethod === "APP" ? "border-cyan-400 bg-cyan-400/20" : "border-slate-600"
                    }`}>
                      {preferredMfaMethod === "APP" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Sentinel Mobile Authenticator (App / TOTP)</div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Rolling 30-second codes and out-of-band push number match challenges on your paired smartphone.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider shrink-0 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                    Recommended
                  </span>
                </div>
              </div>

              {/* Option 2: Email OTP */}
              <div
                onClick={() => handleSaveMfaPreference("EMAIL")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  preferredMfaMethod === "EMAIL"
                    ? "bg-cyan-500/10 border-cyan-500/60 shadow-[0_0_15px_rgba(56,225,255,0.15)]"
                    : "bg-slate-900/60 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                      preferredMfaMethod === "EMAIL" ? "border-cyan-400 bg-cyan-400/20" : "border-slate-600"
                    }`}>
                      {preferredMfaMethod === "EMAIL" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Email Verification Code (Email OTP)</div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Dispatches a single-use 6-digit verification code to <span className="text-slate-300 font-mono">{user?.email}</span> each time you sign in.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setMfaMethodModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
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
                          <span>â€¢</span>
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
                <div className="relative flex items-center bg-slate-900 border border-white/10 rounded-xl px-3 py-2 focus-within:border-cyan-400 transition-all">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-transparent border-none outline-none text-white text-xs placeholder-slate-500 pr-2"
                  />
                  <PasswordToggleAdornment
                    show={showCurrentPassword}
                    onToggle={() => setShowCurrentPassword((prev) => !prev)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative flex items-center bg-slate-900 border border-white/10 rounded-xl px-3 py-2 focus-within:border-cyan-400 transition-all">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Min. 8 characters (mixed case, digit, symbol)"
                    className="w-full bg-transparent border-none outline-none text-white text-xs placeholder-slate-500 pr-2"
                  />
                  <PasswordToggleAdornment
                    show={showNewPassword}
                    onToggle={() => setShowNewPassword((prev) => !prev)}
                  />
                </div>
                <PasswordEntropyMeter password={newPasswordInput} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative flex items-center bg-slate-900 border border-white/10 rounded-xl px-3 py-2 focus-within:border-cyan-400 transition-all">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full bg-transparent border-none outline-none text-white text-xs placeholder-slate-500 pr-2"
                  />
                  <PasswordToggleAdornment
                    show={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((prev) => !prev)}
                  />
                </div>
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
                          <span>â€¢</span>
                          <span>IP: {log.ipAddress}</span>
                        </>
                      )}
                      {log.userAgent && (
                        <>
                          <span>â€¢</span>
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

      {/* First-Time Workstation Onboarding Gate Modal */}
      {user && (user.passwordResetRequired || (mfaMandateActive && !user.mfaEnabled)) && (
        <WorkstationOnboardingModal
          user={user}
          ssoToken={ssoToken}
          mfaMandated={mfaMandateActive}
          onComplete={() => {
            const refreshed = getStoredSession();
            if (refreshed?.user) {
              setUser(refreshed.user);
            }
          }}
        />
      )}

      {/* 403 Whitelist Policy Access Denied Modal */}
      {forbiddenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-950 border border-red-500/30 p-6 shadow-2xl text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">{forbiddenModal.title || "Access Denied (403 Forbidden)"}</h3>
                <p className="text-xs text-red-300 font-mono mt-0.5">{forbiddenModal.appName || "Service Gateway"}</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-300 leading-relaxed">
              {forbiddenModal.reason}
            </p>

            {!forbiddenModal.title && (
              <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-400 leading-relaxed">
                Under organization zero-trust policy, employees are restricted to strictly assigned workstation services. Contact your workspace IT administrator to request access assignment.
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setForbiddenModal(null)}
                className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 text-xs font-medium transition-colors cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step-Up Service Sign-In Authorization Modal */}
      {serviceApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-950 border border-cyan-500/40 p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Authorize Service Sign-In</h3>
                  <p className="text-xs text-cyan-300 font-mono mt-0.5">{serviceApprovalModal.app.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setServiceApprovalModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {serviceApprovalModal.status === "PENDING" && (
              <div className="mt-4 space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Security Match Number</span>
                  <div className="text-3xl font-extrabold text-cyan-300 font-mono tracking-widest py-1">
                    {serviceApprovalModal.matchCode}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Open your paired <strong>Sentinel Authenticator</strong> mobile app and approve this request by selecting <strong className="text-cyan-300">{serviceApprovalModal.matchCode}</strong>. Approval is only possible from your mobile device.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Service:</span>
                    <span className="text-white font-medium">{serviceApprovalModal.app.name}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Account:</span>
                    <span className="text-cyan-200 font-mono">{user?.email}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Origin:</span>
                    <span className="text-slate-200">Workstation SSO Launchpad</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 text-[11px] text-cyan-400 justify-center">
                  <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>Waiting for mobile approval...</span>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setServiceApprovalModal(null)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/15 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                {/* Alternative 6-Digit TOTP / Email OTP Verification */}
                <div className="pt-3 border-t border-white/10">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Or Enter 6-Digit Code (TOTP / OTP)
                  </span>
                  <form onSubmit={handleVerifyOtpForService} className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={approvalOtpCode}
                      onChange={(e) => {
                        setApprovalOtpCode(e.target.value.replace(/\D/g, ""));
                        setApprovalOtpError("");
                      }}
                      placeholder="000000"
                      className="flex-1 bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      disabled={approvalOtpLoading || approvalOtpCode.length < 6}
                      className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      {approvalOtpLoading ? "Verifying..." : "Verify OTP"}
                    </button>
                  </form>
                  {approvalOtpError && (
                    <p className="text-[11px] text-rose-400 mt-1">{approvalOtpError}</p>
                  )}
                </div>
              </div>
            )}

            {serviceApprovalModal.status === "APPROVED" && (
              serviceApprovalModal.isVault ? (
                <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-emerald-500/40 text-left space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-300">Credentials Unlocked</h4>
                      <p className="text-[11px] text-slate-400">Authorized by Sentinel Mobile Authenticator</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Username / Email
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={serviceApprovalModal.vaultUsername || user?.email || ""}
                          className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-cyan-200 outline-none select-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(serviceApprovalModal.vaultUsername || user?.email || "");
                            setCopiedVaultField("user");
                            setTimeout(() => setCopiedVaultField(null), 2000);
                          }}
                          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 cursor-pointer transition-colors"
                        >
                          {copiedVaultField === "user" ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Password
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type={vaultPasswordVisible ? "text" : "password"}
                            readOnly
                            value={serviceApprovalModal.vaultPassword || "••••••••"}
                            className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 pr-10 text-xs font-mono text-amber-200 outline-none select-all"
                          />
                          <button
                            type="button"
                            onClick={() => setVaultPasswordVisible(!vaultPasswordVisible)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                            title={vaultPasswordVisible ? "Hide password" : "Show password"}
                          >
                            {vaultPasswordVisible ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (serviceApprovalModal.vaultPassword) {
                              navigator.clipboard.writeText(serviceApprovalModal.vaultPassword);
                              setCopiedVaultField("pass");
                              setTimeout(() => setCopiedVaultField(null), 2000);
                            }
                          }}
                          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 cursor-pointer transition-colors"
                        >
                          {copiedVaultField === "pass" ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    {isExtensionInstalled ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              window.dispatchEvent(
                                new CustomEvent("SENTINEL_VAULT_LAUNCH", {
                                  detail: {
                                    destination: serviceApprovalModal.destination,
                                    username: serviceApprovalModal.vaultUsername || user?.email || "",
                                    password: serviceApprovalModal.vaultPassword || "",
                                    appName: serviceApprovalModal.app.name,
                                  },
                                })
                              );
                            }
                            setVaultAutofillDispatched(true);
                            setTimeout(() => setVaultAutofillDispatched(false), 3500);
                          }}
                          className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Launch & Autofill {serviceApprovalModal.app.name}</span>
                        </button>
                        <p className="text-[11px] text-center text-slate-400">
                          {vaultAutofillDispatched
                            ? "Dispatched to Sentinel Autofill Bridge. Form injection in progress..."
                            : "Sentinel Autofill Bridge will open the login page and inject your credentials automatically."}
                        </p>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (serviceApprovalModal.vaultPassword) {
                              navigator.clipboard.writeText(serviceApprovalModal.vaultPassword);
                              setCopiedVaultField("pass");
                              setTimeout(() => setCopiedVaultField(null), 2500);
                            }
                            window.open(serviceApprovalModal.destination, "_blank", "noopener,noreferrer");
                          }}
                          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span>Copy Password & Open {serviceApprovalModal.app.name}</span>
                        </button>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                          <span>Extension offline: Manual paste mode</span>
                          <button
                            type="button"
                            onClick={() => setShowExtensionGuideModal(true)}
                            className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
                          >
                            Setup Guide
                          </button>
                        </div>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setServiceApprovalModal(null);
                        setVaultPasswordVisible(false);
                      }}
                      className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                    >
                      Done / Lock Vault
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2 animate-in fade-in duration-200">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-emerald-300">Login Approved</h4>
                  <p className="text-xs text-slate-300">
                    Redirecting to <strong>{serviceApprovalModal.app.name}</strong> workstation session...
                  </p>
                </div>
              )
            )}

            {serviceApprovalModal.status === "DENIED" && (
              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center space-y-3 animate-in fade-in duration-200">
                <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-300">Sign-In Request Denied</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Access to {serviceApprovalModal.app.name} was rejected. A security alert was registered.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setServiceApprovalModal(null)}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {serviceApprovalModal.status === "EXPIRED" && (
              <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-3 animate-in fade-in duration-200">
                <h4 className="text-sm font-bold text-amber-300">Sign-In Challenge Timed Out</h4>
                <p className="text-xs text-slate-300">
                  The approval window for {serviceApprovalModal.app.name} expired. Please launch again.
                </p>
                <button
                  type="button"
                  onClick={() => setServiceApprovalModal(null)}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Extension Installation & Setup Guide Modal */}
      {showExtensionGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl rounded-2xl bg-slate-950 border border-cyan-500/40 p-6 shadow-2xl text-white max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Sentinel Autofill Bridge</h3>
                  <p className="text-[11px] text-slate-400">Cross-Browser Secure In-Page Credential Injector (v1.1.0)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExtensionGuideModal(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Current Real-Time Live Status Card */}
            <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isExtensionInstalled ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                <div>
                  <div className="text-xs font-semibold text-white">
                    {isExtensionInstalled ? "Extension Active & Connected" : "Extension Not Detected"}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isExtensionInstalled
                      ? "In-page credential injection is ready. Launches will autofill automatically."
                      : "Load the unpacked extension below to activate automatic autofill."}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => checkExtensionPresence()}
                disabled={extensionChecking}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-medium text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                {extensionChecking ? "Checking..." : "Check Status"}
              </button>
            </div>

            {/* Browser Selector Tabs */}
            <div className="mt-4 grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900 border border-white/10">
              <button
                type="button"
                onClick={() => setGuideBrowserTab("chromium")}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  guideBrowserTab === "chromium"
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                </svg>
                <span>Chromium (Chrome / Brave / Edge)</span>
              </button>
              <button
                type="button"
                onClick={() => setGuideBrowserTab("firefox")}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  guideBrowserTab === "firefox"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                </svg>
                <span>Mozilla Firefox</span>
              </button>
            </div>

            {/* Dynamic Browser Guide Content */}
            {guideBrowserTab === "chromium" ? (
              <div className="mt-4 space-y-3.5 text-xs">
                {/* Download Card */}
                <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-cyan-300 text-xs">Chromium Package (Manifest V3)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Compatible with Google Chrome, Brave, Microsoft Edge, and Opera</div>
                  </div>
                  <a
                    href="/sentinel-extension-chrome.zip"
                    download="sentinel-extension-chrome.zip"
                    className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download (.zip)</span>
                  </a>
                </div>

                {/* Installation Steps */}
                <div className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-3">
                  <div className="text-xs font-bold text-slate-200">Installation Steps for Chrome / Brave / Edge:</div>
                  <div className="space-y-2 text-[11px] text-slate-300">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-cyan-500/30">1</span>
                      <p className="pt-0.5">
                        Download <strong className="text-white">sentinel-extension-chrome.zip</strong> above and extract the folder to your computer.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-cyan-500/30">2</span>
                      <p className="pt-0.5">
                        Open a new browser tab and navigate to <code className="px-1.5 py-0.5 rounded bg-slate-950 font-mono text-cyan-200 border border-white/10">chrome://extensions</code> (or <code className="px-1.5 py-0.5 rounded bg-slate-950 font-mono text-cyan-200 border border-white/10">brave://extensions</code> / <code className="px-1.5 py-0.5 rounded bg-slate-950 font-mono text-cyan-200 border border-white/10">edge://extensions</code>).
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-cyan-500/30">3</span>
                      <p className="pt-0.5">
                        In the top-right corner, switch the <strong className="text-white">Developer mode</strong> toggle to <strong className="text-cyan-300">ON</strong>.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-cyan-500/30">4</span>
                      <p className="pt-0.5">
                        Click the <strong className="text-white">Load unpacked</strong> button that appears in the top-left subheader.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-cyan-500/30">5</span>
                      <p className="pt-0.5">
                        Select the unzipped folder. <strong className="text-white">Sentinel Autofill Bridge (v1.1.0)</strong> will load immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3.5 text-xs">
                {/* Download Card */}
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-amber-300 text-xs">Firefox Add-on Package (Gecko MV3)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Native Gecko manifest with strict background script specifications</div>
                  </div>
                  <a
                    href="/sentinel-extension-firefox.zip"
                    download="sentinel-extension-firefox.zip"
                    className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download (.zip)</span>
                  </a>
                </div>

                {/* Installation Steps */}
                <div className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-3">
                  <div className="text-xs font-bold text-slate-200">Installation Steps for Mozilla Firefox:</div>
                  <div className="space-y-2 text-[11px] text-slate-300">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-amber-500/30">1</span>
                      <p className="pt-0.5">
                        Download <strong className="text-white">sentinel-extension-firefox.zip</strong> above.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-amber-500/30">2</span>
                      <p className="pt-0.5">
                        Open a new tab in Firefox and navigate to <code className="px-1.5 py-0.5 rounded bg-slate-950 font-mono text-amber-200 border border-white/10">about:debugging#/runtime/this-firefox</code>.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-amber-500/30">3</span>
                      <p className="pt-0.5">
                        Under the <strong className="text-white">Temporary Extensions</strong> section, click <strong className="text-amber-300">Load Temporary Add-on...</strong>.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-amber-500/30">4</span>
                      <p className="pt-0.5">
                        Select the downloaded <code className="text-white font-mono">sentinel-extension-firefox.zip</code> file (or unzip and select its <code className="text-white font-mono">manifest.json</code>).
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-amber-500/30">5</span>
                      <p className="pt-0.5">
                        Sentinel Autofill Bridge will appear under active add-ons with ID <code className="text-amber-200 font-mono">sentinel-autofill@sentinel.security</code>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Zero-Trust Security Guarantee Banner */}
            <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-white/10 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-200">Zero-Trust Memory Quarantine</div>
              <p>
                The extension does not store passwords in local storage or cookies. It holds credentials ephemerally in RAM only after your mobile push 2-digit number match is verified, and immediately zeroes memory upon field injection or within 60 seconds.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="text-[11px] text-slate-400">
                Need source code? Check <code className="text-cyan-300 font-mono">sentinel-extension/</code> in the repo.
              </div>
              <button
                type="button"
                onClick={() => setShowExtensionGuideModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation Customizer Modal */}
      {navCustomizerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-950 border border-white/10 p-6 shadow-2xl text-white">
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Customize Sidebar Navigation</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Configure personalized workspace navigation view and role presets</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNavCustomizerOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Account Role Presets */}
            <div className="mt-4">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                Quick Role Presets:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateSidebarPrefs({
                      applications: true,
                      userDirectory: isAdmin,
                      auditLogs: isAdmin,
                      apiDocs: !isEnterpriseEmployee,
                      connectService: !isEnterpriseEmployee,
                      mobileMfa: true,
                      downloadApp: true,
                      planBilling: isAdmin,
                      termsAgreements: true,
                    });
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors cursor-pointer text-center"
                >
                  IT Admin View
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateSidebarPrefs({
                      applications: true,
                      userDirectory: false,
                      auditLogs: false,
                      apiDocs: !isEnterpriseEmployee,
                      connectService: !isEnterpriseEmployee,
                      mobileMfa: true,
                      downloadApp: true,
                      planBilling: false,
                      termsAgreements: true,
                    });
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors cursor-pointer text-center"
                >
                  Collaborator
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateSidebarPrefs({
                      applications: true,
                      userDirectory: false,
                      auditLogs: false,
                      apiDocs: false,
                      connectService: false,
                      mobileMfa: true,
                      downloadApp: true,
                      planBilling: false,
                      termsAgreements: true,
                    });
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors cursor-pointer text-center"
                >
                  Employee View
                </button>
              </div>
            </div>

            {/* Toggle Checklist */}
            <div className="mt-5 space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
              {[
                { key: "applications" as const, label: "Applications (Launchpad)", desc: "SSO Application dashboard & assigned services", disabled: false },
                { key: "userDirectory" as const, label: "User Directory", desc: "Employee directory and identity provisioning", disabled: !isAdmin, restrictionText: "Requires Admin Role" },
                { key: "auditLogs" as const, label: "Audit Logs", desc: "Real-time compliance activity feed", disabled: !isAdmin, restrictionText: "Requires Admin Role" },
                { key: "apiDocs" as const, label: "Developer API & Docs", desc: "Identity Gateway protocols and code samples", disabled: isEnterpriseEmployee, restrictionText: "Restricted by Policy" },
                { key: "connectService" as const, label: "Connect Service", desc: "Integrate custom SaaS and OAuth services", disabled: isEnterpriseEmployee, restrictionText: "Restricted by Policy" },
                { key: "mobileMfa" as const, label: "Pair Mobile 2FA", desc: "Sentinel Authenticator key pairing", disabled: false },
                { key: "downloadApp" as const, label: "Download Mobile App", desc: "Mobile Authenticator APK download link", disabled: false },
                { key: "planBilling" as const, label: "Subscription & Billing", desc: "Enterprise plan upgrade & billing invoices", disabled: !isAdmin, restrictionText: "Requires Admin Role" },
                { key: "termsAgreements" as const, label: "Terms & Agreements", desc: "Compliance terms and privacy policies", disabled: false },
              ].map((item) => (
                <div
                  key={item.key}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    item.disabled
                      ? "bg-slate-900/20 border-white/5 opacity-50"
                      : "bg-slate-900/60 border-white/10 hover:border-cyan-500/30"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{item.label}</span>
                      {item.disabled && item.restrictionText && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                          {item.restrictionText}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                  </div>

                  <input
                    type="checkbox"
                    checked={item.disabled ? false : Boolean(sidebarPrefs[item.key])}
                    disabled={item.disabled}
                    onChange={(e) => {
                      updateSidebarPrefs({
                        ...sidebarPrefs,
                        [item.key]: e.target.checked,
                      });
                    }}
                    className="w-4 h-4 rounded border-white/20 bg-slate-950 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const defaultPrefs: SidebarPreferences = {
                    applications: true,
                    userDirectory: isAdmin,
                    auditLogs: isAdmin,
                    apiDocs: !isEnterpriseEmployee,
                    connectService: !isEnterpriseEmployee,
                    mobileMfa: true,
                    downloadApp: true,
                    planBilling: isAdmin,
                    termsAgreements: true,
                  };
                  updateSidebarPrefs(defaultPrefs);
                }}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Reset to Defaults
              </button>

              <button
                type="button"
                onClick={() => setNavCustomizerOpen(false)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
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
