import { AppIntegration, BoilerplateTemplate, CustomAppPayload } from "@/types/integration";

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

export const DEFAULT_APPS: AppIntegration[] = [
  {
    id: "anzora",
    name: "Anzora",
    category: "Zero-Trust Access Mesh",
    logo: "/images/logo-anzora.svg",
    iconType: "shield",
    status: "Active",
    statusColor: "bg-purple-400",
    type: "sso_oauth",
    loginUrl: "https://anzora.network/auth/sso",
    metrics: {
      lastLogin: "Today, 09:15 AM",
      lastActive: "Active now",
      totalLogins: 42,
      activeSessions: 1,
      latencyMs: 38,
      mfaRequired: true,
    },
  },
  {
    id: "calyx",
    name: "Calyx Cloud",
    category: "SaaS Governance Suite",
    logo: "/images/logo-calyx.svg",
    iconType: "cloud",
    status: "Protected",
    statusColor: "bg-emerald-400",
    type: "saml",
    loginUrl: "https://calyx.cloud/identity/saml",
    metrics: {
      lastLogin: "Yesterday, 04:30 PM",
      lastActive: "18m ago",
      totalLogins: 29,
      activeSessions: 1,
      latencyMs: 44,
      mfaRequired: true,
    },
  },
  {
    id: "omniauth",
    name: "OmniAuth API",
    category: "Cloud Auth API Service",
    logo: "/images/logo-omniauth.svg",
    iconType: "key",
    status: "Operational",
    statusColor: "bg-amber-400",
    type: "rest_api",
    endpoint: "https://backend-pi68.onrender.com/api/health",
    metrics: {
      lastLogin: "Today, 08:00 AM",
      lastActive: "4m ago",
      totalLogins: 115,
      activeSessions: 2,
      latencyMs: 32,
      mfaRequired: false,
    },
  },
  {
    id: "skyeagle",
    name: "SkyEagle",
    category: "Continuous Threat Radar",
    logo: "/images/logo-skyeagle.svg",
    iconType: "terminal",
    status: "Syncing",
    statusColor: "bg-cyan-400",
    type: "webhook",
    endpoint: "https://skyeagle.threats.io/api/telemetry",
    metrics: {
      lastLogin: "2 days ago",
      lastActive: "Just now",
      totalLogins: 67,
      activeSessions: 1,
      latencyMs: 51,
      mfaRequired: true,
    },
  },
];

const STORAGE_KEY = "sentinel_dashboard_integrations";

export function getStoredIntegrations(): AppIntegration[] {
  if (typeof window === "undefined") {
    return DEFAULT_APPS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_APPS));
      return DEFAULT_APPS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_APPS;
  } catch {
    return DEFAULT_APPS;
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

export function formatCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export async function testConnectionPing(url: string): Promise<{ success: boolean; latencyMs: number; message: string }> {
  const start = performance.now();
  try {
    const target = url.trim();
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      return { success: false, latencyMs: 0, message: "Invalid endpoint URL protocol (http/https required)." };
    }
    const res = await fetch(target, { method: "HEAD", mode: "no-cors" });
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
