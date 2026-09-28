"use client";

import { useState, useEffect, useCallback } from "react";
import { AppIntegration, CustomAppPayload, BoilerplateTemplate } from "@/types/integration";
import {
  getStoredIntegrations,
  saveStoredIntegrations,
  BOILERPLATE_TEMPLATES,
  formatCurrentTime,
  testConnectionPing,
} from "@/lib/integrations";

export function useIntegrations() {
  const [apps, setApps] = useState<AppIntegration[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [testingPing, setTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);

  useEffect(() => {
    const stored = getStoredIntegrations();
    setApps(stored);
    setIsHydrated(true);
  }, []);

  const connectBoilerplate = useCallback((templateId: string): boolean => {
    const template = BOILERPLATE_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return false;

    // Check if already integrated
    const exists = apps.some((a) => a.id === template.id);
    if (exists) return false;

    const newApp: AppIntegration = {
      id: template.id,
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
        latencyMs: Math.floor(Math.random() * 25) + 20,
        mfaRequired: true,
      },
    };

    const updated = [newApp, ...apps];
    setApps(updated);
    saveStoredIntegrations(updated);
    return true;
  }, [apps]);

  const addCustomApp = useCallback((payload: CustomAppPayload): boolean => {
    if (!payload.name.trim()) return false;

    const id = `custom-${Date.now()}`;
    const newApp: AppIntegration = {
      id,
      name: payload.name.trim(),
      category: payload.category.trim() || "Internal Enterprise Service",
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
        latencyMs: Math.floor(Math.random() * 30) + 25,
        mfaRequired: payload.mfaRequired,
      },
    };

    const updated = [newApp, ...apps];
    setApps(updated);
    saveStoredIntegrations(updated);
    return true;
  }, [apps]);

  const recordLogin = useCallback((appId: string) => {
    setApps((prev) => {
      const updated = prev.map((app) => {
        if (app.id === appId) {
          return {
            ...app,
            metrics: {
              ...app.metrics,
              lastLogin: `Today, ${formatCurrentTime()}`,
              lastActive: "Active now",
              totalLogins: app.metrics.totalLogins + 1,
            },
          };
        }
        return app;
      });
      saveStoredIntegrations(updated);
      return updated;
    });
  }, []);

  const removeApp = useCallback((appId: string) => {
    setApps((prev) => {
      const updated = prev.filter((a) => a.id !== appId);
      saveStoredIntegrations(updated);
      return updated;
    });
  }, []);

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
    isHydrated,
    boilerplateTemplates: BOILERPLATE_TEMPLATES,
    connectBoilerplate,
    addCustomApp,
    recordLogin,
    removeApp,
    testPing,
    testingPing,
    pingResult,
    clearPingResult,
  };
}
