"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface InactivityTimeoutOptions {
  timeoutMinutes?: number;
  warningSeconds?: number;
  onTimeout: () => void;
  enabled?: boolean;
}

export function useInactivityTimeout({
  timeoutMinutes = 15,
  warningSeconds = 60,
  onTimeout,
  enabled = true,
}: InactivityTimeoutOptions) {
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(warningSeconds);

  const lastActivityRef = useRef<number>(Date.now());
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalIdleMs = timeoutMinutes * 60 * 1000;
  const warningThresholdMs = totalIdleMs - warningSeconds * 1000;

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (isWarningOpen) {
      setIsWarningOpen(false);
      setSecondsRemaining(warningSeconds);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
  }, [isWarningOpen, warningSeconds]);

  const extendSession = useCallback(() => {
    resetActivity();
  }, [resetActivity]);

  useEffect(() => {
    if (!enabled) return;

    const handleUserActivity = () => {
      // If warning modal is open, do not silently dismiss on mouse move;
      // user must explicitly click "Stay Signed In".
      if (!isWarningOpen) {
        lastActivityRef.current = Date.now();
      }
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Provide a developer/panelist trigger for instant demo: window.__triggerSentinelInactivity()
    (window as any).__triggerSentinelInactivity = () => {
      setIsWarningOpen(true);
      setSecondsRemaining(warningSeconds);
    };

    checkIntervalRef.current = setInterval(() => {
      if (isWarningOpen) return;

      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs >= warningThresholdMs) {
        setIsWarningOpen(true);
        setSecondsRemaining(warningSeconds);
      }
    }, 5000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [enabled, isWarningOpen, warningThresholdMs, warningSeconds]);

  // Handle countdown when warning modal is active
  useEffect(() => {
    if (!isWarningOpen) return;

    countdownIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setIsWarningOpen(false);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [isWarningOpen, onTimeout]);

  return {
    isWarningOpen,
    secondsRemaining,
    extendSession,
  };
}
