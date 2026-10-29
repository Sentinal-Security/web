export interface User {
  userId: number;
  email: string;
  fullName: string;
  role?: "ADMIN" | "HR" | "FINANCE" | "DEVOPS" | "USER" | string;
  company?: string;
  subscriptionTier?: "COMMUNITY" | "PROFESSIONAL" | "ENTERPRISE" | string;
  mfaEnabled: boolean;
}

export interface AuthSession {
  user: User;
  token?: string;
  loginTime: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role?: "ADMIN" | "HR" | "FINANCE" | "DEVOPS" | "USER" | string;
  company?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface MfaVerifyLoginPayload {
  userId?: number;
  email?: string;
  code: string;
}

export interface MfaVerifySetupPayload {
  userId: number;
  code: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  userId?: number;
  email?: string;
  fullName?: string;
  role?: string;
  company?: string;
  subscriptionTier?: string;
  mfaEnabled?: boolean;
  mfaRequired?: boolean;
  ssoToken?: string;
  challengeId?: number;
  matchCode?: string;
  emailVerified?: boolean;
  recoveryCodes?: string[];
}

export interface GenericApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp?: string;
}

export interface MfaSetupResponse {
  success: boolean;
  message: string;
  secretKey?: string;
  otpAuthUri?: string;
  accountEmail?: string;
}

export interface HealthResponse {
  service: string;
  version: string;
  status: string;
  database?: string;
  databasePingMs?: number;
}
