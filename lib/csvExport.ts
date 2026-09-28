import { AdminUser } from "@/types/admin";

export function exportUsersToCsv(users: AdminUser[]): void {
  if (typeof window === "undefined" || users.length === 0) return;

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

  const escapeCsv = (val: string | number) => {
    const str = String(val ?? "").replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = users.map((u) => [
    escapeCsv(u.id),
    escapeCsv(u.fullName || "N/A"),
    escapeCsv(u.email),
    escapeCsv(u.role),
    escapeCsv(u.mfaEnabled ? "ACTIVE" : "UNPAIRED"),
    escapeCsv(u.assignedServicesCount),
    escapeCsv(u.assignedServiceNames?.join("; ") || "None"),
    escapeCsv(u.createdAt),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `sentinel-iam-users-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
