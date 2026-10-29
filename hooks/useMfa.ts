"use client";

import { useState } from "react";
import {
  setupMfa,
  verifyMfaSetup,
  verifyMfaLogin,
  disableMfa,
  verifyRecoveryCode,
  AuthResponse,
  MfaSetupResponse,
} from "@/lib/api";

export function useMfa() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setup = async (userId: number): Promise<MfaSetupResponse> => {
    setLoading(true);
    setError(null);
    try {
      const res = await setupMfa(userId);
      if (!res.success) {
        setError(res.message);
      }
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to setup MFA.";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async (
    userId: number,
    code: string
  ): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    try {
      const res = await verifyMfaSetup({ userId, code });
      if (!res.success) {
        setError(res.message);
      }
      return res;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to verify MFA setup.";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const verifyLogin = async (
    userId: number | undefined,
    email: string | undefined,
    code: string
  ): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    try {
      const res = await verifyMfaLogin({ userId, email, code });
      if (!res.success) {
        setError(res.message);
      }
      return res;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to verify MFA login code.";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const disable = async (userId: number): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    try {
      const res = await disableMfa(userId);
      if (!res.success) {
        setError(res.message);
      }
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to disable MFA.";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const verifyRecovery = async (
    userId: number | undefined,
    email: string | undefined,
    code: string
  ): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    try {
      const res = await verifyRecoveryCode({ userId, email, code });
      if (!res.success) {
        setError(res.message);
      }
      return res;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to verify emergency recovery code.";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  return {
    setup,
    verifySetup,
    verifyLogin,
    verifyRecovery,
    disable,
    loading,
    error,
    setError,
  };
}
