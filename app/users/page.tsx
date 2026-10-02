"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "@/types/auth";
import { AdminUser } from "@/types/admin";
import { getStoredSession, updateStoredUser, clearSession } from "@/lib/session";
import { useAdmin } from "@/hooks/useAdmin";
import { useIntegrations } from "@/hooks/useIntegrations";
import { updateUserProfile } from "@/lib/api";

function generateSecureTempPassword(prefix = "Sec!"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!#$*";
  let result = prefix;
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function UserManagementPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Profile Modal State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Authentication & Guard
  useEffect(() => {
    const session = getStoredSession();
    if (!session || !session.user) {
      router.push("/login");
      return;
    }
    setCurrentUser(session.user);
    setEditFullName(session.user.fullName || "");
  }, [router]);

  const isAdmin = currentUser?.role === "ADMIN";

  // Admin Hook (Tenant-isolated by admin ID and company workspace)
  const {
    users,
    loading: usersLoading,
    actionError,
    actionSuccess,
    createUser,
    batchCreateUsers,
    deleteUser,
    assignService,
    revokeService,
    exportCsv,
    clearFeedback,
  } = useAdmin(isAdmin, currentUser?.userId, currentUser?.company);

  // Integrations Hook (to get catalog services for assignment)
  const { apps: catalogServices } = useIntegrations(currentUser?.userId);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "USER">("ALL");
  const [mfaFilter, setMfaFilter] = useState<"ALL" | "ENROLLED" | "UNPAIRED">("ALL");

  // Unified Provisioning Modal State (Single + Bulk)
  const [provisionModalOpen, setProvisionModalOpen] = useState(false);
  const [provisionTab, setProvisionTab] = useState<"single" | "bulk">("single");

  // Single Member Provisioning Form State
  const [singleName, setSingleName] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [singlePasswordMode, setSinglePasswordMode] = useState<"auto" | "custom">("auto");
  const [singleTempPassword, setSingleTempPassword] = useState("");
  const [singleCustomPassword, setSingleCustomPassword] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleErr, setSingleErr] = useState("");

  // Bulk Provisioning Form State
  const [bulkMode, setBulkMode] = useState<"count" | "roster">("count");
  const [bulkCount, setBulkCount] = useState<number>(5);
  const [bulkPrefix, setBulkPrefix] = useState("Member");
  const [bulkRosterText, setBulkRosterText] = useState("");
  const [bulkPasswordMode, setBulkPasswordMode] = useState<"unique" | "uniform">("unique");
  const [bulkUniformPassword, setBulkUniformPassword] = useState("Welcome2026!Temp");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkErr, setBulkErr] = useState("");

  // Post-Provision Credentials Handoff Modal State
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [createdCredentialsList, setCreatedCredentialsList] = useState<
    Array<{ fullName: string; email: string; tempPass: string; role: string }>
  >([]);
  const [credentialsCopied, setCredentialsCopied] = useState(false);

  // Service Assignment Modal State
  const [assignModalUser, setAssignModalUser] = useState<AdminUser | null>(null);

  // Quick Invite Modal State
  const [inviteModalUser, setInviteModalUser] = useState<AdminUser | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  // Delete User Confirmation State
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AdminUser | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  // Filtered User List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        u.email.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        (u.role && u.role.toLowerCase().includes(q));

      const matchesRole = roleFilter === "ALL" || u.role.toUpperCase() === roleFilter;
      const matchesMfa =
        mfaFilter === "ALL" ||
        (mfaFilter === "ENROLLED" && u.mfaEnabled) ||
        (mfaFilter === "UNPAIRED" && !u.mfaEnabled);

      return matchesSearch && matchesRole && matchesMfa;
    });
  }, [users, searchQuery, roleFilter, mfaFilter]);

  // Handle Opening Provisioning Modal
  const handleOpenProvisionModal = () => {
    setSingleErr("");
    setBulkErr("");
    setSingleTempPassword(generateSecureTempPassword());
    setProvisionModalOpen(true);
  };

  const handleRegenerateSinglePassword = () => {
    setSingleTempPassword(generateSecureTempPassword());
  };

  // Real-Time Computed Bulk Users Preview
  const parsedBulkUsers = useMemo(() => {
    const cleanDomain = currentUser?.company?.toLowerCase().trim().replace(/^@/, "") || "sentinal.corp";
    const list: Array<{ fullName: string; email: string; password: string; role: "USER" }> = [];

    if (bulkMode === "count") {
      const count = Math.max(1, Math.min(Number(bulkCount) || 1, 50));
      const cleanPrefix = bulkPrefix.trim() || "Member";
      const baseSlug = cleanPrefix.toLowerCase().replace(/[^a-z0-9]/g, "_");

      for (let i = 1; i <= count; i++) {
        const pwd =
          bulkPasswordMode === "unique"
            ? generateSecureTempPassword(`Sec${i}!`)
            : bulkUniformPassword.trim() || "Welcome2026!Temp";
        list.push({
          fullName: `${cleanPrefix} ${i}`,
          email: `${baseSlug}_${i}@${cleanDomain}`,
          password: pwd,
          role: "USER",
        });
      }
    } else {
      const lines = bulkRosterText
        .split(/[\n,]+/)
        .map((l) => l.trim())
        .filter(Boolean);

      lines.slice(0, 50).forEach((entry, idx) => {
        let name = "";
        let email = "";
        if (entry.includes("@")) {
          email = entry.toLowerCase();
          const namePart = entry.split("@")[0].replace(/[._-]/g, " ");
          name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        } else {
          name = entry;
          const slug = entry.toLowerCase().replace(/[^a-z0-9]/g, "_");
          email = `${slug}@${cleanDomain}`;
        }
        const pwd =
          bulkPasswordMode === "unique"
            ? generateSecureTempPassword(`Sec${idx + 1}!`)
            : bulkUniformPassword.trim() || "Welcome2026!Temp";
        list.push({
          fullName: name || `Member ${idx + 1}`,
          email,
          password: pwd,
          role: "USER",
        });
      });
    }
    return list;
  }, [bulkMode, bulkCount, bulkPrefix, bulkRosterText, bulkPasswordMode, bulkUniformPassword, currentUser?.company]);

  // Handle Single Member Creation
  const handleCreateSingleUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleErr("");

    if (!singleName.trim() || !singleEmail.trim()) {
      setSingleErr("Full name and email are required.");
      return;
    }

    const finalPassword = singlePasswordMode === "auto" ? singleTempPassword : singleCustomPassword.trim();
    if (!finalPassword || finalPassword.length < 6) {
      setSingleErr("Password must be at least 6 characters.");
      return;
    }

    setSingleLoading(true);
    const created = await createUser({
      fullName: singleName.trim(),
      email: singleEmail.trim().toLowerCase(),
      password: finalPassword,
      role: "USER", // STRICTLY STANDARD USER ONLY!
      company: currentUser?.company,
    });
    setSingleLoading(false);

    if (created) {
      setProvisionModalOpen(false);
      setCreatedCredentialsList([
        {
          fullName: created.fullName,
          email: created.email,
          tempPass: finalPassword,
          role: "USER",
        },
      ]);
      setCredentialsCopied(false);
      setCredentialsModalOpen(true);
      setSingleName("");
      setSingleEmail("");
      setSingleCustomPassword("");
    } else {
      setSingleErr("Failed to create user. Ensure email is unique within the system.");
    }
  };

  // Handle Bulk Member Creation
  const handleExecuteBulkProvision = async () => {
    if (parsedBulkUsers.length === 0) {
      setBulkErr("Please configure at least 1 account to provision.");
      return;
    }

    setBulkLoading(true);
    setBulkErr("");

    const created = await batchCreateUsers({
      users: parsedBulkUsers.map((u) => ({
        fullName: u.fullName,
        email: u.email,
        password: u.password,
        role: "USER",
        serviceIds: [],
      })),
    });
    setBulkLoading(false);

    if (created && created.length > 0) {
      setProvisionModalOpen(false);
      const creds = created.map((c, idx) => ({
        fullName: c.fullName,
        email: c.email,
        tempPass: parsedBulkUsers[idx]?.password || "TempPass",
        role: "USER",
      }));
      setCreatedCredentialsList(creds);
      setCredentialsCopied(false);
      setCredentialsModalOpen(true);
      setBulkRosterText("");
    } else {
      setBulkErr("Failed to provision batch. Verify that email addresses are unique.");
    }
  };

  // Handle Copy All Credentials
  const handleCopyAllCredentials = () => {
    const company = currentUser?.company || "Organization";
    const header = [
      `SENTINEL ENTERPRISE IAM - PROVISIONED CREDENTIALS`,
      `Tenant Workspace: @${company}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Total Accounts: ${createdCredentialsList.length}`,
      "==================================================",
      "",
    ];
    const rows = createdCredentialsList.map(
      (c, idx) =>
        `${idx + 1}. ${c.fullName}\n   Email: ${c.email}\n   Temporary Password: ${c.tempPass}\n   Role: Standard Member (USER)\n`
    );
    const footer = [
      "==================================================",
      "Instructions: Provide credentials to employees. Employees must authenticate and pair MFA on first sign-in.",
    ];
    const fullText = [...header, ...rows, ...footer].join("\n");
    navigator.clipboard.writeText(fullText);
    setCredentialsCopied(true);
    setTimeout(() => setCredentialsCopied(false), 2000);
  };

  // Handle Export Credentials to CSV
  const handleExportCredentialsCsv = () => {
    const rows = [
      ["Full Name", "Email Address", "Temporary Password", "Role", "Company Workspace"],
      ...createdCredentialsList.map((c) => [c.fullName, c.email, c.tempPass, c.role, currentUser?.company || ""]),
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.map((val) => `"${val}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sentinel_credentials_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Profile Update (Name Only)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!editFullName.trim()) {
      setProfileError("Account name cannot be empty.");
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    const res = await updateUserProfile(currentUser.userId, editFullName.trim());
    setProfileSaving(false);

    if (res.success) {
      updateStoredUser({ fullName: editFullName.trim() });
      setCurrentUser((prev) => (prev ? { ...prev, fullName: editFullName.trim() } : prev));
      setProfileSuccess("Account name updated successfully.");
      setTimeout(() => {
        setProfileModalOpen(false);
        setProfileSuccess("");
      }, 1200);
    } else {
      setProfileError(res.message || "Failed to update account name.");
    }
  };

  // Handle User Deletion
  const handleConfirmDelete = async () => {
    if (!deleteConfirmUser) return;
    setDeletingUserId(deleteConfirmUser.id);
    await deleteUser(deleteConfirmUser.id);
    setDeletingUserId(null);
    setDeleteConfirmUser(null);
  };

  const handleSignOut = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Enterprise Bar */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-cyan-500/20 px-6 sm:px-10 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <span className="font-bold text-white tracking-tight text-base group-hover:text-cyan-400 transition-colors">
              Sentinel{" "}
              <span className="text-cyan-400 font-normal text-xs uppercase ml-1 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                IAM Governance
              </span>
            </span>
          </Link>

          <span className="text-slate-600 hidden sm:inline">/</span>
          <span className="text-xs font-semibold text-slate-300 hidden sm:inline">
            User Directory & Access Provisioning
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-all"
          >
            <span>Back to Dashboard</span>
          </Link>

          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenProvisionModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Provision Members</span>
            </button>
          )}

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-slate-900 border border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center">
                {currentUser?.fullName?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-xs font-semibold text-white max-w-[100px] truncate hidden md:inline">
                {currentUser?.fullName || currentUser?.email}
              </span>
              <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-950 border border-white/10 p-2 shadow-2xl z-50">
                <div className="px-3 py-2 border-b border-white/5 mb-1">
                  <p className="text-xs font-bold text-white truncate">{currentUser?.fullName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser?.email}</p>
                  <span className="inline-block mt-1 text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold">
                    {currentUser?.role || "USER"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setProfileModalOpen(true);
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  <span>Edit Profile Name</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-10 py-8 flex flex-col gap-6">
        {/* Banner Feedback */}
        {actionSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <span>{actionSuccess}</span>
            <button type="button" onClick={clearFeedback} className="text-emerald-400 hover:text-white cursor-pointer">
              ✕
            </button>
          </div>
        )}
        {actionError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <span>{actionError}</span>
            <button type="button" onClick={clearFeedback} className="text-rose-400 hover:text-white cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Company Workspace Tenant Isolation Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-black border border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Company Workspace: <span className="text-purple-400 font-mono">@{currentUser?.company || "Primary Organization"}</span>
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Tenant Isolated
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-tenant security active. You only manage users and provision services within this company.
              </p>
            </div>
          </div>
        </div>

        {/* Directory Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-black border border-white/10 flex flex-col">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Directory</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-white">{users.length}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                Accounts
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black border border-white/10 flex flex-col">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Administrators</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-purple-400">
                {users.filter((u) => u.role === "ADMIN").length}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
                Privileged
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black border border-white/10 flex flex-col">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Standard Members</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-blue-400">
                {users.filter((u) => u.role !== "ADMIN").length}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300">
                Standard
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black border border-white/10 flex flex-col">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">2FA Protected</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-emerald-400">
                {users.filter((u) => u.mfaEnabled).length}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                Enrolled
              </span>
            </div>
          </div>
        </div>

        {/* Filter and Action Strip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-black/60 border border-white/10">
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/10">
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} className="text-slate-500 hover:text-white text-xs">
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-slate-900 border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-1.5 outline-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admins Only</option>
              <option value="USER">Users Only</option>
            </select>

            <select
              value={mfaFilter}
              onChange={(e) => setMfaFilter(e.target.value as any)}
              className="bg-slate-900 border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-1.5 outline-none cursor-pointer"
            >
              <option value="ALL">All MFA States</option>
              <option value="ENROLLED">2FA Enrolled</option>
              <option value="UNPAIRED">Unpaired</option>
            </select>

            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* User Directory Table */}
        <div className="rounded-2xl bg-black border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-white/10 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Member Identity</th>
                  <th className="py-3 px-4">Role Tier</th>
                  <th className="py-3 px-4">MFA Factor</th>
                  <th className="py-3 px-4">Assigned Services</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {usersLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg className="animate-spin h-6 w-6 text-cyan-400" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Loading user directory...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-slate-400">
                      <p className="text-sm font-semibold text-white">No members matching directory filters.</p>
                      <p className="text-xs text-slate-500 mt-1">Use &quot;Provision Members&quot; to onboard staff.</p>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={handleOpenProvisionModal}
                          className="mt-4 px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                        >
                          + Provision Members
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.id === currentUser?.userId;
                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                              {u.fullName?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">{u.fullName}</span>
                                {isSelf && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-semibold">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-400 text-[11px] block">{u.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === "ADMIN"
                                ? "bg-purple-500/10 border border-purple-500/30 text-purple-300"
                                : "bg-blue-500/10 border border-blue-500/30 text-blue-300"
                            }`}
                          >
                            {u.role === "ADMIN" ? "ADMIN" : "MEMBER"}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              u.mfaEnabled
                                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${u.mfaEnabled ? "bg-emerald-400" : "bg-amber-400"}`} />
                            <span>{u.mfaEnabled ? "2FA Active" : "Unpaired"}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                            <span className="text-xs font-semibold text-white">
                              {u.assignedServicesCount || 0}
                            </span>
                            {u.assignedServiceNames && u.assignedServiceNames.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {u.assignedServiceNames.slice(0, 2).map((sName, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-300"
                                  >
                                    {sName}
                                  </span>
                                ))}
                                {u.assignedServiceNames.length > 2 && (
                                  <span className="text-[10px] text-slate-500">
                                    +{u.assignedServiceNames.length - 2} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-400 text-[11px]">{u.createdAt || "N/A"}</td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setAssignModalUser(u)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
                                >
                                  Services
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setInviteModalUser(u);
                                    setInviteCopied(false);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                                >
                                  Invite
                                </button>

                                {!isSelf && (
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmUser(u)}
                                    className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all cursor-pointer"
                                    title="Delete User"
                                  >
                                    Delete
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* UNIFIED MODAL: PROVISION MEMBERS (SINGLE + BULK) */}
      {provisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-cyan-500/30 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setProvisionModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold tracking-tight text-white">Provision Member Accounts</h3>
              <p className="text-xs text-slate-400 mt-1">
                Onboard standard employees to workspace <span className="text-cyan-400 font-mono">@{currentUser?.company || "Organization"}</span>.
              </p>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-5">
              <button
                type="button"
                onClick={() => setProvisionTab("single")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  provisionTab === "single"
                    ? "bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Single Member
              </button>
              <button
                type="button"
                onClick={() => setProvisionTab("bulk")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  provisionTab === "bulk"
                    ? "bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Bulk Provisioning
              </button>
            </div>

            {/* TAB 1: SINGLE MEMBER */}
            {provisionTab === "single" && (
              <form onSubmit={handleCreateSingleUser} className="space-y-4">
                {singleErr && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {singleErr}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={singleName}
                    onChange={(e) => setSingleName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Company Email Address *</label>
                  <input
                    type="email"
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    placeholder={`e.g. sarah@${currentUser?.company?.replace(/^@/, "") || "company.corp"}`}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                {/* Role Assignment - Strictly Locked to USER */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Security Role</label>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Standard Member</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono font-semibold">
                        USER
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 italic">
                      Admins must self-register via public onboarding
                    </span>
                  </div>
                </div>

                {/* Temporary Password Section */}
                <div className="p-3.5 rounded-2xl bg-black/80 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Initial Temporary Password</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSinglePasswordMode("auto")}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                          singlePasswordMode === "auto" ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Auto-Generate
                      </button>
                      <button
                        type="button"
                        onClick={() => setSinglePasswordMode("custom")}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                          singlePasswordMode === "custom" ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Custom Passphrase
                      </button>
                    </div>
                  </div>

                  {singlePasswordMode === "auto" ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#131926] border border-cyan-500/30">
                      <code className="text-xs font-mono font-bold text-cyan-300 flex-1 truncate tracking-wider">
                        {singleTempPassword}
                      </code>
                      <button
                        type="button"
                        onClick={handleRegenerateSinglePassword}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white transition-all cursor-pointer shrink-0"
                      >
                        Regenerate
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={singleCustomPassword}
                      onChange={(e) => setSingleCustomPassword(e.target.value)}
                      placeholder="Enter minimum 6-character initial password"
                      className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white outline-none focus:border-cyan-400"
                      required
                    />
                  )}
                  <p className="text-[10px] text-slate-400">
                    Employee will use this temporary credential for initial sign-in and will be required to pair their MFA device.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setProvisionModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={singleLoading}
                    className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {singleLoading ? "Provisioning..." : "Provision Member"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: BULK PROVISIONING */}
            {provisionTab === "bulk" && (
              <div className="space-y-4">
                {bulkErr && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {bulkErr}
                  </div>
                )}

                {/* Bulk Method Selection */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkMode("count")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      bulkMode === "count"
                        ? "bg-cyan-500/10 border-cyan-400 text-cyan-300"
                        : "bg-black border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    Numeric Count Generator
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkMode("roster")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      bulkMode === "roster"
                        ? "bg-cyan-500/10 border-cyan-400 text-cyan-300"
                        : "bg-black border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    Paste Email Roster List
                  </button>
                </div>

                {bulkMode === "count" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Number of Accounts (Min: 1, Max: 50)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={bulkCount}
                        onChange={(e) => setBulkCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                        className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white outline-none focus:border-cyan-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Member Role Prefix
                      </label>
                      <input
                        type="text"
                        value={bulkPrefix}
                        onChange={(e) => setBulkPrefix(e.target.value)}
                        placeholder="e.g. Member, Analyst, Engineer"
                        className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Paste Emails / Names (Line by line or comma-separated)
                    </label>
                    <textarea
                      rows={4}
                      value={bulkRosterText}
                      onChange={(e) => setBulkRosterText(e.target.value)}
                      placeholder={`sarah@${currentUser?.company || "company.corp"}\njohn.doe@${currentUser?.company || "company.corp"}\nalice.wong`}
                      className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Accepts direct email addresses or usernames. The workspace domain is automatically applied if omitted.
                    </p>
                  </div>
                )}

                {/* Password Strategy for Bulk */}
                <div className="p-3.5 rounded-2xl bg-black/80 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Bulk Temporary Password Strategy</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setBulkPasswordMode("unique")}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                          bulkPasswordMode === "unique" ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Unique per Account
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkPasswordMode("uniform")}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                          bulkPasswordMode === "uniform" ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Uniform Passphrase
                      </button>
                    </div>
                  </div>

                  {bulkPasswordMode === "uniform" && (
                    <input
                      type="text"
                      value={bulkUniformPassword}
                      onChange={(e) => setBulkUniformPassword(e.target.value)}
                      placeholder="e.g. Welcome2026!Temp"
                      className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                    />
                  )}
                </div>

                {/* Real-Time Preview Table */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Pre-Flight Provisioning Preview ({parsedBulkUsers.length} accounts)
                    </label>
                    <span className="text-[10px] text-slate-400">All accounts assigned role: USER</span>
                  </div>

                  <div className="max-h-44 overflow-y-auto rounded-xl border border-white/10 bg-black/60">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-slate-900/60 text-slate-400 text-[10px] uppercase font-semibold">
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Full Name</th>
                          <th className="py-2 px-3">Login Email</th>
                          <th className="py-2 px-3">Initial Temp Password</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                        {parsedBulkUsers.slice(0, 10).map((u, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02]">
                            <td className="py-1.5 px-3 text-slate-500">{idx + 1}</td>
                            <td className="py-1.5 px-3 text-slate-200">{u.fullName}</td>
                            <td className="py-1.5 px-3 text-cyan-300">{u.email}</td>
                            <td className="py-1.5 px-3 text-amber-300 truncate max-w-[120px]">{u.password}</td>
                          </tr>
                        ))}
                        {parsedBulkUsers.length > 10 && (
                          <tr>
                            <td colSpan={4} className="py-2 px-3 text-center text-slate-500 italic">
                              +{parsedBulkUsers.length - 10} more accounts will be provisioned
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setProvisionModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={bulkLoading || parsedBulkUsers.length === 0}
                    onClick={handleExecuteBulkProvision}
                    className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {bulkLoading ? "Provisioning Registry..." : `Provision ${parsedBulkUsers.length} Members`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: CREDENTIALS HANDOFF MODAL (POST-PROVISION SUCCESS) */}
      {credentialsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setCredentialsModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-white">Accounts Provisioned Successfully</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generated {createdCredentialsList.length} member credentials. Securely distribute these temporary passwords to staff.
                </p>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-black/80 mb-5">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/60 text-slate-400 text-[10px] uppercase font-semibold">
                    <th className="py-2.5 px-3.5">Name</th>
                    <th className="py-2.5 px-3.5">Email Address</th>
                    <th className="py-2.5 px-3.5">Initial Temp Password</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[11px] font-mono">
                  {createdCredentialsList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="py-2 px-3.5 text-white font-sans font-semibold">{item.fullName}</td>
                      <td className="py-2 px-3.5 text-cyan-300">{item.email}</td>
                      <td className="py-2 px-3.5 text-amber-300 font-bold select-all">{item.tempPass}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs mb-5">
              Notice: Employees sign in via the portal using these credentials and are prompted to pair their mobile MFA authenticator.
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAllCredentials}
                  className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{credentialsCopied ? "Copied Roster!" : "Copy All Credentials"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCredentialsCsv}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export CSV</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setCredentialsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PROFILE SELF-MANAGEMENT (NAME ONLY, CREDENTIALS LOCKED) */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Account Profile Settings</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Manage identity details and view credential permissions.</p>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {profileSuccess && (
              <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {profileError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Display Name <span className="text-cyan-400 font-normal">(Editable)</span>
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/20 text-xs text-white outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-400">Login Credential / Email</label>
                  <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Locked by IAM
                  </span>
                </div>
                <input
                  type="email"
                  value={currentUser?.email || ""}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-400 outline-none cursor-not-allowed select-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Login credentials and emails are governed by Sentinel IAM policy and cannot be modified by account owners. Contact an administrator to request a credential update.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned Privilege Tier</label>
                <input
                  type="text"
                  value={currentUser?.role || "USER"}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-400 outline-none cursor-not-allowed select-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-4 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {profileSaving ? "Saving..." : "Save Name"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SERVICE ASSIGNMENT MODAL */}
      {assignModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-white/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Assign Services</h3>
                <p className="text-xs text-slate-400 mt-0.5">User: {assignModalUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalUser(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
              {catalogServices.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No services configured in catalog yet. Add services from Dashboard first.
                </p>
              ) : (
                catalogServices.map((svc) => {
                  const svcId = typeof svc.id === "number" ? svc.id : Number(svc.id);
                  const isAssigned = assignModalUser.assignedServiceIds?.includes(svcId);
                  return (
                    <div
                      key={svc.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-black border border-white/10"
                    >
                      <div>
                        <span className="text-xs font-bold text-white block">{svc.name}</span>
                        <span className="text-[11px] text-slate-400">{svc.category}</span>
                      </div>
                      {isAssigned ? (
                        <button
                          type="button"
                          onClick={() => revokeService(assignModalUser.id, svcId)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => assignService(assignModalUser.id, svcId, svc.name)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                        >
                          Assign
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setAssignModalUser(null)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: INVITE MODAL */}
      {inviteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">Member Onboarding Details</h3>
              <button
                type="button"
                onClick={() => setInviteModalUser(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Member Email</span>
                <div className="p-2.5 rounded-xl bg-black border border-white/10 text-xs font-mono text-cyan-300">
                  {inviteModalUser.email}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Portal Login Address</span>
                <div className="p-2.5 rounded-xl bg-black border border-white/10 text-xs font-mono text-slate-300">
                  {typeof window !== "undefined" ? `${window.location.origin}/login` : "http://localhost:3000/login"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  const url = typeof window !== "undefined" ? `${window.location.origin}/login` : "http://localhost:3000/login";
                  navigator.clipboard.writeText(
                    `Hello ${inviteModalUser.fullName},\n\nYou have been provisioned a member account on Sentinel IAM.\nPlease sign in at: ${url}\nEmail: ${inviteModalUser.email}\nRole: Standard Member`
                  );
                  setInviteCopied(true);
                  setTimeout(() => setInviteCopied(false), 2000);
                }}
                className="px-4 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                {inviteCopied ? "Copied Details!" : "Copy Onboarding Note"}
              </button>
              <button
                type="button"
                onClick={() => setInviteModalUser(null)}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: DELETE USER CONFIRMATION */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-rose-500/30 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-2">Delete Member Account</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-white">{deleteConfirmUser.email}</span>? This will revoke all session access and service entitlements.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingUserId !== null}
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {deletingUserId !== null ? "Deleting..." : "Delete Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
