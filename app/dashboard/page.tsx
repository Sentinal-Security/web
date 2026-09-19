"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setupMfa, verifyMfaSetup, disableMfa } from "@/lib/api";

interface UserProfile {
  userId: number;
  email: string;
  fullName?: string;
  mfaEnabled: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  // Pairing State
  const [pairingOpen, setPairingOpen] = useState(false);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [otpAuthUri, setOtpAuthUri] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("sentinal_user");
    if (!raw) {
      router.push("/login");
      return;
    }
    try {
      setUser(JSON.parse(raw));
    } catch {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("sentinal_user");
    router.push("/login");
  };

  const handleStartPairing = async () => {
    if (!user) return;
    setFeedback(null);
    setActionLoading(true);

    try {
      const res = await setupMfa(user.userId);
      if (res.success && res.secretKey) {
        setSecretKey(res.secretKey);
        setOtpAuthUri(res.otpAuthUri || "");
        setPairingOpen(true);
      } else {
        setFeedback({ type: "error", message: res.message || "Failed to initiate MFA pairing." });
      }
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Network error." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPairing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFeedback(null);
    setActionLoading(true);

    try {
      const res = await verifyMfaSetup(user.userId, pairingCode);
      if (res.success) {
        const updatedUser = { ...user, mfaEnabled: true };
        setUser(updatedUser);
        localStorage.setItem("sentinal_user", JSON.stringify(updatedUser));
        setPairingOpen(false);
        setSecretKey(null);
        setPairingCode("");
        setFeedback({ type: "success", message: "Mobile Authenticator successfully paired and activated!" });
      } else {
        setFeedback({ type: "error", message: res.message || "Invalid 6-digit code. Please try again." });
      }
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Verification error." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!user) return;
    if (!confirm("Are you sure you want to disable Multi-Factor Authentication?")) return;
    setFeedback(null);
    setActionLoading(true);

    try {
      const res = await disableMfa(user.userId);
      if (res.success) {
        const updatedUser = { ...user, mfaEnabled: false };
        setUser(updatedUser);
        localStorage.setItem("sentinal_user", JSON.stringify(updatedUser));
        setPairingOpen(false);
        setFeedback({ type: "success", message: "MFA has been disabled." });
      } else {
        setFeedback({ type: "error", message: res.message || "Failed to disable MFA." });
      }
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error disabling MFA." });
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) {
    return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Loading session...</div>;
  }

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 24, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ccc", paddingBottom: 12 }}>
        <h2>IAM Dashboard</h2>
        <button
          onClick={handleLogout}
          style={{ padding: "6px 14px", background: "#f44336", color: "#fff", border: "none", cursor: "pointer", borderRadius: 4 }}
        >
          Sign Out
        </button>
      </div>

      {feedback && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: feedback.type === "success" ? "#e8f5e9" : "#ffebee",
            color: feedback.type === "success" ? "#2e7d32" : "#c62828",
            borderRadius: 4,
          }}
        >
          {feedback.message}
        </div>
      )}

      <div style={{ marginTop: 24, padding: 16, border: "1px solid #e0e0e0", borderRadius: 6, background: "#fafafa" }}>
        <h3>User Profile</h3>
        <p><strong>Full Name:</strong> {user.fullName || "N/A"}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>User ID:</strong> #{user.userId}</p>
      </div>

      <div style={{ marginTop: 24, padding: 16, border: "1px solid #e0e0e0", borderRadius: 6 }}>
        <h3>Multi-Factor Authentication (MFA)</h3>
        <p>
          Status:{" "}
          <strong style={{ color: user.mfaEnabled ? "#2e7d32" : "#d32f2f" }}>
            {user.mfaEnabled ? "Enabled (Authenticator Paired)" : "Disabled (Not Paired)"}
          </strong>
        </p>
        <p style={{ color: "#555", fontSize: 14 }}>
          {user.mfaEnabled
            ? "Your account is protected. Login attempts require approval from your Sentinal Mobile Authenticator app."
            : "Protect your account with 2-step verification using the Sentinal Mobile Authenticator app."}
        </p>

        {!user.mfaEnabled ? (
          <button
            onClick={handleStartPairing}
            disabled={actionLoading}
            style={{ padding: "8px 16px", background: "#1976d2", color: "#fff", border: "none", cursor: "pointer", borderRadius: 4, fontWeight: "bold" }}
          >
            {actionLoading ? "Generating Secret..." : "Pair Mobile Authenticator App"}
          </button>
        ) : (
          <button
            onClick={handleDisableMfa}
            disabled={actionLoading}
            style={{ padding: "8px 16px", background: "#f44336", color: "#fff", border: "none", cursor: "pointer", borderRadius: 4 }}
          >
            {actionLoading ? "Processing..." : "Disable MFA"}
          </button>
        )}

        {pairingOpen && secretKey && (
          <div style={{ marginTop: 20, padding: 16, border: "1px dashed #1976d2", borderRadius: 6, background: "#f0f7ff" }}>
            <h4>Device Pairing Instructions</h4>
            <p style={{ fontSize: 14 }}>
              Open your <strong>Sentinal Mobile Authenticator Android App</strong> (or Google Authenticator) and add a new account using this Secret Key:
            </p>

            <div style={{ margin: "12px 0", padding: 10, background: "#fff", border: "1px solid #ccc", fontFamily: "monospace", fontSize: 16, textAlign: "center", letterSpacing: 2 }}>
              {secretKey}
            </div>

            {otpAuthUri && (
              <p style={{ fontSize: 12, color: "#666", wordBreak: "break-all" }}>
                <strong>OTPAuth URI:</strong> {otpAuthUri}
              </p>
            )}

            <form onSubmit={handleConfirmPairing} style={{ marginTop: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: "bold", fontSize: 14 }}>
                Enter the 6-digit code shown on your Mobile Authenticator:
              </label>
              <input
                type="text"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                style={{ width: 180, padding: 8, fontSize: 16, textAlign: "center", letterSpacing: 3, marginRight: 10 }}
              />
              <button
                type="submit"
                disabled={actionLoading || pairingCode.length !== 6}
                style={{
                  padding: "8px 16px",
                  background: "#2e7d32",
                  color: "#fff",
                  border: "none",
                  cursor: actionLoading || pairingCode.length !== 6 ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  borderRadius: 4,
                }}
              >
                {actionLoading ? "Verifying..." : "Verify & Activate MFA"}
              </button>
              <button
                type="button"
                onClick={() => setPairingOpen(false)}
                style={{ marginLeft: 8, padding: "8px 14px", background: "transparent", border: "1px solid #ccc", cursor: "pointer", borderRadius: 4 }}
              >
                Cancel
              </button>
            </form>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <Link href="/" style={{ color: "#0066cc", fontSize: 14 }}>
          &larr; Back to Portal Home
        </Link>
      </div>
    </div>
  );
}
