import type { AdminUser } from "@/types/admin";

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function escapeCsvCell(val: string | number | null | undefined): string {
  let str = String(val ?? "");
  if (FORMULA_PREFIX.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportCsvRows(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
): void {
  if (typeof window === "undefined" || rows.length === 0) return;

  const escapedRows = rows.map((row) => row.map(escapeCsvCell).join(","));
  const csvContent = [headers.map(escapeCsvCell).join(","), ...escapedRows].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportUsersToCsv(users: AdminUser[]): void {
  if (users.length === 0) return;

  const headers = [
    "User ID",
    "Full Name",
    "Email Address",
    "Security Role",
    "MFA Status",
    "Assigned Service Count",
    "Assigned Services",
    "Enrollment Date",
  ];

  const rows = users.map((u) => [
    u.id,
    u.fullName || "N/A",
    u.email,
    u.role,
    u.mfaEnabled ? "ACTIVE" : "UNPAIRED",
    u.assignedServicesCount,
    u.assignedServiceNames?.join("; ") || "None",
    u.createdAt,
  ]);

  const dateStr = new Date().toISOString().split("T")[0];
  exportCsvRows(`sentinel-iam-users-${dateStr}.csv`, headers, rows);
}
