"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser, verifyMfaLogin } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MFA Challenge State
  const [mfaChallenge, setMfaChallenge] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  const [totpCode, setTotpCode] = useState("");

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginUser({ email, password });
      if (res.success) {
        if (res.mfaRequired) {
          setMfaChallenge(true);
          setPendingUserId(res.userId || null);
        } else {
          localStorage.setItem(
            "sentinal_user",
            JSON.stringify({
              userId: res.userId,
              email: res.email,
              fullName: res.fullName,
              mfaEnabled: res.mfaEnabled,
            })
          );
          router.push("/dashboard");
        }
      } else {
        setError(res.message || "Invalid credentials.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await verifyMfaLogin({
        userId: pendingUserId || undefined,
        email: email,
        code: totpCode,
      });

      if (res.success) {
        localStorage.setItem(
          "sentinal_user",
          JSON.stringify({
            userId: res.userId,
            email: res.email,
            fullName: res.fullName,
            mfaEnabled: true,
          })
        );
        router.push("/dashboard");
      } else {
        setError(res.message || "Invalid MFA code. Please try again.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 24, fontFamily: "sans-serif" }}>
      <h2>Sign In</h2>
      <p style={{ color: "#666", marginBottom: 20 }}>Sentinal Security IAM Portal</p>

      {error && (
        <div style={{ padding: 12, background: "#ffebee", color: "#c62828", marginBottom: 16, borderRadius: 4 }}>
          {error}
        </div>
      )}

      {!mfaChallenge ? (
        <form onSubmit={handlePasswordSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
              placeholder="user@example.com"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 10,
              background: "#000",
              color: "#fff",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleMfaSubmit}>
          <div style={{ padding: 12, background: "#e3f2fd", marginBottom: 16, borderRadius: 4 }}>
            <strong>Two-Factor Authentication Required</strong>
            <p style={{ margin: "6px 0 0 0", fontSize: 13 }}>
              Enter the 6-digit verification code from your Sentinal Mobile Authenticator app for <strong>{email}</strong>.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>6-Digit Security Code</label>
            <input
              type="text"
              required
              maxLength={6}
              pattern="[0-9]{6}"
              autoFocus
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              style={{ width: "100%", padding: 10, fontSize: 18, letterSpacing: 4, textAlign: "center", boxSizing: "border-box" }}
              placeholder="123456"
            />
          </div>

          <button
            type="submit"
            disabled={loading || totpCode.length !== 6}
            style={{
              width: "100%",
              padding: 10,
              background: "#1976d2",
              color: "#fff",
              border: "none",
              cursor: loading || totpCode.length !== 6 ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {loading ? "Verifying..." : "Verify & Complete Sign In"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMfaChallenge(false);
              setTotpCode("");
              setError(null);
            }}
            style={{
              width: "100%",
              marginTop: 10,
              padding: 8,
              background: "transparent",
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            Cancel & Back to Password
          </button>
        </form>
      )}

      <p style={{ marginTop: 20, fontSize: 14 }}>
        Don&apos;t have an account?{" "}
        <Link href="/register" style={{ color: "#0066cc" }}>
          Register here
        </Link>
      </p>
    </div>
  );
}
