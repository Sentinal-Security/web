"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { checkBackendHealth, HealthResponse } from "@/lib/api";

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBackendHealth()
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ maxWidth: 560, margin: "60px auto", padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 4 }}>Sentinal Security</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Enterprise Identity & Access Management (Okta-like Portal)</p>

      {/* Backend & Database Status Card */}
      <div style={{ padding: 16, border: "1px solid #e0e0e0", borderRadius: 6, background: "#fafafa", marginBottom: 24 }}>
        <h4 style={{ margin: "0 0 10px 0" }}>System Status</h4>
        {loading && <p style={{ margin: 0, color: "#666" }}>Checking backend & database status...</p>}
        {error && (
          <p style={{ margin: 0, color: "#d32f2f" }}>
            Backend unreachable ({error}). Make sure backend is running.
          </p>
        )}
        {health && (
          <div>
            <p style={{ margin: "4px 0" }}>
              <strong>API Gateway:</strong>{" "}
              <span style={{ color: health.status === "UP" ? "#2e7d32" : "#d32f2f", fontWeight: "bold" }}>
                {health.status} ({health.service})
              </span>
            </p>
            <p style={{ margin: "4px 0" }}>
              <strong>Database:</strong>{" "}
              <span
                style={{
                  color: health.database?.includes("CONNECTED") ? "#2e7d32" : "#d32f2f",
                  fontWeight: "bold",
                }}
              >
                {health.database || "Checking..."}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Navigation Options */}
      <div style={{ display: "flex", gap: 12, marginBottom: 30 }}>
        <Link
          href="/login"
          style={{
            flex: 1,
            textAlign: "center",
            padding: "12px",
            background: "#000",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 4,
            fontWeight: "bold",
          }}
        >
          Sign In
        </Link>
        <Link
          href="/register"
          style={{
            flex: 1,
            textAlign: "center",
            padding: "12px",
            border: "1px solid #000",
            color: "#000",
            textDecoration: "none",
            borderRadius: 4,
            fontWeight: "bold",
          }}
        >
          Register
        </Link>
        <Link
          href="/dashboard"
          style={{
            flex: 1,
            textAlign: "center",
            padding: "12px",
            border: "1px solid #ccc",
            color: "#333",
            textDecoration: "none",
            borderRadius: 4,
          }}
        >
          Dashboard
        </Link>
      </div>

      <div style={{ fontSize: 13, color: "#888", borderTop: "1px solid #eee", paddingTop: 16 }}>
        Connected to Spring Boot backend: <code>https://backend-pi68.onrender.com</code>
      </div>
    </div>
  );
}
