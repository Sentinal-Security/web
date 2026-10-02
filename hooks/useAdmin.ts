"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminUser, CreateUserPayload, BatchCreateUsersPayload } from "@/types/admin";
import {
  fetchAdminUsers,
  adminCreateUser,
  assignUserService,
  revokeUserService,
  batchCreateAdminUsers,
  adminDeleteUser,
} from "@/lib/api";
import { exportUsersToCsv } from "@/lib/csvExport";

export function useAdmin(isAdmin: boolean = false, adminId?: number, company?: string) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setActionError(null);
    try {
      const data = await fetchAdminUsers(adminId, company);
      setUsers(data);
    } catch (err: any) {
      setActionError(err?.message || "Failed to load user registry.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, adminId, company]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, loadUsers]);

  const createUser = useCallback(
    async (payload: CreateUserPayload): Promise<AdminUser | null> => {
      setActionError(null);
      setActionSuccess(null);
      try {
        const created = await adminCreateUser(payload, adminId, company);
        if (created) {
          setActionSuccess(`User ${created.email} created successfully.`);
          setUsers((prev) => [created, ...prev]);
          return created;
        } else {
          setActionError("Failed to create user account. Check if email is already in use.");
          return null;
        }
      } catch (err: any) {
        setActionError(err?.message || "Failed to create user account.");
        return null;
      }
    },
    [adminId, company]
  );

  const assignService = useCallback(
    async (userId: number, serviceId: number, serviceName: string): Promise<boolean> => {
      const ok = await assignUserService(userId, serviceId, adminId);
      if (ok) {
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id === userId && !u.assignedServiceIds.includes(serviceId)) {
              return {
                ...u,
                assignedServicesCount: u.assignedServicesCount + 1,
                assignedServiceIds: [...u.assignedServiceIds, serviceId],
                assignedServiceNames: [...u.assignedServiceNames, serviceName],
              };
            }
            return u;
          })
        );
        return true;
      }
      return false;
    },
    [adminId]
  );

  const revokeService = useCallback(
    async (userId: number, serviceId: number): Promise<boolean> => {
      const ok = await revokeUserService(userId, serviceId, adminId);
      if (ok) {
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id === userId) {
              const idx = u.assignedServiceIds.indexOf(serviceId);
              const names = [...u.assignedServiceNames];
              if (idx !== -1) names.splice(idx, 1);
              return {
                ...u,
                assignedServicesCount: Math.max(0, u.assignedServicesCount - 1),
                assignedServiceIds: u.assignedServiceIds.filter((id) => id !== serviceId),
                assignedServiceNames: names,
              };
            }
            return u;
          })
        );
        return true;
      }
      return false;
    },
    [adminId]
  );

  const batchCreateUsers = useCallback(
    async (payload: BatchCreateUsersPayload): Promise<AdminUser[]> => {
      setActionError(null);
      setActionSuccess(null);
      try {
        const created = await batchCreateAdminUsers(payload, adminId, company);
        if (created && created.length > 0) {
          setActionSuccess(`Successfully generated and provisioned ${created.length} users.`);
          setUsers((prev) => [...created, ...prev]);
          return created;
        } else {
          setActionError("Failed to batch create users or all user emails were duplicates.");
          return [];
        }
      } catch (err: any) {
        setActionError(err?.message || "Failed to batch create users.");
        return [];
      }
    },
    [adminId, company]
  );

  const deleteUser = useCallback(
    async (userId: number): Promise<boolean> => {
      setActionError(null);
      setActionSuccess(null);
      try {
        const ok = await adminDeleteUser(userId, adminId);
        if (ok) {
          setActionSuccess("User deleted successfully.");
          setUsers((prev) => prev.filter((u) => u.id !== userId));
          return true;
        } else {
          setActionError("Failed to delete user.");
          return false;
        }
      } catch (err: any) {
        setActionError(err?.message || "Failed to delete user.");
        return false;
      }
    },
    [adminId]
  );

  const exportCsv = useCallback(() => {
    exportUsersToCsv(users);
  }, [users]);

  return {
    users,
    loading,
    actionError,
    actionSuccess,
    loadUsers,
    createUser,
    batchCreateUsers,
    deleteUser,
    assignService,
    revokeService,
    exportCsv,
    clearFeedback: () => {
      setActionError(null);
      setActionSuccess(null);
    },
  };
}
