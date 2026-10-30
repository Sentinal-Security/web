import {
  AuthResponse,
  MfaSetupResponse,
  HealthResponse,
  RegisterPayload,
  LoginPayload,
  MfaVerifyLoginPayload,
  MfaVerifySetupPayload,
} from "@/types/auth";
import {
  BackendServiceResponse,
  CreateServicePayload,
  LaunchServicePayload,
  LaunchServiceResponse,
} from "@/types/integration";
import {
  AdminUser,
  CreateUserPayload,
  BatchCreateUsersPayload,
  OrganizationPolicy,
  SessionDto,
  CsvImportReport,
} from "@/types/admin";
import { SecurityAuditRecord, ClientTelemetryPayload } from "@/types/audit";

export * from "@/types/auth";
export * from "@/types/integration";
export * from "@/types/admin";
export * from "@/types/audit";

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
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok && (res.status === 502 || res.status === 503 || res.status === 504)) {
      return {
        success: false,
        message: "Network issue, please wait a few seconds...",
      };
    }
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }
    return {
      success: false,
      message: "Network issue, please wait a few seconds...",
    };
  } catch {
    return {
      success: false,
      message: "Network issue, please wait a few seconds...",
    };
  }
}

export async function loginUser(
  data: LoginPayload
): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok && (res.status === 502 || res.status === 503 || res.status === 504)) {
      return {
        success: false,
        message: "Network issue, please wait a few seconds...",
      };
    }
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }
    return {
      success: false,
      message: "Network issue, please wait a few seconds...",
    };
  } catch {
    return {
      success: false,
      message: "Network issue, please wait a few seconds...",
    };
  }
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
  try {
    const res = await fetch(`${API_BASE_URL}/api/mfa/verify-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok && (res.status === 502 || res.status === 503 || res.status === 504)) {
      return {
        success: false,
        message: "Network issue, please wait a few seconds...",
      };
    }
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }
    return {
      success: false,
      message: "Network issue, please wait a few seconds...",
    };
  } catch {
    return {
      success: false,
      message: "Network issue, please wait a few seconds...",
    };
  }
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

export async function verifyRecoveryCode(data: {
  userId?: number;
  email?: string;
  code: string;
}): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/mfa/verify-recovery-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch {
    return {
      success: false,
      message: "Network issue, please check connection and try again.",
    };
  }
}

export async function getRecoveryCodesStatus(userId: number): Promise<{
  success: boolean;
  message?: string;
  data?: {
    mfaEnabled: boolean;
    remainingCount: number;
    hasCodes: boolean;
  };
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/mfa/recovery-codes/status?userId=${userId}`);
    return res.json();
  } catch {
    return { success: false, message: "Failed to fetch recovery codes status." };
  }
}

export async function regenerateRecoveryCodes(userId: number): Promise<{
  success: boolean;
  message?: string;
  data?: {
    recoveryCodes: string[];
    remainingCount: number;
  };
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/mfa/recovery-codes/regenerate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  } catch {
    return { success: false, message: "Failed to regenerate recovery codes." };
  }
}

export async function getMfaChallengeStatus(challengeId: number): Promise<{
  success: boolean;
  message?: string;
  data?: {
    id: number;
    status: "PENDING" | "APPROVED" | "DENIED" | "EXPIRED";
    userId: number;
    email: string;
    fullName?: string;
    role?: string;
    company?: string;
    ssoToken?: string;
  };
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/mfa/challenge/${challengeId}/status`, {
      cache: "no-store",
    });
    return await res.json();
  } catch {
    return { success: false, message: "Error fetching challenge status." };
  }
}

export async function initiateMfaChallenge(
  userId?: number,
  email?: string,
  clientOrigin?: string
): Promise<{
  success: boolean;
  message?: string;
  data?: {
    challengeId: number;
    matchCode: string;
    status: string;
    clientOrigin: string;
  };
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/mfa/challenge/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, email, clientOrigin }),
    });
    return await res.json();
  } catch {
    return { success: false, message: "Error initiating MFA challenge." };
  }
}

export async function loginWithGoogle(
  idToken: string
): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok && (res.status === 502 || res.status === 503 || res.status === 504)) {
      return {
        success: false,
        message: "Network issue, please wait a few seconds...",
      };
    }
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }
    return {
      success: false,
      message: "Network issue, please wait a few seconds...",
    };
  } catch {
    return {
      success: false,
      message: "Network issue, please wait a few seconds...",
    };
  }
}

export async function validateSsoSession(
  userId?: number,
  ssoToken?: string
): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ssoToken }),
    });
    return await res.json();
  } catch {
    return {
      success: false,
      message: "Session validation failed due to network error.",
    };
  }
}

// User Services REST Client
export async function fetchUserServices(
  userId: number
): Promise<BackendServiceResponse[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/services?userId=${userId}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data || [];
  } catch {
    return [];
  }
}

export async function createUserService(
  payload: CreateServicePayload
): Promise<BackendServiceResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

export async function deleteUserService(
  id: number,
  userId: number
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/services/${id}?userId=${userId}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function launchUserService(
  id: number,
  payload: LaunchServicePayload
): Promise<LaunchServiceResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/services/${id}/launch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return {
      success: res.ok && json.success,
      message: json.message || (res.ok ? "SSO launch authorized." : "Launch failed."),
      data: json.data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error launching service.",
    };
  }
}

// Admin REST Client
export async function fetchAdminUsers(adminId?: number, company?: string): Promise<AdminUser[]> {
  try {
    const params = new URLSearchParams();
    if (adminId) params.append("adminId", adminId.toString());
    if (company) params.append("company", company);
    const queryString = params.toString() ? `?${params.toString()}` : "";

    const res = await fetch(`${API_BASE_URL}/api/admin/users${queryString}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data || [];
  } catch {
    return [];
  }
}

