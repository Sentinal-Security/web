"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface BuildItem {
  id: string;
  name: string;
  type: string;
  branch: string;
  commit: string;
  downloadUrl: string;
  finishedAt: string;
}

export default function DownloadsPage() {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [builds, setBuilds] = useState<BuildItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBuilds = useCallback(async (pw: string) => {
    if (pw !== "seanisbtter") {
      setError("Invalid password. Access denied.");
      setIsUnlocked(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const allBuilds: BuildItem[] = [];

      // 1. Fetch from Next.js local static registry
      try {
        const resLocal = await fetch(`/api/builds?password=${encodeURIComponent(pw)}`);
        const dataLocal = await resLocal.json();
        if (dataLocal.success && Array.isArray(dataLocal.builds)) {
          allBuilds.push(...dataLocal.builds);
        }
      } catch {}

      // 2. Fetch from Central Supabase backend
      try {
        const resBackend = await fetch(
          `https://backend-pi68.onrender.com/api/builds?password=${encodeURIComponent(pw)}`
        );
        const dataBackend = await resBackend.json();
        if (dataBackend.success && Array.isArray(dataBackend.builds)) {
          allBuilds.push(...dataBackend.builds);
        }
      } catch {}

      setIsUnlocked(true);
      sessionStorage.setItem("sentinal_dw_auth", pw);

      // Deduplicate and sort by finishedAt descending
      const unique = Array.from(new Map(allBuilds.map((b) => [b.name + b.finishedAt, b])).values());
      unique.sort((a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime());
      setBuilds(unique);
    } catch {
      setError("Network error fetching builds.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("sentinal_dw_auth");
    if (saved) {
      setPassword(saved);
      fetchBuilds(saved);
    }
  }, [fetchBuilds]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter the password.");
      return;
    }
    fetchBuilds(password.trim());
  };

  const handleLock = () => {
    sessionStorage.removeItem("sentinal_dw_auth");
    setIsUnlocked(false);
    setPassword("");
    setBuilds([]);
    setError(null);
  };

  const format12Hour = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 24, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ccc", paddingBottom: 12 }}>
        <h2>Build Downloads & Artifacts (/dw)</h2>
        {isUnlocked && (
          <button
            onClick={handleLock}
            style={{ padding: "6px 12px", background: "#d32f2f", color: "#fff", border: "none", cursor: "pointer", borderRadius: 4 }}
          >
            Lock Portal
          </button>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 16, padding: 12, background: "#ffebee", color: "#c62828", borderRadius: 4 }}>
          {error}
        </div>
      )}

      {!isUnlocked ? (
        <div style={{ marginTop: 24, padding: 20, border: "1px solid #ddd", borderRadius: 6, background: "#fafafa" }}>
          <h3>Protected Downloads Access</h3>
          <p style={{ color: "#555", fontSize: 14 }}>
            Enter the authorization password to view and download mobile application builds.
          </p>
          <form onSubmit={handlePasswordSubmit} style={{ marginTop: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: "bold", fontSize: 14 }}>
              Access Password
            </label>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{ width: "100%", maxWidth: 300, padding: 8, fontSize: 14, boxSizing: "border-box", marginBottom: 12 }}
            />
            <div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  background: "#000",
                  color: "#fff",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  borderRadius: 4,
                  fontWeight: "bold",
                }}
              >
                {loading ? "Verifying..." : "View Builds"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3>Available Builds ({builds.length})</h3>
            <button
              onClick={() => fetchBuilds(password)}
              style={{ padding: "4px 10px", background: "#f0f0f0", border: "1px solid #ccc", cursor: "pointer", borderRadius: 4, fontSize: 12 }}
            >
              Refresh List
            </button>
          </div>

          {builds.length === 0 ? (
            <p style={{ color: "#666", padding: 16, background: "#f9f9f9", borderRadius: 4 }}>
              No builds recorded yet. New builds will automatically appear here once published from CI/CD.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {builds.map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: 16,
                    border: "1px solid #ccc",
                    borderRadius: 6,
                    background: "#ffffff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <strong style={{ fontSize: 15 }}>{b.name}</strong>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 6px",
                          background: "#e3f2fd",
                          color: "#1565c0",
                          borderRadius: 3,
                          fontWeight: "bold",
                        }}
                      >
                        {b.type}
                      </span>
                    </div>

                    <p style={{ margin: "2px 0", fontSize: 13, color: "#333" }}>
                      <strong>Finished:</strong> {format12Hour(b.finishedAt)}
                    </p>

                    <p style={{ margin: "2px 0", fontSize: 12, color: "#666", fontFamily: "monospace" }}>
                      Branch: {b.branch} | Commit: {b.commit}
                    </p>
                  </div>

                  <div>
                    <a
                      href={b.downloadUrl}
                      download={b.name}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-block",
                        padding: "8px 16px",
                        background: "#2e7d32",
                        color: "#fff",
                        textDecoration: "none",
                        fontWeight: "bold",
                        borderRadius: 4,
                        fontSize: 13,
                      }}
                    >
                      Download Build
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        <Link href="/" style={{ color: "#0066cc", fontSize: 14 }}>
          &larr; Back to Portal Home
        </Link>
      </div>
    </div>
  );
}
