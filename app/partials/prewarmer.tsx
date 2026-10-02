"use client";

import { useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";

/**
 * Invisible background pre-warmer.
 * Pings the Render backend health endpoint silently on page mount
 * to trigger cold-start warm-up without any visible UI impact.
 */
export default function Prewarmer() {
  useEffect(() => {
    // Non-blocking silent pre-warm
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
  }, []);

  return null;
}