export async function adminCreateUser(
  payload: CreateUserPayload,
  adminId?: number,
  company?: string
): Promise<AdminUser | null> {
  try {
    const params = new URLSearchParams();
    if (adminId) params.append("adminId", adminId.toString());
    if (company) params.append("company", company);
    const queryString = params.toString() ? `?${params.toString()}` : "";

    const res = await fetch(`${API_BASE_URL}/api/admin/users${queryString}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

export async function assignUserService(
  userId: number,
  serviceId: number,
  adminId?: number
): Promise<boolean> {
  try {
    const queryString = adminId ? `?adminId=${adminId}` : "";
    const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/services/${serviceId}${queryString}`, {
      method: "POST",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function revokeUserService(
  userId: number,
  serviceId: number,
  adminId?: number
): Promise<boolean> {
  try {
    const queryString = adminId ? `?adminId=${adminId}` : "";
    const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/services/${serviceId}${queryString}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function updateUserProfile(
  userId: number,
  fullName: string
): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, fullName }),
    });
    return res.json();
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Failed to update account profile.",
    };
  }
}

export async function batchCreateAdminUsers(
  payload: BatchCreateUsersPayload,
  adminId?: number,
  company?: string
): Promise<AdminUser[]> {
  try {
    const params = new URLSearchParams();
    if (adminId) params.append("adminId", adminId.toString());
    if (company) params.append("company", company);
    const queryString = params.toString() ? `?${params.toString()}` : "";

    const res = await fetch(`${API_BASE_URL}/api/admin/users/batch${queryString}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data || [];
  } catch {
    return [];
  }
}

export async function adminDeleteUser(
  userId: number,
  adminId?: number
): Promise<boolean> {
  try {
    const queryString = adminId ? `?adminId=${adminId}` : "";
    const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}${queryString}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function adminUnlockUser(
  userId: number,
  adminId?: number
): Promise<boolean> {
  try {
    const queryString = adminId ? `?adminId=${adminId}` : "";
    const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/unlock${queryString}`, {
      method: "POST",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchAuditLogs(options?: {
  adminId?: number;
  company?: string;
  category?: string;
  severity?: string;
  search?: string;
  limit?: number;
}): Promise<SecurityAuditRecord[]> {
  try {
    const params = new URLSearchParams();
    if (options?.adminId) params.append("adminId", options.adminId.toString());
    if (options?.company) params.append("company", options.company);
    if (options?.category && options.category !== "ALL") params.append("category", options.category);
    if (options?.severity && options.severity !== "ALL") params.append("severity", options.severity);
    if (options?.search) params.append("search", options.search.trim());
    if (options?.limit) params.append("limit", options.limit.toString());

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/api/admin/audit-logs${queryString}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data || [];
  } catch {
    return [];
  }
}

export async function recordAuditEvent(payload: ClientTelemetryPayload): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/audit/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Fire and forget - never block the client UI
  }
}

export interface BillingTierResponse {
  success: boolean;
  message?: string;
  data?: {
    company: string;
    tier: string;
    status: string;
    isAdmin: boolean;
    updatedAt?: string;
  };
}

export interface PaypalOrderResponse {
  success: boolean;
  message?: string;
  data?: {
    orderId: string;
    tier: string;
    billingCycle: string;
    amount: number;
    currency: string;
    company: string;
    adminEmail: string;
    environment: string;
    status: string;
  };
}

export interface PaypalCaptureResponse {
  success: boolean;
  message?: string;
  data?: {
    company: string;
    tier: string;
    billingCycle: string;
    orderId: string;
    status: string;
    membersUpdated: number;
    updatedAt: string;
  };
}

export async function fetchBillingTier(userId?: number, company?: string): Promise<BillingTierResponse> {
  try {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId.toString());
    if (company) params.append("company", company);
    const res = await fetch(`${API_BASE_URL}/api/billing/tier?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { success: false, message: "Failed to fetch billing tier status" };
    }
    return await res.json();
  } catch {
    return { success: false, message: "Network error fetching billing tier" };
  }
}

export async function createPaypalOrder(
  userId: number,
  tier: string,
  billingCycle: string
): Promise<PaypalOrderResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/billing/paypal/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, tier, billingCycle }),
    });
    return await res.json();
  } catch {
    return { success: false, message: "Network error creating PayPal sandbox order" };
  }
}

export async function capturePaypalOrder(
  userId: number,
  orderId: string,
  tier: string,
  billingCycle: string
): Promise<PaypalCaptureResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/billing/paypal/capture-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, orderId, tier, billingCycle }),
    });
    return await res.json();
  } catch {
    return { success: false, message: "Network error capturing PayPal sandbox order" };
  }
}

export async function verifyEmail(token: string): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: "GET",
    });
    const data = await res.json();
    return data;
  } catch {
    return { success: false, message: "Failed to connect to authentication gateway." };
  }
}

export async function resendVerification(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return data;
  } catch {
    return { success: false, message: "Failed to connect to authentication gateway." };
  }
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return data;
  } catch {
    return { success: false, message: "Failed to connect to authentication gateway." };
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    return data;
  } catch {
    return { success: false, message: "Failed to connect to authentication gateway." };
  }
}

// --- BATCH 3: ENTERPRISE ADMINISTRATION & COMPLIANCE GOVERNANCE ---

export async function getOrganizationPolicy(
  adminId?: number,
  company?: string
): Promise<{ success: boolean; message: string; data?: OrganizationPolicy }> {
  try {
    const params = new URLSearchParams();
    if (adminId) params.append("adminId", adminId.toString());
    if (company) params.append("company", company);

    const res = await fetch(`${API_BASE_URL}/api/admin/policy?${params.toString()}`);
    return await res.json();
  } catch {
    return { success: false, message: "Failed to fetch organization compliance policy." };
  }
}

export async function updateOrganizationPolicy(payload: {
  adminId?: number;
  company?: string;
  mfaEnforced: boolean;
  sessionDurationHours?: number;
}): Promise<{ success: boolean; message: string; data?: OrganizationPolicy }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/policy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch {
    return { success: false, message: "Failed to update organization compliance policy." };
  }
}

export async function importUsersCsv(payload: {
  csvContent: string;
  adminId?: number;
  company?: string;
}): Promise<{ success: boolean; message: string; data?: CsvImportReport }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/users/csv-import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch {
    return { success: false, message: "Failed to execute CSV roster import." };
  }
}

export async function getAdminSessions(
  adminId?: number,
  company?: string
): Promise<{ success: boolean; message: string; data?: SessionDto[] }> {
  try {
    const params = new URLSearchParams();
    if (adminId) params.append("adminId", adminId.toString());
    if (company) params.append("company", company);

    const res = await fetch(`${API_BASE_URL}/api/admin/sessions?${params.toString()}`);
    return await res.json();
  } catch {
    return { success: false, message: "Failed to retrieve active tenant sessions." };
  }
}

export async function revokeAdminSession(
  sessionId: number,
  adminId?: number
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/sessions/${sessionId}/revoke${adminId ? `?adminId=${adminId}` : ""}`, {
      method: "POST",
    });
    return await res.json();
  } catch {
    return { success: false, message: "Failed to terminate session." };
  }
}

export async function revokeAdminUserSessions(
  userId: number,
  adminId?: number
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/sessions/revoke-user?userId=${userId}${adminId ? `&adminId=${adminId}` : ""}`, {
      method: "POST",
    });
    return await res.json();
  } catch {
    return { success: false, message: "Failed to terminate user sessions." };
  }
}

export async function getUserSessions(
  userId: number,
  currentSsoToken?: string
): Promise<{ success: boolean; message: string; data?: SessionDto[] }> {
  try {
    const params = new URLSearchParams({ userId: userId.toString() });
    if (currentSsoToken) params.append("ssoToken", currentSsoToken);

    const res = await fetch(`${API_BASE_URL}/api/auth/sessions?${params.toString()}`);
    return await res.json();
  } catch {
    return { success: false, message: "Failed to retrieve active user sessions." };
  }
}

export async function revokeUserSession(
  sessionId: number,
  userId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/sessions/${sessionId}/revoke?userId=${userId}`, {
      method: "POST",
    });
    return await res.json();
  } catch {
    return { success: false, message: "Failed to terminate session." };
  }
}

export async function revokeUserOtherSessions(
  userId: number,
  ssoToken: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/sessions/revoke-others?userId=${userId}&ssoToken=${encodeURIComponent(ssoToken)}`, {
      method: "POST",
    });
    return await res.json();
  } catch {
    return { success: false, message: "Failed to terminate other sessions." };
  }
}

