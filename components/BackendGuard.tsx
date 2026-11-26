"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { getStoredSession } from "@/lib/session";

type BackendStatus = "checking" | "online" | "offline";

export interface NoticeModalState {
  title: string;
  message: string;
  type?: "error" | "info" | "success";
  detail?: string;
}

interface BackendGuardContextValue {
  backendStatus: BackendStatus;
  showNoticeModal: (notice: NoticeModalState) => void;
  retryHealthCheck: () => void;
}

const BackendGuardContext = createContext<BackendGuardContextValue>({
  backendStatus: "checking",
  showNoticeModal: () => {},
  retryHealthCheck: () => {},
});

export function useBackendGuard() {
  return useContext(BackendGuardContext);
}

const INTERACTIVE_PREFIXES = [
  "/login",
  "/register",
  "/dashboard",
  "/users",
  "/pricing",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/status",
  "/apps",
];

const BACKGROUND_PATHS = [
  "/api/health",
  "/api/audit/event",
  "/api/auth/validate",
  "/api/status/system",
  "/api/mfa/status/",
  "/api/mfa/pending/",
];

function resolveErrorTitle(url: string, status: number): string {
  if (url.includes("/api/auth/register")) return "Registration Problem";
  if (url.includes("/api/auth/login")) return "Sign-In Problem";
  if (url.includes("/password") || url.includes("/reset-password") || url.includes("/forgot-password")) {
    return "Password Action Problem";
  }
  if (url.includes("/api/billing")) return "Billing & Subscription Problem";
  if (url.includes("/api/mfa")) return "MFA Verification Problem";
  if (url.includes("/api/admin")) return "Admin Action Problem";
  if (status >= 500) return "Backend Server Error";
  return "Action Could Not Be Completed";
}

function playAlertTone(type?: "error" | "info" | "success") {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const frequencies = type === "success" ? [523.25, 659.25] : type === "info" ? [440, 523.25] : [330, 261.63];

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);
      gain.gain.setValueAtTime(0.08, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.15);
    });

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 500);
  } catch {
    // Ignore audio context restrictions
  }
}

