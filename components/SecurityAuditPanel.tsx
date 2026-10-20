"use client";

import { useState } from "react";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { AuditCategory, AuditSeverity, SecurityAuditRecord } from "@/types/audit";

interface SecurityAuditPanelProps {
  adminId?: number;
  company?: string;
}

export function SecurityAuditPanel({ adminId, company }: SecurityAuditPanelProps) {
  const {
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
    refresh,
    exportAuditCsv,
  } = useAuditLogs(adminId, company);

  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const categoryOptions: { label: string; value: AuditCategory }[] = [
    { label: "All Activity", value: "ALL" },
    { label: "Authentication", value: "AUTHENTICATION" },
    { label: "MFA & Device", value: "MFA_SECURITY" },
    { label: "SSO Launches", value: "SSO_ACCESS" },
    { label: "Admin Operations", value: "ADMIN_OPS" },
    { label: "Client Telemetry", value: "USER_TELEMETRY" },
  ];

  const severityOptions: { label: string; value: AuditSeverity }[] = [
    { label: "All Levels", value: "ALL" },
    { label: "Info", value: "INFO" },
    { label: "Warnings", value: "WARN" },
    { label: "Security Alerts", value: "SECURITY_ALERT" },
  ];

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "SECURITY_ALERT":
      case "CRITICAL":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "WARN":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      default:
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category.toUpperCase()) {
      case "AUTHENTICATION":
        return "bg-blue-500/10 text-blue-300 border-blue-500/30";
      case "MFA_SECURITY":
        return "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";
      case "SSO_ACCESS":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
      case "ADMIN_OPS":
        return "bg-purple-500/10 text-purple-300 border-purple-500/30";
      case "USER_TELEMETRY":
        return "bg-slate-500/10 text-slate-300 border-slate-500/30";
      default:
        return "bg-slate-500/10 text-slate-300 border-slate-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics & Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#070b16] border border-cyan-500/15">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Security & Audit Event Stream</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                {logs.length} Recorded
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live audit logging of all identity verifications, MFA challenges, button interactions, and tenant administrative changes.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Auto Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              autoRefresh
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                : "bg-slate-900 border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-cyan-400 animate-pulse" : "bg-slate-500"}`} />
            <span>{autoRefresh ? "Live 8s Polling" : "Polling Paused"}</span>
          </button>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={() => refresh()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-cyan-500/30 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
          >
            <svg className={`w-3.5 h-3.5 text-cyan-400 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>

          {/* CSV Export Button */}
          <button
            type="button"
            onClick={exportAuditCsv}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-sm shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Matrix */}
      <div className="space-y-3 p-5 rounded-2xl bg-[#070b16] border border-cyan-500/15">
        {/* Search Bar */}
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search audit records by actor email, action type, IP address, or event details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 focus:border-cyan-400 focus:outline-none text-xs text-white placeholder-slate-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">Category:</span>
            {categoryOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedCategory(opt.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === opt.value
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-slate-900/60 text-slate-400 hover:text-white border border-transparent hover:border-white/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Severity Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">Severity:</span>
            {severityOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedSeverity(opt.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedSeverity === opt.value
                    ? "bg-white/15 text-white border border-white/30"
                    : "bg-slate-900/60 text-slate-400 hover:text-white border border-transparent hover:border-white/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log Feed Table */}
      <div className="rounded-2xl bg-[#070b16] border border-cyan-500/15 overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <p className="text-xs text-slate-400">Loading company security events...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">No Security Events Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No audit logs match your selected filter criteria. Activity will stream here automatically as users interact with the system.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-slate-950/60 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action & Category</th>
                  <th className="py-3 px-4">Resource / Summary</th>
                  <th className="py-3 px-4">Network & Client</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {logs.map((record) => {
                  const isExpanded = expandedLogId === record.id;
                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => setExpandedLogId(isExpanded ? null : record.id)}
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {record.createdAt}
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-white">
                          {record.userEmail || "System Daemon"}
                        </div>
                        {record.company && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            @{record.company}
                          </span>
                        )}
                      </td>

                      {/* Action & Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${getCategoryBadge(record.category)}`}>
                            {record.actionType}
                          </span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase ${getSeverityBadge(record.severity)}`}>
                            {record.severity}
                          </span>
                        </div>
                      </td>

                      {/* Resource / Summary */}
                      <td className="py-3.5 px-4 max-w-xs md:max-w-md">
                        <div className="text-slate-200 font-medium truncate">
                          {record.details || "No metadata description provided."}
                        </div>
                        {record.targetResource && (
                          <div className="text-[11px] text-cyan-400 font-mono truncate mt-0.5">
                            Target: {record.targetResource}
                          </div>
                        )}
                      </td>

                      {/* Network & Client */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        <div>{record.ipAddress || "127.0.0.1"}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                          {record.userAgent || "Unknown"}
                        </div>
                      </td>

                      {/* Detail Drawer Trigger */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-400/40 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer"
                        >
                          {isExpanded ? "Collapse" : "Inspect"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Expanded Inspector Drawer for Selected Log */}
        {expandedLogId !== null && (
          <div className="p-5 border-t border-cyan-500/20 bg-slate-950/90 space-y-3">
            {(() => {
              const selectedRecord = logs.find((l) => l.id === expandedLogId);
              if (!selectedRecord) return null;
              return (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                      Security Audit Payload Inspection (Record #{selectedRecord.id})
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpandedLogId(null)}
                      className="text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Close Payload
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-black border border-white/10 text-cyan-300 font-mono text-xs overflow-x-auto">
                    {JSON.stringify(selectedRecord, null, 2)}
                  </pre>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
