export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  role: "ADMIN" | "USER" | string;
  company?: string;
  mfaEnabled: boolean;
  accountLocked?: boolean;
  failedAttempts?: number;
  createdAt: string;
  assignedServicesCount: number;
  assignedServiceIds: number[];
  assignedServiceNames: string[];
}

export interface CreateUserPayload {
  email: string;
  password: string;
  fullName: string;
  role: "ADMIN" | "USER" | "HR" | "FINANCE" | "DEVOPS" | string;
  company?: string;
}

export interface EmailInviteTemplate {
  toEmail: string;
  fullName: string;
  tempPassword: string;
  loginUrl: string;
  assignedServices: string[];
}

export interface BatchCreateUserItem {
  fullName: string;
  email: string;
  password: string;
  role: "ADMIN" | "USER" | "HR" | "FINANCE" | "DEVOPS" | string;
  serviceIds: number[];
}

export interface BatchCreateUsersPayload {
  users: BatchCreateUserItem[];
}

export interface UserTemplateConfig {
  templateName: string;
  role: "ADMIN" | "USER";
  namePrefix: string;
  emailDomain: string;
  passwordStrategy: "random_secure" | "prefix_number" | "uniform_temp";
  customPasswordPrefix?: string;
  assignedServiceIds: number[];
  count: number;
}

export interface OrganizationPolicy {
  id?: number;
  company: string;
  mfaEnforced: boolean;
  sessionDurationHours: number;
  updatedAt?: string;
  updatedByAdminId?: number;
}

export interface SessionDto {
  id: number;
  userId: number;
  userEmail: string;
  company: string;
  clientIp: string;
  userAgent: string;
  clientOrigin: string;
  createdAt: string;
  expiresAt: string;
  currentSession: boolean;
}

export interface CsvImportReport {
  totalProcessed: number;
  importedCount: number;
  skippedCount: number;
  importedUsers: AdminUser[];
  skippedEmails: string[];
  credentials: {
    email: string;
    fullName: string;
    temporaryPassword: string;
    role: string;
  }[];
}
