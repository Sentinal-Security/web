export type IntegrationType = "sso_oauth" | "rest_api" | "webhook" | "saml";

export interface AppMetrics {
  lastLogin: string;
  lastActive: string;
  totalLogins: number;
  activeSessions: number;
  latencyMs?: number;
  mfaRequired: boolean;
}

export interface AppIntegration {
  id: string | number;
  backendId?: number;
  userId?: number;
  name: string;
  category: string;
  logo?: string;
  iconType?: "facebook" | "google" | "github" | "microsoft" | "anzora" | "calyx" | "omniauth" | "skyeagle" | "shield" | "cloud" | "key" | "terminal" | "custom";
  status: "Active" | "Operational" | "Protected" | "Syncing" | "Idle" | string;
  statusColor: string;
  type: IntegrationType;
  isBoilerplate?: boolean;
  isCustom?: boolean;
  loginUrl?: string;
  endpoint?: string;
  clientId?: string;
  metrics: AppMetrics;
}

export interface BoilerplateTemplate {
  id: string;
  name: string;
  category: string;
  logo?: string;
  iconType?: "facebook" | "google" | "github" | "microsoft" | "anzora" | "calyx" | "omniauth" | "skyeagle" | "custom";
  type: IntegrationType;
  description: string;
  defaultScopes?: string[];
  mockClientId?: string;
  loginUrl: string;
}

export interface CustomAppPayload {
  name: string;
  category: string;
  type: IntegrationType;
  loginUrl: string;
  clientId?: string;
  clientSecret?: string;
  mfaRequired: boolean;
}

export interface BackendServiceResponse {
  id: number;
  userId: number;
  name: string;
  category: string;
  iconType: string;
  authProtocol: string;
  loginUrl: string;
  clientId: string;
  mfaRequired: boolean;
  status: string;
  lastLogin?: string;
  lastActive?: string;
  totalLogins: number;
  createdAt: string;
}

export interface CreateServicePayload {
  userId: number;
  name: string;
  category: string;
  iconType?: string;
  authProtocol: string;
  loginUrl?: string;
  clientId?: string;
  mfaRequired: boolean;
}

export interface LaunchServicePayload {
  userId: number;
  code?: string;
}

export interface LaunchServiceResponse {
  success: boolean;
  message: string;
  data?: {
    ssoToken: string;
    redirectUrl: string;
    service: BackendServiceResponse;
  };
}
