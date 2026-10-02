"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface SaasLicense {
  name: string;
  vendor: string;
  totalSeats: number;
  activeSeats: number;
  costPerSeat: number;
  riskRating: "Clean" | "Needs Review" | "Underutilized";
  iconBg: string;
}

const SAAS_CATALOG: SaasLicense[] = [
  {
    name: "Google Workspace E5",
    vendor: "Google LLC",
    totalSeats: 1500,
    activeSeats: 1420,
    costPerSeat: 20,
    riskRating: "Clean",
    iconBg: "bg-blue-500/20 text-blue-400",
  },
  {
    name: "Slack Enterprise Grid",
    vendor: "Salesforce",
    totalSeats: 800,
    activeSeats: 610,
    costPerSeat: 15,
    riskRating: "Underutilized",
    iconBg: "bg-purple-500/20 text-purple-400",
  },
  {
    name: "GitHub Enterprise",
    vendor: "Microsoft",
    totalSeats: 400,
    activeSeats: 395,
    costPerSeat: 21,
    riskRating: "Clean",
    iconBg: "bg-emerald-500/20 text-emerald-400",
  },
  {
    name: "Figma Organization",
    vendor: "Adobe / Figma",
    totalSeats: 120,
    activeSeats: 82,
    costPerSeat: 45,
    riskRating: "Underutilized",
    iconBg: "bg-amber-500/20 text-amber-400",
  },
  {
    name: "Notion Enterprise",
    vendor: "Notion Labs",
    totalSeats: 350,
    activeSeats: 290,
    costPerSeat: 18,
    riskRating: "Needs Review",
    iconBg: "bg-red-500/20 text-red-400",
  },
];

