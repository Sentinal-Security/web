export type IntegrationType = "sso_oauth" | "rest_api" | "webhook" | "saml" | "vault";

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
  iconType?: "acme-hr" | "fintech-payroll" | "devops-incident" | "facebook" | "google" | "github" | "microsoft" | "anzora" | "calyx" | "omniauth" | "skyeagle" | "shield" | "cloud" | "key" | "terminal" | "custom";
  status: "Active" | "Operational" | "Protected" | "Syncing" | "Idle" | string;
  statusColor: string;
  type: IntegrationType;
  isBoilerplate?: boolean;
  isCustom?: boolean;
  loginUrl?: string;
  endpoint?: string;
  clientId?: string;
  isVault?: boolean;
  vaultUsername?: string;
  mfaRequired?: boolean;
  metrics: AppMetrics;
}

export interface BoilerplateTemplate {
  id: string;
  name: string;
  category: string;
  logo?: string;
  iconType?: "acme-hr" | "fintech-payroll" | "devops-incident" | "facebook" | "google" | "github" | "microsoft" | "anzora" | "calyx" | "omniauth" | "skyeagle" | "custom";
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
  vaultUsername?: string;
  vaultPassword?: string;
  iconType?: string;
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
  vaultUsername?: string;
  isVault?: boolean;
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
  vaultUsername?: string;
  vaultPassword?: string;
}

export interface LaunchServicePayload {
  userId: number;
  code?: string;
  challengeId?: number;
}

export interface LaunchServiceResponse {
  success: boolean;
  message: string;
  data?: {
    ssoToken: string;
    redirectUrl: string;
    service: BackendServiceResponse;
    isVault?: boolean;
    vaultUsername?: string;
    vaultPassword?: string;
  };
}
