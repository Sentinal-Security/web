"use client";

import { useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getStoredSession } from "@/lib/session";

/**
 * Intelligent background pre-warmer.
 * Pings the Render backend health and session verification endpoints silently
 * on page mount to wake up the Spring Boot container before user interactions.
 */
export default function Prewarmer() {
  useEffect(() => {
    // 1. Always wake up the Spring Boot backend gateway silently
    try {
      fetch(`${API_BASE_URL}/api/health`, {
        method: "GET",
        cache: "no-store",
      }).catch(() => {
        // Silently swallow errors during background wake-up
      });
    } catch {
      // Ignore
    }

    // 2. Check if an authenticated user session exists in client storage
    try {
      const session = getStoredSession();
      if (session?.user?.userId) {
        // Validate user session in the background
        fetch(`${API_BASE_URL}/api/auth/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.userId }),
        }).catch(() => {
          // Silently swallow background validation
        });

        // 3. If user is an ADMIN or SUPER_ADMIN, warm admin audit service
        const role = session.user.role?.toUpperCase();
        if (role === "ADMIN" || role === "SUPER_ADMIN") {
          fetch(`${API_BASE_URL}/api/admin/audit-logs?limit=5`, {
            method: "GET",
            headers: session.token ? { Authorization: `Bearer ${session.token}` } : {},
            cache: "no-store",
          }).catch(() => {
            // Silently swallow background admin query
          });
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  return null;
}
