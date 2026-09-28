export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  role: "ADMIN" | "USER" | string;
  mfaEnabled: boolean;
  createdAt: string;
  assignedServicesCount: number;
  assignedServiceIds: number[];
  assignedServiceNames: string[];
}

export interface CreateUserPayload {
  email: string;
  password: string;
  fullName: string;
  role: "ADMIN" | "USER";
}

export interface EmailInviteTemplate {
  toEmail: string;
  fullName: string;
  tempPassword: string;
  loginUrl: string;
  assignedServices: string[];
}
