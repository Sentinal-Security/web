import {
  AuthResponse,
  MfaSetupResponse,
  HealthResponse,
  RegisterPayload,
  LoginPayload,
  MfaVerifyLoginPayload,
  MfaVerifySetupPayload,
} from "@/types/auth";

export * from "@/types/auth";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://backend-pi68.onrender.com";

export async function checkBackendHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/health`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.statusText}`);
  }
  return res.json();
}

export async function registerUser(
  data: RegisterPayload
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function loginUser(
  data: LoginPayload
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function setupMfa(
  userId: number
): Promise<MfaSetupResponse> {
  const res = await fetch(`${API_BASE_URL}/api/mfa/setup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

export async function verifyMfaSetup(
  data: MfaVerifySetupPayload
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/mfa/verify-setup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function verifyMfaLogin(
  data: MfaVerifyLoginPayload
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/mfa/verify-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function disableMfa(
  userId: number
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/mfa/disable`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

export async function validateSsoSession(
  userId: number
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  return res.json();
}