export default function BackendGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [noticeModal, setNoticeModal] = useState<NoticeModalState | null>(null);
  const prewarmedRef = useRef(false);
  const originalFetchRef = useRef<typeof window.fetch | null>(null);

  const shouldBlockRoute = Boolean(
    pathname &&
      !pathname.startsWith("/dw") &&
      INTERACTIVE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))
  );

  const showNoticeModal = useCallback((notice: NoticeModalState) => {
    setNoticeModal(notice);
  }, []);

  useEffect(() => {
    if (noticeModal) {
      playAlertTone(noticeModal.type);
    }
  }, [noticeModal]);

  const runBackgroundPrewarm = useCallback(() => {
    if (prewarmedRef.current) return;
    prewarmedRef.current = true;
    const rawFetch = originalFetchRef.current || window.fetch.bind(window);

    try {
      const session = getStoredSession();
      if (session?.user?.userId) {
        rawFetch(`${API_BASE_URL}/api/auth/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.userId }),
        }).catch(() => {});

        const role = session.user.role?.toUpperCase();
        if (role === "ADMIN" || role === "SUPER_ADMIN") {
          rawFetch(`${API_BASE_URL}/api/admin/audit-logs?limit=5`, {
            method: "GET",
            headers: session.token ? { Authorization: `Bearer ${session.token}` } : {},
            cache: "no-store",
          }).catch(() => {});
        }
      }
    } catch {
      // Ignore prewarm errors
    }
  }, []);

  const probeHealth = useCallback(async () => {
    const rawFetch = originalFetchRef.current || window.fetch.bind(window);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await rawFetch(`${API_BASE_URL}/api/health`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        setBackendStatus("online");
        setElapsedSeconds(0);
        runBackgroundPrewarm();
      } else {
        setBackendStatus("offline");
      }
    } catch {
      clearTimeout(timeoutId);
      setBackendStatus("offline");
    }
  }, [runBackgroundPrewarm]);

  const retryHealthCheck = useCallback(() => {
    setBackendStatus("checking");
    probeHealth();
  }, [probeHealth]);

  // Initial health probe + retry loop while backend is not online
  useEffect(() => {
    probeHealth();
  }, [probeHealth]);

  useEffect(() => {
    if (backendStatus === "online") return;

    const retryInterval = setInterval(() => {
      probeHealth();
    }, 3000);

    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(retryInterval);
      clearInterval(timerInterval);
    };
  }, [backendStatus, probeHealth]);

  // Global fetch interceptor for user-triggered API calls to API_BASE_URL
  useEffect(() => {
    if (typeof window === "undefined") return;

    const nativeFetch = window.fetch.bind(window);
    originalFetchRef.current = nativeFetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const isApiCall = url.startsWith(API_BASE_URL);
      const isBackground = BACKGROUND_PATHS.some((path) => url.includes(path));

      if (!isApiCall || isBackground) {
        return nativeFetch(input, init);
      }

      try {
        const res = await nativeFetch(input, init);

        if (res.status === 502 || res.status === 503 || res.status === 504) {
          setBackendStatus("offline");
          setNoticeModal({
            title: `Backend Service Unavailable (HTTP ${res.status})`,
            message:
              "The backend server is currently waking up, restarting, or compiling. Please wait a few seconds and try again.",
            type: "error",
          });
          probeHealth();
          return res;
        }

        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          try {
            const cloned = res.clone();
            const data = await cloned.json();
            if (!res.ok || data?.success === false) {
              const serverMsg =
                data?.message ||
                data?.error ||
                `The server rejected this request (HTTP ${res.status}).`;
              setNoticeModal({
                title: resolveErrorTitle(url, res.status),
                message: serverMsg,
                type: "error",
                detail: `HTTP ${res.status}`,
              });
            }
          } catch {
            // Non-JSON or unreadable body; ignore
          }
        } else if (!res.ok) {
          setNoticeModal({
            title: resolveErrorTitle(url, res.status),
            message: `Request failed with status HTTP ${res.status}. Please try again.`,
            type: "error",
          });
        }

        return res;
      } catch (err) {
        setBackendStatus("offline");
        setNoticeModal({
          title: "Backend Connection Failed",
          message:
            "Cannot reach the Sentinel backend server right now. It may be offline, compiling, or your internet connection dropped. Please wait and retry.",
          type: "error",
          detail: err instanceof Error ? err.message : undefined,
        });
        probeHealth();
        throw err;
      }
    };

    return () => {
      if (originalFetchRef.current) {
        window.fetch = originalFetchRef.current;
      }
    };
  }, [probeHealth]);

  return (
    <BackendGuardContext.Provider value={{ backendStatus, showNoticeModal, retryHealthCheck }}>
      {children}

      {/* Full-Screen Backend Loading / Compiling Gate */}
      {shouldBlockRoute && backendStatus !== "online" && (
        <div
          className="fixed inset-0 z-[9998] bg-black/95 backdrop-blur-sm flex items-center justify-center p-6 no-print"
          role="dialog"
          aria-modal="true"
          aria-label="Backend Connection Gate"
        >
          <div className="w-full max-w-md rounded-2xl bg-surface-card border border-line-accent p-6 space-y-4 text-center shadow-2xl">
            <div className="w-10 h-10 mx-auto rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-ink-primary tracking-tight">
                {elapsedSeconds >= 3
                  ? "Backend Is Compiling or Waking Up"
                  : "Connecting to Sentinel Backend..."}
              </h2>
              <p className="text-xs text-ink-muted leading-relaxed">
                Waiting for the backend API gateway to respond before allowing actions. This prevents failed clicks while the server is starting or compiling.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-surface-elevated border border-line-subtle text-xs font-mono text-ink-secondary flex items-center justify-between">
              <span>Status: {backendStatus === "checking" ? "PROBING" : "OFFLINE / RETRYING"}</span>
              <span className="text-accent-text">{elapsedSeconds}s elapsed</span>
            </div>

            <button
              type="button"
              onClick={retryHealthCheck}
              className="w-full py-2.5 px-4 rounded-xl bg-accent-primary hover:bg-accent-primary-hover text-accent-primary-fg font-bold text-xs transition-colors cursor-pointer"
            >
              Retry Connection Now
            </button>
          </div>
        </div>
      )}

      {/* Global Action Problem / Notice Modal */}
      {noticeModal && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 no-print"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="backend-guard-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-surface-card border border-line-subtle p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-line-subtle">
              <div>
                <span
                  className={`text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                    noticeModal.type === "success"
                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                      : noticeModal.type === "info"
                      ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                      : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                  }`}
                >
                  {noticeModal.type === "success"
                    ? "Notice"
                    : noticeModal.type === "info"
                    ? "Information"
                    : "Action Alert"}
                </span>
                <h3
                  id="backend-guard-modal-title"
                  className="text-base font-bold text-ink-primary mt-2"
                >
                  {noticeModal.title}
                </h3>
              </div>
              {noticeModal.detail && (
                <span className="text-[10px] font-mono text-ink-muted bg-surface-elevated px-2 py-0.5 rounded border border-line-subtle shrink-0">
                  {noticeModal.detail}
                </span>
              )}
            </div>

            <p className="text-xs text-ink-secondary leading-relaxed break-words">
              {noticeModal.message}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNoticeModal(null)}
                className="px-5 py-2 rounded-xl bg-accent-primary hover:bg-accent-primary-hover text-accent-primary-fg font-bold text-xs transition-colors cursor-pointer"
              >
                OK, Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </BackendGuardContext.Provider>
  );
}
