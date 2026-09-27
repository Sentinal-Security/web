"use client";

import { useState } from "react";

interface AppIntegration {
  id: string;
  name: string;
  category: string;
  logo: string;
  status: string;
  statusColor: string;
}

const DASHBOARD_APPS: AppIntegration[] = [
  {
    id: "anzora",
    name: "Anzora",
    category: "Zero-Trust Access Mesh",
    logo: "/images/logo-anzora.svg",
    status: "Active",
    statusColor: "bg-purple-400",
  },
  {
    id: "calyx",
    name: "Calyx Cloud",
    category: "SaaS Governance Suite",
    logo: "/images/logo-calyx.svg",
    status: "Protected",
    statusColor: "bg-emerald-400",
  },
  {
    id: "omniauth",
    name: "OmniAuth API",
    category: "Cloud Auth API Service",
    logo: "/images/logo-omniauth.svg",
    status: "Operational",
    statusColor: "bg-amber-400",
  },
  {
    id: "skyeagle",
    name: "SkyEagle",
    category: "Continuous Threat Radar",
    logo: "/images/logo-skyeagle.svg",
    status: "Live Sync",
    statusColor: "bg-cyan-400",
  },
];

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredApps = DASHBOARD_APPS.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="min-h-screen w-full relative flex text-white font-sans antialiased selection:bg-cyan-400 selection:text-black"
      style={{
        background:
          "radial-gradient(ellipse at 60% 36%, #15398a 0%, #0d2561 38%, #071539 72%, #040c21 100%)",
      }}
    >
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar - Full height, fills top, left, and bottom completely */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 w-64 sm:w-72 md:w-[290px] lg:w-[306px] bg-black self-stretch min-h-screen shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.5)] border-r border-white/5 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="sticky top-0 flex flex-col pt-9 pb-6 px-5 sm:px-6 w-full">
          {/* Brand Shield & Title */}
          <div className="flex flex-col items-center select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/sentinel-shield.png"
              alt="Sentinel Shield"
              className="w-16 h-16 object-contain drop-shadow-[0_0_16px_rgba(46,224,236,0.6)]"
            />
            <span className="mt-3 text-2xl font-bold tracking-tight text-[#2ee0ec] drop-shadow-[0_0_12px_rgba(46,224,236,0.45)]">
              Sentinel
            </span>
          </div>

          {/* Active Navigation Item */}
          <div className="mt-10 w-full">
            <button
              type="button"
              className="w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#175beb] via-[#1249c5] to-[#0c338e] text-white font-semibold text-base shadow-[0_4px_24px_rgba(23,91,235,0.55)] transition-all cursor-pointer text-left"
            >
              <svg
                className="w-5 h-5 text-white shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="3" width="20" height="15" rx="2" />
                <path d="M6 14l3.5-4.5 3 3 4-5" />
              </svg>
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 px-5 sm:px-7 lg:px-9 pt-6 pb-8">
        {/* Top Header / Navigation Bar */}
        <header className="flex items-center justify-between gap-3 sm:gap-4 w-full">
          {/* Left: Mobile Menu Toggle + Search Bar */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 max-w-[280px] sm:max-w-xs md:max-w-sm">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-black border border-white/10 text-slate-300 hover:text-white cursor-pointer"
              aria-label="Open sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Pill Search Bar */}
            <div className="relative flex items-center bg-black rounded-full px-4 py-2.5 w-full border border-white/5 focus-within:border-cyan-500/40 transition-colors">
              <svg
                className="w-4 h-4 text-slate-400 shrink-0 mr-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="bg-transparent text-xs sm:text-sm text-slate-200 placeholder-slate-400 outline-none w-full"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-white transition-colors ml-1 cursor-pointer"
                  aria-label="Clear search"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <span className="text-slate-500 text-xs ml-1 select-none pointer-events-none">✕</span>
              )}
            </div>
          </div>

          {/* Right: Notification Bell, Settings Gear, Profile Pill */}
          <div className="flex items-center gap-3 sm:gap-5 md:gap-6">
            {/* Bell Icon with Blue Dot */}
            <button
              type="button"
              className="relative p-1.5 sm:p-2 text-slate-200 hover:text-white transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              {/* Vibrant Blue Dot */}
              <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 w-2 h-2 rounded-full bg-[#0066ff] shadow-[0_0_8px_#0066ff]" />
            </button>

            {/* Gear Icon */}
            <button
              type="button"
              className="p-1.5 sm:p-2 text-slate-200 hover:text-white transition-colors cursor-pointer"
              aria-label="Settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Nadia Profile Pill */}
            <div className="flex items-center gap-2 sm:gap-2.5 bg-black py-1 sm:py-1.5 pl-1.5 pr-2.5 sm:pr-3.5 rounded-full border border-white/5 cursor-pointer hover:border-white/15 transition-all select-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/nadia-clean.png"
                alt="Nadia"
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover shrink-0"
              />
              <span className="text-xs sm:text-sm font-medium text-white">Nadia</span>
              <svg
                className="w-3.5 h-3.5 text-slate-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </header>

        {/* Welcome Greeting */}
        <div className="mt-7 sm:mt-9 mb-6 sm:mb-8">
          <h2 className="text-3xl sm:text-4xl font-normal text-white tracking-tight">
            Welcome, <span className="text-[#38bdf8]">Nadia</span>
          </h2>
        </div>

        {/* 2x2 Grid of Dashboard App Cards - Adjusted corner radius to rounded-2xl so it's not too roundy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 flex-1 w-full">
          {(filteredApps.length > 0 ? filteredApps : DASHBOARD_APPS).map((app) => (
            <div
              key={app.id}
              className="group bg-black rounded-2xl border border-cyan-500/40 p-6 sm:p-7 lg:p-8 min-h-[220px] sm:min-h-[250px] lg:min-h-[260px] shadow-[0_0_20px_rgba(6,182,212,0.06)] hover:border-cyan-400/70 hover:shadow-[0_0_26px_rgba(6,182,212,0.12)] transition-all flex flex-col justify-between cursor-pointer select-none"
            >
              {/* Card Top Row: Custom App Logo & Launch Arrow */}
              <div className="flex items-start justify-between">
                <div className="p-2 sm:p-2.5 rounded-xl bg-[#070b14] border border-white/5 group-hover:border-cyan-500/30 transition-all">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={app.logo}
                    alt={`${app.name} Logo`}
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                  />
                </div>

                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-cyan-300 group-hover:border-cyan-500/40 group-hover:bg-cyan-950/20 transition-all">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 17L17 7M17 7H9M17 7V15"
                    />
                  </svg>
                </div>
              </div>

              {/* Card Bottom Area: App Name, Category, and Connection Pill */}
              <div className="mt-6 sm:mt-8">
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-[#38bdf8] transition-colors">
                  {app.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 font-normal mt-1">
                  {app.category}
                </p>

                <div className="mt-3.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#08152e] border border-cyan-500/25 text-cyan-300">
                  <span className={`w-1.5 h-1.5 rounded-full ${app.statusColor}`} />
                  <span>{app.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
