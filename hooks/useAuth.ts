"use client";

import { useState } from "react";
import { registerUser, loginUser, AuthResponse, RegisterPayload, LoginPayload } from "@/lib/api";
import { saveSession, clearSession } from "@/lib/session";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (data: RegisterPayload): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    try {
      const res = await registerUser(data);
      if (!res.success) {
        setError(res.message);
      }
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register.";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginPayload): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginUser(data);
      if (!res.success) {
        setError(res.message);
      } else if (res.userId && !res.mfaEnabled && !res.mfaRequired) {
        // If MFA is not required/enabled, establish session immediately
        saveSession({
          userId: res.userId,
          email: res.email || data.email,
          fullName: res.fullName || "",
          role: (res.role as any) || "USER",
          mfaEnabled: false,
        });
      }
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to log in.";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    clearSession();
  };

  return {
    register,
    login,
    logout,
    loading,
    error,
    setError,
  };
}
