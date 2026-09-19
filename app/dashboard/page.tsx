"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserProfile {
  userId: number;
  email: string;
  fullName?: string;
  mfaEnabled: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

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
            ? "Your account is protected. Login attempts will require approval from your Sentinal Mobile Authenticator app."
            : "Protect your account with 2-step verification using the Sentinal Mobile Authenticator app."}
        </p>
        <button
          onClick={() => alert("Mobile Authenticator pairing will be activated in the next step!")}
          style={{ padding: "8px 16px", background: "#1976d2", color: "#fff", border: "none", cursor: "pointer", borderRadius: 4, fontWeight: "bold" }}
        >
          {user.mfaEnabled ? "Manage Authenticator Devices" : "Pair Mobile Authenticator App"}
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <Link href="/" style={{ color: "#0066cc", fontSize: 14 }}>
          &larr; Back to Portal Home
        </Link>
      </div>
    </div>
  );
}
