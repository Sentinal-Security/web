import { useState, useEffect, useCallback } from "react";
import { SecurityAuditRecord, AuditCategory, AuditSeverity } from "@/types/audit";
import { fetchAuditLogs } from "@/lib/api";

export function useAuditLogs(adminId?: number, company?: string) {
  const [logs, setLogs] = useState<SecurityAuditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AuditCategory>("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<AuditSeverity>("ALL");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const data = await fetchAuditLogs({
      adminId,
      company,
      category: selectedCategory,
      severity: selectedSeverity,
      search: searchQuery,
      limit: 200,
    });
    setLogs(data);
    setLoading(false);
    setLastRefreshedAt(new Date());
  }, [adminId, company, selectedCategory, selectedSeverity, searchQuery]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAuditLogs({
        adminId,
        company,
        category: selectedCategory,
        severity: selectedSeverity,
        search: searchQuery,
        limit: 200,
      }).then((data) => {
        setLogs(data);
        setLastRefreshedAt(new Date());
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [autoRefresh, adminId, company, selectedCategory, selectedSeverity, searchQuery]);

  const exportAuditCsv = useCallback(() => {
    if (!logs.length) return;

    const headers = [
      "Timestamp",
      "Actor Email",
      "Company",
      "Category",
      "Action Type",
      "Severity",
      "Target Resource",
      "Details",
      "IP Address",
      "User Agent",
    ];

    const rows = logs.map((l) => [
      `"${l.createdAt}"`,
      `"${l.userEmail || "System"}"`,
      `"${l.company || ""}"`,
      `"${l.category}"`,
      `"${l.actionType}"`,
      `"${l.severity}"`,
      `"${(l.targetResource || "").replace(/"/g, '""')}"`,
      `"${(l.details || "").replace(/"/g, '""')}"`,
      `"${l.ipAddress || ""}"`,
      `"${(l.userAgent || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `sentinel-audit-logs-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [logs]);

  return {
    logs,
    loading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedSeverity,
    setSelectedSeverity,
    autoRefresh,
    setAutoRefresh,
    lastRefreshedAt,
    refresh: loadLogs,
    exportAuditCsv,
  };
}
