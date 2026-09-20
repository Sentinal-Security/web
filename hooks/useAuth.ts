"use client";

import { useState } from "react";
import { registerUser, loginUser, AuthResponse } from "@/lib/api";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (email: string, password: string, fullName: string): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    try {
      const res = await registerUser({ email, password, fullName });
      if (!res.success) {
        setError(res.message);
      }
      return res;
    } catch (err: any) {
      const msg = err.message || "Failed to register.";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginUser({ email, password });
      if (!res.success) {
        setError(res.message);
      }
      return res;
    } catch (err: any) {
      const msg = err.message || "Failed to log in.";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  return {
    register,
    login,
    loading,
    error,
    setError,
  };
}
