import { AppIntegration, BoilerplateTemplate, BackendServiceResponse, IntegrationType } from "@/types/integration";

export const BOILERPLATE_TEMPLATES: BoilerplateTemplate[] = [
  {
    id: "facebook",
    name: "Facebook Login",
    category: "Identity Federation & Social SSO",
    iconType: "facebook",
    type: "sso_oauth",
    description: "OAuth 2.0 Graph API identity federation for user verification.",
    defaultScopes: ["public_profile", "email"],
    mockClientId: "fb_app_10928374619",
    loginUrl: "https://www.facebook.com/v19.0/dialog/oauth",
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

// Defaults removed per user requirement - user starts with empty dashboard and adds services
export const DEFAULT_APPS: AppIntegration[] = [];

const STORAGE_KEY = "sentinel_dashboard_integrations";

export function formatCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function backendToAppIntegration(service: BackendServiceResponse): AppIntegration {
  const isBoilerplate = ["facebook", "google", "github", "microsoft"].includes(service.iconType?.toLowerCase() || "");
  const normalizedType = (service.authProtocol?.toLowerCase() || "sso_oauth") as IntegrationType;

  return {
    id: service.id,
    backendId: service.id,
    userId: service.userId,
    name: service.name,
    category: service.category || "Enterprise Service",
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

export function getStoredIntegrations(): AppIntegration[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredIntegrations(apps: AppIntegration[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  } catch (err) {
    console.error("Failed to save integrations to localStorage", err);
  }
}

export async function testConnectionPing(url: string): Promise<{ success: boolean; latencyMs: number; message: string }> {
  const start = performance.now();
  try {
    const target = url.trim();
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      return { success: false, latencyMs: 0, message: "Invalid endpoint URL protocol (http/https required)." };
    }
    await fetch(target, { method: "HEAD", mode: "no-cors" });
    const end = performance.now();
    return {
      success: true,
      latencyMs: Math.round(end - start),
      message: `Connection verified. Latency: ${Math.round(end - start)}ms.`,
    };
  } catch (err: any) {
    const end = performance.now();
    return {
      success: false,
      latencyMs: Math.round(end - start),
      message: err?.message || "Failed to reach endpoint.",
    };
  }
}