export default function CalyxPage() {
  const [activeTab, setActiveTab] = useState("directory");
  const [orgName, setOrgName] = useState("Sentinel Security Org");
  const [search, setSearch] = useState("");

  const filteredCatalog = SAAS_CATALOG.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.vendor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#040f0b] text-slate-100 font-sans antialiased flex flex-col">
      {/* =========================================================
          DISTINCT NAVBAR: Dual-Tier Horizontal Top Header (Vanta/Drata style)
      ========================================================= */}
      {/* Tier 1: Primary Enterprise Command Bar */}
      <header className="bg-[#061912] border-b border-emerald-950 px-6 sm:px-10 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo-calyx.svg"
              alt="Calyx Logo"
              width={30}
              height={30}
              className="w-7 h-7 object-contain"
            />
            <span className="font-bold text-base tracking-tight text-white">Calyx Cloud</span>
          </div>

          <div className="h-5 w-[1px] bg-emerald-900/60 hidden md:block" />

          {/* Org Switcher Selector */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#09241a] border border-emerald-800/40 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-white font-semibold">{orgName}</span>
            <span className="text-emerald-400 font-mono text-[10px] px-1.5 py-0.2 bg-emerald-950 rounded">
              SOC2 Tier-1
            </span>
          </div>
        </div>

        {/* Right Section: Sentinel SSO Origin & Exit */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
            </svg>
            <span className="font-medium hidden sm:inline">SSO: Nadia (Sentinel IAM)</span>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white border border-white/10 transition-all"
          >
            <span>IAM Portal</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Tier 2: Category Pill Navigation */}
      <div className="bg-[#05130d] border-b border-emerald-950/60 px-6 sm:px-10 flex items-center justify-between overflow-x-auto">
        <nav className="flex space-x-1 sm:space-x-4 py-2 text-xs font-medium">
          {[
            { id: "directory", label: "SaaS App Directory (24)" },
            { id: "compliance", label: "SOC 2 & ISO Controls" },
            { id: "optimization", label: "License Spend Rightsizing" },
            { id: "shadow", label: "Shadow IT Radar" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
          <span>Continuous Evidence Sync:</span>
          <span className="text-emerald-400 font-bold font-mono">100% Passing</span>
        </div>
      </div>

      {/* =========================================================
          MAIN SAAS GOVERNANCE BODY
      ========================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-10 space-y-8">
        {/* Compliance Score Ribbon */}
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#06241a] via-[#051a13] to-[#04120c] border border-emerald-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative w-16 h-16 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center font-bold text-xl text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.2)]">
              98%
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Organization Cloud Posture: Strong</h2>
              <p className="text-xs text-slate-400 mt-1">
                Zero open high-risk OAuth grants detected across 24 connected SaaS domains. Next automated audit window in 4 days.
              </p>
            </div>
          </div>

          <button
            onClick={() => alert("Audit Export Generated: SOC2_Evidence_SentinelSecurity_2026.pdf")}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            Export Compliance Report
          </button>
        </div>

        {/* Spend & Seat Utilization Meters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-[#061b14] border border-emerald-900/40 space-y-2">
            <span className="text-xs text-slate-400">Annual SaaS Cloud Spend</span>
            <div className="text-2xl font-bold text-white font-mono">$364,200</div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="w-4/5 h-full bg-emerald-400 rounded-full" />
            </div>
            <p className="text-[11px] text-emerald-400">Within allocated enterprise budget</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#061b14] border border-emerald-900/40 space-y-2">
            <span className="text-xs text-slate-400">Reclaimable Inactive Seats</span>
            <div className="text-2xl font-bold text-amber-300 font-mono">182 Seats</div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="w-1/4 h-full bg-amber-400 rounded-full" />
            </div>
            <p className="text-[11px] text-amber-300">$3,420 / month potential recovery</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#061b14] border border-emerald-900/40 space-y-2">
            <span className="text-xs text-slate-400">Third-Party App Token Permissions</span>
            <div className="text-2xl font-bold text-white font-mono">42 Scopes</div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="w-full h-full bg-emerald-400 rounded-full" />
            </div>
            <p className="text-[11px] text-emerald-400">100% verified against IAM baseline</p>
          </div>
        </div>

        {/* SaaS Catalog Table */}
        <div className="bg-[#061b14] border border-emerald-900/40 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SaaS vendor or platform..."
                className="w-full sm:w-64 bg-[#0a261c] border border-emerald-800/40 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div className="text-xs text-slate-400">
              Showing <span className="text-emerald-300 font-bold">{filteredCatalog.length}</span> verified platforms
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-[#092219] text-emerald-400 uppercase tracking-wider text-[10px] border-b border-emerald-950">
                <tr>
                  <th className="py-3 px-6 font-semibold">SaaS Service</th>
                  <th className="py-3 px-6 font-semibold">Vendor</th>
                  <th className="py-3 px-6 font-semibold">Assigned / Total</th>
                  <th className="py-3 px-6 font-semibold">Monthly Spend</th>
                  <th className="py-3 px-6 font-semibold">Governance Review</th>
                  <th className="py-3 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/60">
                {filteredCatalog.map((s, idx) => (
                  <tr key={idx} className="hover:bg-emerald-950/20 transition-colors">
                    <td className="py-4 px-6 font-bold text-white flex items-center gap-2.5">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${s.iconBg}`}>
                        {s.name[0]}
                      </span>
                      <span>{s.name}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">{s.vendor}</td>
                    <td className="py-4 px-6">
                      <div className="font-mono text-slate-200">
                        {s.activeSeats} / {s.totalSeats} seats
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {Math.round((s.activeSeats / s.totalSeats) * 100)}% utilized
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-emerald-300">
                      ${s.totalSeats * s.costPerSeat}/mo
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          s.riskRating === "Clean"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                            : s.riskRating === "Underutilized"
                            ? "bg-amber-950 text-amber-300 border border-amber-500/30"
                            : "bg-red-950 text-red-300 border border-red-500/30"
                        }`}
                      >
                        {s.riskRating}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => alert(`Seat reallocation launched for ${s.name}`)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all cursor-pointer"
                      >
                        Rightsize
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
