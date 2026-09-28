"use client";

import { useState, useEffect, useCallback } from "react";
import { AppIntegration, CustomAppPayload } from "@/types/integration";
import {
  BOILERPLATE_TEMPLATES,
  getStoredIntegrations,
  saveStoredIntegrations,
  backendToAppIntegration,
  testConnectionPing,
  formatCurrentTime,
} from "@/lib/integrations";
import {
  fetchUserServices,
  createUserService,
  deleteUserService,
  launchUserService,
} from "@/lib/api";

export function useIntegrations(userId?: number) {
  const [apps, setApps] = useState<AppIntegration[]>([]);
  const [loading, setLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [testingPing, setTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);

  const loadServices = useCallback(async () => {
    if (!userId) {
      setApps(getStoredIntegrations());
      setIsHydrated(true);
      return;
    }

    setLoading(true);
    try {
      const backendServices = await fetchUserServices(userId);
      if (Array.isArray(backendServices)) {
        const mapped = backendServices.map(backendToAppIntegration);
        setApps(mapped);
        saveStoredIntegrations(mapped, userId);
      } else {
        const stored = getStoredIntegrations(userId);
        setApps(stored);
      }
    } catch {
      const stored = getStoredIntegrations(userId);
      setApps(stored);
    } finally {
      setLoading(false);
      setIsHydrated(true);
    }
  }, [userId]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const connectBoilerplate = useCallback(
    async (templateId: string): Promise<boolean> => {
      const template = BOILERPLATE_TEMPLATES.find((t) => t.id === templateId);
      if (!template) return false;

      // Optimistic or backend creation
      if (userId) {
        const created = await createUserService({
          userId,
          name: template.name,
          category: template.category,
          iconType: template.iconType,
          authProtocol: template.type.toUpperCase(),
          loginUrl: template.loginUrl,
          clientId: template.mockClientId,
          mfaRequired: true,
        });

        if (created) {
          const app = backendToAppIntegration(created);
          setApps((prev) => {
            const updated = [app, ...prev.filter((a) => a.id !== app.id)];
            saveStoredIntegrations(updated, userId);
            return updated;
          });
          return true;
        }
      }

      // Local fallback
      const newApp: AppIntegration = {
        id: `local-${template.id}`,
        name: template.name,
        category: template.category,
        iconType: template.iconType,
        status: "Active",
        statusColor: "bg-emerald-400",
        type: template.type,
        isBoilerplate: true,
        loginUrl: template.loginUrl,
        clientId: template.mockClientId,
        metrics: {
          lastLogin: `Today, ${formatCurrentTime()}`,
          lastActive: "Active now",
          totalLogins: 1,
          activeSessions: 1,
          latencyMs: 32,
          mfaRequired: true,
        },
      };

      setApps((prev) => {
        const updated = [newApp, ...prev];
        saveStoredIntegrations(updated, userId);
        return updated;
      });
      return true;
    },
    [userId]
  );

  const addCustomApp = useCallback(
    async (payload: CustomAppPayload): Promise<boolean> => {
      if (!payload.name.trim()) return false;

      if (userId) {
        const created = await createUserService({
          userId,
          name: payload.name.trim(),
          category: payload.category.trim() || "Enterprise Service",
          iconType: "custom",
          authProtocol: payload.type.toUpperCase(),
          loginUrl: payload.loginUrl.trim(),
          clientId: payload.clientId?.trim(),
          mfaRequired: payload.mfaRequired,
        });

        if (created) {
          const app = backendToAppIntegration(created);
          setApps((prev) => {
            const updated = [app, ...prev];
            saveStoredIntegrations(updated, userId);
            return updated;
          });
          return true;
        }
      }

      // Local fallback
      const localId = `custom-${Date.now()}`;
      const newApp: AppIntegration = {
        id: localId,
        name: payload.name.trim(),
        category: payload.category.trim() || "Enterprise Service",
        iconType: "custom",
        status: "Active",
        statusColor: "bg-cyan-400",
        type: payload.type,
        isCustom: true,
        loginUrl: payload.loginUrl.trim(),
        clientId: payload.clientId?.trim(),
        metrics: {
          lastLogin: `Today, ${formatCurrentTime()}`,
          lastActive: "Active now",
          totalLogins: 1,
          activeSessions: 1,
          latencyMs: 38,
          mfaRequired: payload.mfaRequired,
        },
      };

      setApps((prev) => {
        const updated = [newApp, ...prev];
        saveStoredIntegrations(updated, userId);
        return updated;
      });
      return true;
    },
    [userId]
  );

  const removeApp = useCallback(
    async (appId: string | number) => {
      if (typeof appId === "number" && userId) {
        await deleteUserService(appId, userId);
      }
      setApps((prev) => {
        const updated = prev.filter((a) => a.id !== appId);
        saveStoredIntegrations(updated, userId);
        return updated;
      });
    },
    [userId]
  );

  const launchApp = useCallback(
    async (app: AppIntegration, code?: string) => {
      if (typeof app.id === "number" && userId) {
        const res = await launchUserService(app.id, { userId, code });
        if (res.success && res.data?.service) {
          const updatedEntity = backendToAppIntegration(res.data.service);
          setApps((prev) => {
            const next = prev.map((a) => (a.id === app.id ? updatedEntity : a));
            saveStoredIntegrations(next, userId);
            return next;
          });
        }
        return res;
      }

      // Local update simulation
      setApps((prev) => {
        const next = prev.map((a) => {
          if (a.id === app.id) {
            return {
              ...a,
              metrics: {
                ...a.metrics,
                lastLogin: `Today, ${formatCurrentTime()}`,
                lastActive: "Active now",
                totalLogins: a.metrics.totalLogins + 1,
              },
            };
          }
          return a;
        });
        saveStoredIntegrations(next, userId);
        return next;
      });

      return {
        success: true,
        message: "SSO launch authorized.",
        data: {
          ssoToken: `local_token_${Date.now()}`,
          redirectUrl: app.loginUrl || "",
          service: null as any,
        },
      };
    },
    [userId]
  );

  const testPing = useCallback(async (url: string) => {
    setTestingPing(true);
    setPingResult(null);
    const res = await testConnectionPing(url);
    setPingResult(res);
    setTestingPing(false);
    return res;
  }, []);

  const clearPingResult = useCallback(() => {
    setPingResult(null);
  }, []);

  return {
    apps,
    loading,
    isHydrated,
    boilerplateTemplates: BOILERPLATE_TEMPLATES,
    loadServices,
    connectBoilerplate,
    addCustomApp,
    removeApp,
    launchApp,
    testPing,
    testingPing,
    pingResult,
    clearPingResult,
  };
}
