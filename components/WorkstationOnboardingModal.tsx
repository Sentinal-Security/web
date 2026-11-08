"use client";

import React, { useState, useEffect } from "react";
import { User } from "@/types/auth";
import { changeUserPassword, setupMfa, verifyMfaSetup } from "@/lib/api";
import { updateStoredUser, clearSession } from "@/lib/session";
import { PasswordToggleAdornment } from "@/components/PasswordToggleAdornment";
import { PasswordEntropyMeter } from "@/components/PasswordEntropyMeter";

interface WorkstationOnboardingModalProps {
  user: User;
  ssoToken?: string | null;
  mfaMandated: boolean;
  onComplete: () => void;
}

export function WorkstationOnboardingModal({
  user,
  ssoToken,
  mfaMandated,
  onComplete,
}: WorkstationOnboardingModalProps) {
  // Determine starting step based on what is pending
  const [currentStep, setCurrentStep] = useState<"password" | "mfa" | "complete">(
    user.passwordResetRequired ? "password" : "mfa"
  );

  // Step 1: Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Step 2: MFA Pairing State
  const [setupData, setSetupData] = useState<{ secretKey?: string; otpAuthUri?: string; accountEmail?: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  // Password validation helpers
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?`~]/.test(newPassword);
  const hasLength = newPassword.length >= 8;
  const isPasswordComplex = hasUpper && hasLower && hasDigit && hasSpecial && hasLength;

  // Initialize MFA setup data when entering MFA step
  useEffect(() => {
    if (currentStep === "mfa" && !setupData && (!user.mfaEnabled || mfaMandated)) {
      setMfaLoading(true);
      setupMfa(user.userId)
        .then((res) => {
          setMfaLoading(false);
          if (res.success) {
            setSetupData(res);
          } else {
            setMfaError(res.message || "Failed to initialize MFA key generation.");
          }
        })
        .catch(() => {
          setMfaLoading(false);
          setMfaError("Network error initializing MFA security key.");
        });
    }
  }, [currentStep, setupData, user.userId, user.mfaEnabled, mfaMandated]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword.trim()) {
      setPasswordError("Please enter your current temporary password.");
      return;
    }
    if (!isPasswordComplex) {
      setPasswordError("New password must satisfy all security complexity rules.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await changeUserPassword({
        userId: user.userId,
        currentPassword,
        newPassword,
        currentToken: ssoToken || undefined,
        revokeOtherSessions: true,
      });

      setPasswordLoading(false);
      if (res.success) {
        updateStoredUser({ passwordResetRequired: false });
        if (mfaMandated && !user.mfaEnabled) {
          setCurrentStep("mfa");
        } else {
          setCurrentStep("complete");
        }
      } else {
        setPasswordError(res.message || "Failed to update password.");
      }
    } catch {
      setPasswordLoading(false);
      setPasswordError("Network error connecting to Sentinel Security Gateway.");
    }
  };

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaError("");

    const cleanCode = totpCode.replace(/\D/g, "").trim();
    if (cleanCode.length !== 6) {
      setMfaError("Please enter the complete 6-digit verification code from your authenticator.");
      return;
    }

    setMfaLoading(true);
    try {
      const res = await verifyMfaSetup({ userId: user.userId, code: cleanCode });
      setMfaLoading(false);

      if (res.success) {
        updateStoredUser({ mfaEnabled: true, passwordResetRequired: false });
        if (res.recoveryCodes && res.recoveryCodes.length > 0) {
          setRecoveryCodes(res.recoveryCodes);
        }
        setCurrentStep("complete");
      } else {
        setMfaError(res.message || "Invalid 6-digit verification code. Please check your authenticator clock.");
      }
    } catch {
      setMfaLoading(false);
      setMfaError("Network error verifying MFA passcode.");
    }
  };

  const handleCopyKey = () => {
    if (setupData?.secretKey) {
      navigator.clipboard.writeText(setupData.secretKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCancelAndSignOut = () => {
    clearSession();
    window.location.href = "/login";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-950 border border-cyan-500/30 p-6 sm:p-8 shadow-2xl text-white">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="text-base font-bold tracking-tight text-white font-orbitron">
                Workstation Security Onboarding
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Organization: <span className="text-cyan-300 font-mono font-semibold">{user.company || "Enterprise"}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleCancelAndSignOut}
            className="text-[11px] text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Sign out and cancel setup"
          >
            Sign Out
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                currentStep === "password"
                  ? "bg-cyan-500 text-slate-950"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              }`}
            >
              1
            </span>
            <span className={`text-xs ${currentStep === "password" ? "text-white font-semibold" : "text-slate-400"}`}>
              Rotate Password
            </span>
          </div>

          <div className="h-0.5 w-10 bg-white/10" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                currentStep === "mfa"
                  ? "bg-cyan-500 text-slate-950"
                  : currentStep === "complete"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-white/5 text-slate-500"
              }`}
            >
              2
            </span>
            <span className={`text-xs ${currentStep === "mfa" ? "text-white font-semibold" : "text-slate-400"}`}>
              Pair 2FA Device
            </span>
          </div>

          <div className="h-0.5 w-10 bg-white/10" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                currentStep === "complete" ? "bg-cyan-500 text-slate-950" : "bg-white/5 text-slate-500"
              }`}
            >
              3
            </span>
            <span className={`text-xs ${currentStep === "complete" ? "text-white font-semibold" : "text-slate-400"}`}>
              Activate
            </span>
          </div>
        </div>

        {/* Step 1: Change Temporary Password */}
        {currentStep === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Your account was created by your IT administrator with a temporary password. You must establish a permanent personal password before accessing company applications.
            </p>

            {passwordError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {passwordError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Current Temporary Password
              </label>
              <div className="relative flex items-center bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 focus-within:border-cyan-400 transition-all">
                <input
                  type={showCurrent ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter initial password provided by IT"
                  className="w-full bg-transparent border-none outline-none text-white text-xs placeholder-slate-500 pr-2"
                />
                <PasswordToggleAdornment show={showCurrent} onToggle={() => setShowCurrent((prev) => !prev)} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                New Permanent Password
              </label>
              <div className="relative flex items-center bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 focus-within:border-cyan-400 transition-all">
                <input
                  type={showNew ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters (mixed case, digit, symbol)"
                  className="w-full bg-transparent border-none outline-none text-white text-xs placeholder-slate-500 pr-2"
                />
                <PasswordToggleAdornment show={showNew} onToggle={() => setShowNew((prev) => !prev)} />
              </div>
              <PasswordEntropyMeter password={newPassword} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirm Permanent Password
              </label>
              <div className="relative flex items-center bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 focus-within:border-cyan-400 transition-all">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full bg-transparent border-none outline-none text-white text-xs placeholder-slate-500 pr-2"
                />
                <PasswordToggleAdornment show={showConfirm} onToggle={() => setShowConfirm((prev) => !prev)} />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading || !isPasswordComplex}
              className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              {passwordLoading ? "Updating Credentials..." : "Save Password & Continue"}
            </button>
          </form>
        )}

        {/* Step 2: Mandatory MFA Pairing */}
        {currentStep === "mfa" && (
          <form onSubmit={handleVerifyTotp} className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Your company mandates Multi-Factor Authentication. Scan this QR code using the <strong className="text-white">Sentinel Authenticator</strong> mobile app on Android.
            </p>

            {mfaError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {mfaError}
              </div>
            )}

            {mfaLoading && !setupData ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-400">Generating secure device key...</p>
              </div>
            ) : setupData ? (
              <div className="space-y-3.5">
                {setupData.otpAuthUri && (
                  <div className="flex flex-col items-center p-3 rounded-xl bg-slate-900 border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setupData.otpAuthUri)}`}
                      alt="Authenticator QR Code"
                      className="w-32 h-32 rounded-lg bg-white p-2 object-contain"
                    />
                    <span className="text-[10px] text-slate-400 mt-2 font-mono">{setupData.accountEmail || user.email}</span>
                  </div>
                )}

                {setupData.secretKey && (
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 mb-1">
                      Manual Secret Key (If Camera Unavailable)
                    </label>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-white/10">
                      <code className="text-[11px] text-cyan-300 font-mono tracking-wider flex-1 truncate">
                        {setupData.secretKey}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white transition-colors cursor-pointer"
                      >
                        {copiedKey ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 text-center">
                    Enter 6-Digit Code from Phone
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="000000"
                    className="w-full text-center text-lg tracking-[0.3em] font-mono font-bold bg-slate-900 border border-white/15 rounded-xl py-2 text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={mfaLoading || totpCode.length !== 6}
                  className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  {mfaLoading ? "Verifying..." : "Verify & Activate Device"}
                </button>
              </div>
            ) : null}
          </form>
        )}

        {/* Step 3: Confirmation & Emergency Recovery Codes */}
        {currentStep === "complete" && (
          <div className="space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Workstation Profile Ready</h3>
              <p className="text-xs text-slate-300 mt-1">
                Your credentials and mobile authenticator pairing have been verified. You may now enter your enterprise workstation launchpad.
              </p>
            </div>

            {recoveryCodes.length > 0 && (
              <div className="text-left p-3.5 rounded-xl bg-slate-900 border border-white/10 space-y-2">
                <p className="text-[11px] font-semibold text-slate-200">
                  Backup Recovery Codes (Single-Use):
                </p>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-cyan-300">
                  {recoveryCodes.map((code, idx) => (
                    <div key={idx} className="p-1 rounded bg-black/40 text-center border border-white/5">
                      {code}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500">
                  Save these codes in a secure place in case you lose access to your mobile device.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={onComplete}
              className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              Enter Workstation Launchpad
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
