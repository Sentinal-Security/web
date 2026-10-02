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
import { AdminUser, CreateUserPayload, BatchCreateUsersPayload } from "@/types/admin";

export * from "@/types/auth";
export * from "@/types/integration";
export * from "@/types/admin";

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
export async function fetchAdminUsers(): Promise<AdminUser[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
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
  payload: CreateUserPayload
): Promise<AdminUser | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
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
  serviceId: number
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/services/${serviceId}`, {
      method: "POST",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function revokeUserService(
  userId: number,
  serviceId: number
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/services/${serviceId}`, {
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
  payload: BatchCreateUsersPayload
): Promise<AdminUser[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/users/batch`, {
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
  userId: number
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}
