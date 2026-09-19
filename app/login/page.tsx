"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginUser({ email, password });
      if (res.success) {
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
      } else {
        setError(res.message || "Invalid credentials.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
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

      <form onSubmit={handleSubmit}>
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

      <p style={{ marginTop: 20, fontSize: 14 }}>
        Don&apos;t have an account?{" "}
        <Link href="/register" style={{ color: "#0066cc" }}>
          Register here
        </Link>
      </p>
    </div>
  );
}
