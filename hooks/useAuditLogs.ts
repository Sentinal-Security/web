import { useState, useEffect, useCallback, useRef } from "react";
import { SecurityAuditRecord, AuditCategory, AuditSeverity } from "@/types/audit";
import { fetchAuditLogs } from "@/lib/api";
import { exportCsvRows } from "@/lib/csvExport";

export function useAuditLogs(adminId?: number, company?: string) {
  const [logs, setLogs] = useState<SecurityAuditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AuditCategory>("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<AuditSeverity>("ALL");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const requestSeqRef = useRef(0);

  const loadLogs = useCallback(async () => {
    const seq = ++requestSeqRef.current;
    setLoading(true);
    const data = await fetchAuditLogs({
      adminId,
      company,
      category: selectedCategory,
      severity: selectedSeverity,
      search: searchQuery,
      limit: 200,
    });
    if (seq !== requestSeqRef.current) return;
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
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      const seq = ++requestSeqRef.current;
      fetchAuditLogs({
        adminId,
        company,
        category: selectedCategory,
        severity: selectedSeverity,
        search: searchQuery,
        limit: 200,
      }).then((data) => {
        if (seq !== requestSeqRef.current) return;
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
      l.createdAt,
      l.userEmail || "System",
      l.company || "",
      l.category,
      l.actionType,
      l.severity,
      l.targetResource || "",
      l.details || "",
      l.ipAddress || "",
      l.userAgent || "",
    ]);

    const dateStr = new Date().toISOString().slice(0, 10);
    exportCsvRows(`sentinel-audit-logs-${dateStr}.csv`, headers, rows);
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
