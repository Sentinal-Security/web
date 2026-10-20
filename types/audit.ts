export type AuditCategory =
  | "ALL"
  | "AUTHENTICATION"
  | "MFA_SECURITY"
  | "SSO_ACCESS"
  | "ADMIN_OPS"
  | "USER_TELEMETRY";

export type AuditSeverity = "ALL" | "INFO" | "WARN" | "SECURITY_ALERT" | "CRITICAL";

export interface SecurityAuditRecord {
  id: number;
  company?: string;
  userId?: number;
  userEmail?: string;
  actionType: string;
  category: string;
  severity: string;
  targetResource?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ClientTelemetryPayload {
  userId?: number;
  userEmail?: string;
  company?: string;
  actionType: string;
  category?: string;
  severity?: string;
  targetResource?: string;
  details?: string;
}
