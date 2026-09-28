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
  id: string;
  name: string;
  category: string;
  logo?: string;
  iconType?: "facebook" | "google" | "github" | "microsoft" | "shield" | "cloud" | "key" | "terminal" | "custom";
  status: "Active" | "Operational" | "Protected" | "Syncing" | "Idle";
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
  iconType: "facebook" | "google" | "github" | "microsoft";
  type: IntegrationType;
  description: string;
  defaultScopes: string[];
  mockClientId: string;
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
