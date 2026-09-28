"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "@/types/auth";
import { AdminUser, UserTemplateConfig, BatchCreateUserItem } from "@/types/admin";
import { AppIntegration } from "@/types/integration";
import { getStoredSession, updateStoredUser, clearSession } from "@/lib/session";
import { useAdmin } from "@/hooks/useAdmin";
import { useIntegrations } from "@/hooks/useIntegrations";
import { updateUserProfile } from "@/lib/api";

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

  // Admin Hook
  const {
    users,
    loading: usersLoading,
    actionError,
    actionSuccess,
    loadUsers,
    createUser,
    batchCreateUsers,
    deleteUser,
    assignService,
    revokeService,
    exportCsv,
    clearFeedback,
  } = useAdmin(isAdmin);

  // Integrations Hook (to get catalog services for assignment)
  const { apps: catalogServices } = useIntegrations(currentUser?.userId);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "USER">("ALL");
  const [mfaFilter, setMfaFilter] = useState<"ALL" | "ENROLLED" | "UNPAIRED">("ALL");

  // Fast Single User Modal State
  const [singleUserModalOpen, setSingleUserModalOpen] = useState(false);
  const [singleName, setSingleName] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [singlePassword, setSinglePassword] = useState("");
  const [singleRole, setSingleRole] = useState<"USER" | "ADMIN">("USER");
  const [singleErr, setSingleErr] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);

  // Template User Generator Modal State
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateConfig, setTemplateConfig] = useState<UserTemplateConfig>({
    templateName: "Engineering Members",
    role: "USER",
    namePrefix: "Engineering Member",
    emailDomain: "sentinal.corp",
    passwordStrategy: "random_secure",
    customPasswordPrefix: "Welcome2026!",
    assignedServiceIds: [],
    count: 3,
  });
  const [generatedBatch, setGeneratedBatch] = useState<BatchCreateUserItem[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState("");
  const [batchErrorMsg, setBatchErrorMsg] = useState("");

  // Service Assignment Modal State
  const [assignModalUser, setAssignModalUser] = useState<AdminUser | null>(null);

  // Invite Modal State
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

  // Generate Batch Preview when Template Config changes
  useEffect(() => {
    const list: BatchCreateUserItem[] = [];
    const count = Math.max(1, Math.min(templateConfig.count, 25));
    const cleanDomain = templateConfig.emailDomain.trim().replace(/^@/, "") || "sentinal.corp";
    const baseSlug = templateConfig.namePrefix.trim().toLowerCase().replace(/[^a-z0-9]/g, "_") || "user";

    for (let i = 1; i <= count; i++) {
      let pwd = "";
      if (templateConfig.passwordStrategy === "random_secure") {
        const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
        pwd = `SecPass_${rand}!`;
      } else if (templateConfig.passwordStrategy === "uniform_temp") {
        pwd = templateConfig.customPasswordPrefix?.trim() || "Sentinel2026!";
      } else {
        pwd = `InitPass_${1000 + i}`;
      }

      list.push({
        fullName: `${templateConfig.namePrefix.trim() || "Member"} ${i}`,
        email: `${baseSlug}_${i}@${cleanDomain}`,
        password: pwd,
        role: templateConfig.role,
        serviceIds: templateConfig.assignedServiceIds,
      });
    }
    setGeneratedBatch(list);
  }, [templateConfig]);

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
      setCurrentUser((prev) => prev ? { ...prev, fullName: editFullName.trim() } : prev);
      setProfileSuccess("Account name updated successfully.");
      setTimeout(() => {
        setProfileModalOpen(false);
        setProfileSuccess("");
      }, 1200);
    } else {
      setProfileError(res.message || "Failed to update account name.");
    }
  };

  // Handle Single User Fast Creation
  const handleCreateSingleUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim() || !singleEmail.trim() || !singlePassword.trim()) {
      setSingleErr("All fields are required.");
      return;
    }
    if (singlePassword.length < 6) {
      setSingleErr("Password must be at least 6 characters.");
      return;
    }

    setSingleLoading(true);
    setSingleErr("");
    const res = await createUser({
      fullName: singleName.trim(),
      email: singleEmail.trim(),
      password: singlePassword,
      role: singleRole,
    });
    setSingleLoading(false);

    if (res) {
      setSingleName("");
      setSingleEmail("");
      setSinglePassword("");
      setSingleUserModalOpen(false);
    } else {
      setSingleErr("Failed to create user. Ensure email is unique.");
    }
  };

  // Handle Batch Provisioning
  const handleExecuteBatchProvision = async () => {
    if (generatedBatch.length === 0) return;
    setBatchLoading(true);
    setBatchErrorMsg("");
    setBatchSuccessMsg("");

    const created = await batchCreateUsers({ users: generatedBatch });
    setBatchLoading(false);

    if (created && created.length > 0) {
      setBatchSuccessMsg(`Successfully provisioned ${created.length} users into the registry.`);
      // Download credentials summary
      downloadCredentialsText(generatedBatch);
      setTimeout(() => {
        setTemplateModalOpen(false);
        setBatchSuccessMsg("");
      }, 2000);
    } else {
      setBatchErrorMsg("Failed to provision batch. Check for duplicate emails.");
    }
  };

  // Download Generated Credentials File
  const downloadCredentialsText = (items: BatchCreateUserItem[]) => {
    const lines = [
      "SENTINEL ENTERPRISE IAM - BATCH ONBOARDING CREDENTIALS",
      `Generated at: ${new Date().toLocaleString()}`,
      `Total Users: ${items.length}`,
      "----------------------------------------------------------------",
      "Full Name | Email Address | Temporary Password | Role",
      "----------------------------------------------------------------",
      ...items.map((it) => `${it.fullName} | ${it.email} | ${it.password} | ${it.role}`),
      "----------------------------------------------------------------",
      "Notice: Users must sign in via http://localhost:3000/login and pair MFA.",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sentinel_onboarding_batch_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="font-bold text-white tracking-tight text-base group-hover:text-cyan-400 transition-colors">
              Sentinel <span className="text-cyan-400 font-normal text-xs uppercase ml-1 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">IAM Governance</span>
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
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Dashboard</span>
          </Link>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setSingleUserModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Quick User</span>
              </button>

              <button
                type="button"
                onClick={() => setTemplateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Template Generator</span>
              </button>
            </>
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Loading user directory...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No members matching the current filters.
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
                            {u.role}
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

                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {u.createdAt || "N/A"}
                        </td>

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

      {/* MODAL 1: TEMPLATE USER GENERATOR */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-cyan-500/30 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Template-Based User Generator</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Define user naming patterns, roles, and automated service provisioning for batch deployment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="text-slate-400 hover:text-white text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            {batchSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {batchSuccessMsg}
              </div>
            )}
            {batchErrorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {batchErrorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Template Name</label>
                <input
                  type="text"
                  value={templateConfig.templateName}
                  onChange={(e) => setTemplateConfig({ ...templateConfig, templateName: e.target.value })}
                  placeholder="e.g. Engineering Squad"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplateConfig({ ...templateConfig, role: "USER" })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      templateConfig.role === "USER"
                        ? "bg-blue-500/20 border-blue-400 text-blue-300"
                        : "bg-black border-white/10 text-slate-400"
                    }`}
                  >
                    Standard User
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateConfig({ ...templateConfig, role: "ADMIN" })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      templateConfig.role === "ADMIN"
                        ? "bg-purple-500/20 border-purple-400 text-purple-300"
                        : "bg-black border-white/10 text-slate-400"
                    }`}
                  >
                    Administrator
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name Base Pattern</label>
                <input
                  type="text"
                  value={templateConfig.namePrefix}
                  onChange={(e) => setTemplateConfig({ ...templateConfig, namePrefix: e.target.value })}
                  placeholder="e.g. Developer Intern"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white outline-none focus:border-cyan-400"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Generates: {templateConfig.namePrefix} 1, 2, ...</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Domain Pattern</label>
                <input
                  type="text"
                  value={templateConfig.emailDomain}
                  onChange={(e) => setTemplateConfig({ ...templateConfig, emailDomain: e.target.value })}
                  placeholder="company.org"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white outline-none focus:border-cyan-400"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Generates: slug_n@{templateConfig.emailDomain || "company.org"}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Batch Generation Quantity ({templateConfig.count})
                </label>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={templateConfig.count}
                  onChange={(e) => setTemplateConfig({ ...templateConfig, count: parseInt(e.target.value, 10) || 1 })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>1 User</span>
                  <span>5 Users</span>
                  <span>10 Users</span>
                  <span>15 Users</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Temporary Password Policy</label>
                <select
                  value={templateConfig.passwordStrategy}
                  onChange={(e) => setTemplateConfig({ ...templateConfig, passwordStrategy: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="random_secure">Auto-Generated Secure Key (SecPass_XXXX!)</option>
                  <option value="uniform_temp">Uniform Temporary Password (Welcome2026!)</option>
                  <option value="prefix_number">Sequential Key (InitPass_100X)</option>
                </select>
              </div>
            </div>

            {/* Catalog Services Pre-Assignment Checkboxes */}
            {catalogServices.length > 0 && (
              <div className="mb-6 p-4 rounded-2xl bg-black border border-white/10">
                <label className="block text-xs font-semibold text-cyan-300 mb-2">
                  Auto-Assign Catalog Services Upon Provisioning:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {catalogServices.map((svc) => {
                    const svcId = typeof svc.id === "number" ? svc.id : Number(svc.id);
                    const isChecked = templateConfig.assignedServiceIds.includes(svcId);
                    return (
                      <label
                        key={svc.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-300"
                            : "bg-slate-900/60 border-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const nextIds = isChecked
                              ? templateConfig.assignedServiceIds.filter((id) => id !== svcId)
                              : [...templateConfig.assignedServiceIds, svcId];
                            setTemplateConfig({ ...templateConfig, assignedServiceIds: nextIds });
                          }}
                          className="accent-cyan-400"
                        />
                        <span className="truncate">{svc.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Generated Batch Preview Table */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">
                  Provisioning Preview ({generatedBatch.length} Users Ready)
                </span>
                <span className="text-[10px] text-cyan-400">Credentials will be bundled into a download file</span>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-black">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-900/80 text-slate-400 border-b border-white/10">
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Email Address</th>
                      <th className="py-2 px-3">Temp Password</th>
                      <th className="py-2 px-3">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {generatedBatch.map((item, idx) => (
                      <tr key={idx} className="text-slate-300 hover:bg-white/[0.02]">
                        <td className="py-1.5 px-3 font-medium text-white">{item.fullName}</td>
                        <td className="py-1.5 px-3">{item.email}</td>
                        <td className="py-1.5 px-3 font-mono text-cyan-300">{item.password}</td>
                        <td className="py-1.5 px-3 text-[10px] uppercase font-bold text-slate-400">{item.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={batchLoading || generatedBatch.length === 0}
                onClick={handleExecuteBatchProvision}
                className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
              >
                {batchLoading ? "Provisioning Registry..." : `Provision All ${generatedBatch.length} Users`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: FAST SINGLE USER CREATION */}
      {singleUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">Create New Member</h3>
              <button
                type="button"
                onClick={() => setSingleUserModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {singleErr && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {singleErr}
              </div>
            )}

            <form onSubmit={handleCreateSingleUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Account Name</label>
                <input
                  type="text"
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  placeholder="e.g. Alice Mercer"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Login Email Address</label>
                <input
                  type="email"
                  value={singleEmail}
                  onChange={(e) => setSingleEmail(e.target.value)}
                  placeholder="alice@company.org"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Password</label>
                <input
                  type="password"
                  value={singlePassword}
                  onChange={(e) => setSinglePassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Role Assignment</label>
                <select
                  value={singleRole}
                  onChange={(e) => setSingleRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="USER">Standard User</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSingleUserModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={singleLoading}
                  className="px-4 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {singleLoading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
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
              {/* Editable Name Field */}
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

              {/* Locked Email Credential */}
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
                <div className="relative">
                  <input
                    type="email"
                    value={currentUser?.email || ""}
                    disabled
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-400 outline-none cursor-not-allowed select-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Login credentials and emails are governed by Sentinel IAM policy and cannot be modified by account owners. Contact an administrator to request a credential update.
                </p>
              </div>

              {/* Locked Role */}
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
                      <button
                        type="button"
                        onClick={async () => {
                          if (isAssigned) {
                            await revokeService(assignModalUser.id, svcId);
                            setAssignModalUser((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    assignedServiceIds: prev.assignedServiceIds.filter((id) => id !== svcId),
                                    assignedServiceNames: prev.assignedServiceNames.filter((n) => n !== svc.name),
                                    assignedServicesCount: Math.max(0, prev.assignedServicesCount - 1),
                                  }
                                : null
                            );
                          } else {
                            await assignService(assignModalUser.id, svcId, svc.name);
                            setAssignModalUser((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    assignedServiceIds: [...(prev.assignedServiceIds || []), svcId],
                                    assignedServiceNames: [...(prev.assignedServiceNames || []), svc.name],
                                    assignedServicesCount: (prev.assignedServicesCount || 0) + 1,
                                  }
                                : null
                            );
                          }
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isAssigned
                            ? "bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
                            : "bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
                        }`}
                      >
                        {isAssigned ? "Revoke" : "Authorize"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setAssignModalUser(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: EMAIL INVITE SUMMARY */}
      {inviteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-white/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">Member Onboarding Dispatch</h3>
              <button
                type="button"
                onClick={() => setInviteModalUser(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-black border border-white/10 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed mb-4">
{`To: ${inviteModalUser.email}
Subject: Welcome to Sentinel IAM - Account Onboarding

Hello ${inviteModalUser.fullName},

Your enterprise Sentinel identity profile has been provisioned.

Account Email: ${inviteModalUser.email}
Role: ${inviteModalUser.role}
Access Portal: http://localhost:3000/login

Instructions:
1. Log in with your email and initial temporary password.
2. Complete pairing with your mobile authenticator app.
3. Access your assigned SSO enterprise resources.`}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-[11px] text-slate-400">Ready to dispatch via email client</span>
              <button
                type="button"
                onClick={() => {
                  const text = `To: ${inviteModalUser.email}\nSubject: Welcome to Sentinel IAM\n\nHello ${inviteModalUser.fullName},\n\nYour account has been provisioned at http://localhost:3000/login.`;
                  navigator.clipboard.writeText(text);
                  setInviteCopied(true);
                  setTimeout(() => setInviteCopied(false), 2000);
                }}
                className="px-4 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all cursor-pointer"
              >
                {inviteCopied ? "Copied to Clipboard" : "Copy Invite Text"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: DELETE CONFIRMATION */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-rose-500/30 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white">Delete User Account?</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Are you sure you want to permanently delete <span className="text-white font-semibold">{deleteConfirmUser.email}</span> and revoke all assigned services? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingUserId !== null}
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition-all shadow-md shadow-rose-500/20 disabled:opacity-50 cursor-pointer"
              >
                {deletingUserId !== null ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
