import { AppIntegration, BoilerplateTemplate, BackendServiceResponse, IntegrationType } from "@/types/integration";

export const BOILERPLATE_TEMPLATES: BoilerplateTemplate[] = [
  {
    id: "acme-hr",
    name: "Acme HR Portal",
    category: "Enterprise HR & Directory",
    iconType: "acme-hr",
    type: "sso_oauth",
    description: "Enterprise human resources management, employee records, and directory synchronization client (Demo App 1).",
    mockClientId: "acme_hr_portal_3001",
    loginUrl: "http://localhost:3001",
  },
  {
    id: "fintech-payroll",
    name: "FinTech Payroll Portal",
    category: "Financial Disbursals & Compliance",
    iconType: "fintech-payroll",
    type: "sso_oauth",
    description: "Automated payroll disbursement engine, compensation auditing, and fiscal ledger governance client (Demo App 2).",
    mockClientId: "fintech_payroll_portal_3002",
    loginUrl: "http://localhost:3002",
  },
  {
    id: "devops-incident",
    name: "DevOps Incident Portal",
    category: "Production Incident Command",
    iconType: "devops-incident",
    type: "sso_oauth",
    description: "Real-time service reliability monitoring, distributed tracing, and incident response orchestration client (Demo App 3).",
    mockClientId: "devops_incident_portal_3003",
    loginUrl: "http://localhost:3003",
  },
  {
    id: "anzora",
    name: "Anzora",
    category: "Zero-Trust Access Mesh",
    logo: "/images/logo-anzora.svg",
    iconType: "anzora",
    type: "sso_oauth",
    description: "Zero-Trust mesh network identity provider and distributed device authentication.",
    mockClientId: "anzora_mesh_sec_9918",
    loginUrl: "/apps/anzora",
  },
  {
    id: "calyx",
    name: "Calyx Cloud",
    category: "SaaS Governance Suite",
    logo: "/images/logo-calyx.svg",
    iconType: "calyx",
    type: "sso_oauth",
    description: "Cloud security posture governance, continuous SaaS audit and compliance engine.",
    mockClientId: "calyx_cloud_gov_8271",
    loginUrl: "/apps/calyx",
  },
  {
    id: "omniauth",
    name: "OmniAuth API",
    category: "Cloud Auth API Service",
    logo: "/images/logo-omniauth.svg",
    iconType: "omniauth",
    type: "rest_api",
    description: "Enterprise multi-protocol token authorization API with centralized MFA policy.",
    mockClientId: "omniauth_token_api_3812",
    loginUrl: "/apps/omniauth",
  },
  {
    id: "skyeagle",
    name: "SkyEagle",
    category: "Continuous Threat Radar",
    logo: "/images/logo-skyeagle.svg",
    iconType: "skyeagle",
    type: "sso_oauth",
    description: "Real-time threat intelligence and continuous behavioral anomaly detection radar.",
    mockClientId: "skyeagle_radar_det_4102",
    loginUrl: "/apps/skyeagle",
  },
  {
    id: "google",
    name: "Google Workspace",
    category: "Enterprise Cloud Identity",
    iconType: "google",
    type: "sso_oauth",
    description: "OIDC multi-tenant SSO federation and Google Workspace directory sync.",
    defaultScopes: ["openid", "email", "profile"],
    mockClientId: "apps.googleusercontent.com/948210382910",
    loginUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  },
  {
    id: "github",
    name: "GitHub Enterprise",
    category: "Developer Access & Org SSO",
    iconType: "github",
    type: "sso_oauth",
    description: "GitHub OAuth token authorization with organization membership assertion.",
    defaultScopes: ["read:user", "user:email"],
    mockClientId: "gh_client_83bf9102c91823ab",
    loginUrl: "https://github.com/login/oauth/authorize",
  },
  {
    id: "microsoft",
    name: "Microsoft Entra ID",
    category: "Azure Cloud Active Directory",
    iconType: "microsoft",
    type: "sso_oauth",
    description: "Microsoft Identity Platform authentication with conditional access tokens.",
    defaultScopes: ["User.Read", "Directory.AccessAsUser.All"],
    mockClientId: "ms_tenant_019283-4819-bb12",
    loginUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  },
];

// Defaults removed - newly registered users start with a clean empty dashboard
export const DEFAULT_APPS: AppIntegration[] = [];

const STORAGE_KEY = "sentinel_dashboard_integrations";

export function formatCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function getLogoForService(name: string, iconType?: string): string | undefined {
  const lowerName = name.toLowerCase();
  const lowerIcon = (iconType || "").toLowerCase();
  if (lowerName.includes("anzora") || lowerIcon === "anzora") return "/images/logo-anzora.svg";
  if (lowerName.includes("calyx") || lowerIcon === "calyx") return "/images/logo-calyx.svg";
  if (lowerName.includes("omniauth") || lowerIcon === "omniauth") return "/images/logo-omniauth.svg";
  if (lowerName.includes("skyeagle") || lowerIcon === "skyeagle") return "/images/logo-skyeagle.svg";
  return undefined;
}

export function backendToAppIntegration(service: BackendServiceResponse): AppIntegration {
  const isBoilerplate = ["acme-hr", "fintech-payroll", "devops-incident", "facebook", "google", "github", "microsoft", "anzora", "calyx", "omniauth", "skyeagle"].includes(service.iconType?.toLowerCase() || "");
  const normalizedType = (service.authProtocol?.toLowerCase() || "sso_oauth") as IntegrationType;
  const logo = getLogoForService(service.name, service.iconType);

  return {
    id: service.id,
    backendId: service.id,
    userId: service.userId,
    name: service.name,
    category: service.category || "Enterprise Service",
    logo,
    iconType: (service.iconType as any) || (isBoilerplate ? (service.iconType as any) : "custom"),
    status: (service.status as any) || "Active",
    statusColor: service.mfaRequired ? "bg-emerald-400" : "bg-cyan-400",
    type: normalizedType,
    isBoilerplate,
    isCustom: !isBoilerplate,
    loginUrl: service.loginUrl,
    clientId: service.clientId,
    metrics: {
      lastLogin: service.lastLogin ? service.lastLogin : "Never logged in",
      lastActive: service.lastActive ? service.lastActive : "Inactive",
      totalLogins: service.totalLogins || 0,
      activeSessions: service.totalLogins > 0 ? 1 : 0,
      latencyMs: 35,
      mfaRequired: service.mfaRequired,
    },
  };
}

export function getStoredIntegrations(userId?: number): AppIntegration[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const key = userId ? `${STORAGE_KEY}_u${userId}` : STORAGE_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveStoredIntegrations(apps: AppIntegration[], userId?: number): void {
  if (typeof window === "undefined") return;
  try {
    const key = userId ? `${STORAGE_KEY}_u${userId}` : STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(apps));
  } catch (err) {
    console.error("Failed to save integrations to localStorage", err);
  }
}

export async function testConnectionPing(url: string): Promise<{ success: boolean; latencyMs: number; message: string }> {
  const start = performance.now();
  try {
    const target = url.trim();
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      return { success: false, latencyMs: 0, message: "Invalid URL protocol. Must start with http:// or https://" };
    }
    const res = await fetch(target, { method: "HEAD", mode: "no-cors" });
    const end = performance.now();
    return {
      success: true,
      latencyMs: Math.round(end - start),
      message: `Endpoint reachable. Protocol status: ${res.type}.`,
    };
  } catch (err: any) {
    const end = performance.now();
    return {
      success: false,
      latencyMs: Math.round(end - start),
      message: err.message || "Failed to reach endpoint.",
    };
  }
}
