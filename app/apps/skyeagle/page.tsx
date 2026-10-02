"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface IncidentAlert {
  id: string;
  time: string;
  threat: string;
  target: string;
  source: string;
  level: "P1-CRITICAL" | "P2-HIGH" | "P3-MEDIUM";
  mitigation: string;
}

const LIVE_INCIDENTS: IncidentAlert[] = [
  {
    id: "SEC-9041",
    time: "20:44:12 UTC",
    threat: "Distributed Password Spraying (BCrypt flood)",
    target: "IAM /api/auth/login",
    source: "185.220.101.42 [TOR-EXIT]",
    level: "P2-HIGH",
    mitigation: "IP Auto-Banned + Adaptive 2FA Enforced",
  },
  {
    id: "SEC-9042",
    time: "20:42:08 UTC",
    threat: "Impossible Travel / Geo-Velocity Anomaly",
    target: "nadia@sentinel.internal",
    source: "Tokyo -> Frankfurt (12 min delta)",
    level: "P1-CRITICAL",
    mitigation: "Session Quarantined, Mobile Verification Push Sent",
  },
  {
    id: "SEC-9043",
    time: "20:39:55 UTC",
    threat: "Unauthorized WireGuard Peer Handshake Attempt",
    target: "node-frankfurt-01",
    source: "94.102.61.12",
    level: "P2-HIGH",
    mitigation: "Cryptographic Key Mismatch: Packet Dropped",
  },
  {
    id: "SEC-9044",
    time: "20:31:19 UTC",
    threat: "Token Replay on SSO App Gateway",
    target: "Anzora Mesh Proxy",
    source: "Internal Subnet 10.240.12.88",
    level: "P3-MEDIUM",
    mitigation: "Nonce Verified: Stale Token Rejected",
  },
];

export default function SkyEaglePage() {
  const [tickerPaused, setTickerPaused] = useState(false);
  const [utcTime, setUtcTime] = useState("20:45:00 UTC");
  const [filterLevel, setFilterLevel] = useState("ALL");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setUtcTime(now.toTimeString().split(" ")[0] + " UTC");
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredIncidents = LIVE_INCIDENTS.filter((i) =>
    filterLevel === "ALL" ? true : i.level === filterLevel
  );

  return (
    <div className="min-h-screen bg-[#020b12] text-cyan-50 font-mono antialiased flex flex-col selection:bg-cyan-400 selection:text-black">
      {/* =========================================================
          DISTINCT NAVBAR: Tactical SOC HUD Header (CrowdStrike / Defense Command)
      ========================================================= */}
      <header className="bg-[#041524] border-b-2 border-cyan-500/40 px-6 sm:px-8 py-3 flex items-center justify-between shadow-[0_0_25px_rgba(6,182,212,0.15)] sticky top-0 z-40">
        {/* Brand & Threat Level Beacon */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Image
                src="/images/logo-skyeagle.svg"
                alt="SkyEagle"
                width={30}
                height={30}
                className="w-7 h-7 object-contain drop-shadow-[0_0_8px_#38bdf8]"
              />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div>
              <span className="font-black text-sm tracking-wider text-white">SKYEAGLE // RADAR</span>
              <span className="block text-[9px] text-cyan-400/80 font-mono tracking-widest">TACTICAL SOC CONSOLE</span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-cyan-800/60 hidden sm:block" />

          {/* Defense Posture HUD Badge */}
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1 rounded-md bg-[#021d33] border border-cyan-500/50 text-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-cyan-300 font-bold">DEFCON 4: ELEVATED MONITORING</span>
          </div>
        </div>

        {/* Right Section: UTC Ticker, Emergency Lockdown, Back to Portal */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:block text-xs font-mono text-cyan-400/90 px-2 py-1 rounded bg-[#011424] border border-cyan-900/60">
            {utcTime}
          </div>

          <button
            onClick={() => alert("EMERGENCY FLEET QUARANTINE ARMED: All active user sessions flagged for instant step-up challenge.")}
            className="px-3 py-1.5 rounded-md bg-red-950 hover:bg-red-900 text-red-300 border border-red-500/50 text-xs font-bold transition-all shadow-[0_0_12px_rgba(239,68,68,0.2)] cursor-pointer"
          >
            LOCKDOWN FLEET
          </button>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#062842] hover:bg-[#093557] text-cyan-200 border border-cyan-500/30 text-xs font-semibold transition-all"
          >
            <span>&larr; Sentinel IAM</span>
          </Link>
        </div>
      </header>

      {/* Live Alert Ticker Tape */}
      <div className="bg-[#031b2e] border-b border-cyan-900/50 px-6 py-1.5 flex items-center justify-between text-xs text-cyan-300 overflow-hidden">
        <div className="flex items-center gap-3">
          <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-[10px] font-bold text-cyan-200">
            RADAR FEED
          </span>
          <span className="text-xs text-cyan-100 truncate">
            {tickerPaused
              ? "[FEED PAUSED BY ANALYST]"
              : "● LIVE: 142 brute-force attempts thwarted in last 60m • 0 endpoints compromised • Heuristic anomaly threshold: 99.8%"}
          </span>
        </div>
        <button
          onClick={() => setTickerPaused(!tickerPaused)}
          className="text-[10px] text-cyan-400 hover:text-white underline cursor-pointer ml-4 shrink-0"
        >
          {tickerPaused ? "Resume Feed" : "Pause Stream"}
        </button>
      </div>

      {/* =========================================================
          SOC MONITORING COCKPIT BODY
      ========================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-6">
        {/* Tactical Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#041a2c] border border-cyan-800/40 shadow-lg relative overflow-hidden">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Perimeter Interceptions</span>
            <div className="text-3xl font-black text-white mt-1">1,894</div>
            <p className="text-[10px] text-cyan-400/80 mt-1">100% automated dropped packets</p>
            <div className="absolute right-3 bottom-3 text-cyan-500/10 text-5xl font-black select-none pointer-events-none">
              IP
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#041a2c] border border-cyan-800/40 shadow-lg relative overflow-hidden">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Anomaly Score Gauge</span>
            <div className="text-3xl font-black text-cyan-300 mt-1">0.02%</div>
            <p className="text-[10px] text-emerald-400 mt-1">Nominal baseline (Fleet safe)</p>
            <div className="absolute right-3 bottom-3 text-cyan-500/10 text-5xl font-black select-none pointer-events-none">
              %
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#041a2c] border border-cyan-800/40 shadow-lg relative overflow-hidden">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Mean Response Velocity</span>
            <div className="text-3xl font-black text-white mt-1">380 ms</div>
            <p className="text-[10px] text-cyan-400/80 mt-1">Sub-second policy triggers</p>
            <div className="absolute right-3 bottom-3 text-cyan-500/10 text-5xl font-black select-none pointer-events-none">
              MS
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#041a2c] border border-cyan-800/40 shadow-lg relative overflow-hidden">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Monitored Endpoints</span>
            <div className="text-3xl font-black text-white mt-1">384 / 384</div>
            <p className="text-[10px] text-emerald-400 mt-1">100% active heartbeat sync</p>
            <div className="absolute right-3 bottom-3 text-cyan-500/10 text-5xl font-black select-none pointer-events-none">
              EP
            </div>
          </div>
        </div>

        {/* Live Stream Table */}
        <div className="bg-[#031726] border border-cyan-700/40 rounded-xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-cyan-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="text-sm font-bold text-white tracking-wider">REAL-TIME THREAT LOG STREAM</h2>
            </div>

            {/* Severity Filter Tabs */}
            <div className="flex rounded-md bg-[#020e1a] p-1 border border-cyan-900/60 text-xs">
              {["ALL", "P1-CRITICAL", "P2-HIGH", "P3-MEDIUM"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    filterLevel === lvl
                      ? "bg-cyan-500 text-slate-950 font-black"
                      : "text-cyan-400 hover:text-white"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-cyan-100">
              <thead className="bg-[#021321] text-cyan-400 uppercase tracking-widest text-[9px] border-b border-cyan-900/60 font-bold">
                <tr>
                  <th className="py-2.5 px-4">Incident ID</th>
                  <th className="py-2.5 px-4">Time (UTC)</th>
                  <th className="py-2.5 px-4">Threat Classification</th>
                  <th className="py-2.5 px-4">Source IP & Origin</th>
                  <th className="py-2.5 px-4">Targeted Resource</th>
                  <th className="py-2.5 px-4">Severity</th>
                  <th className="py-2.5 px-4 text-right">Autonomous Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-950">
                {filteredIncidents.map((i) => (
                  <tr key={i.id} className="hover:bg-cyan-950/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-cyan-300">{i.id}</td>
                    <td className="py-3.5 px-4 text-slate-400">{i.time}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{i.threat}</td>
                    <td className="py-3.5 px-4 text-cyan-300/90">{i.source}</td>
                    <td className="py-3.5 px-4 text-slate-300">{i.target}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black ${
                          i.level === "P1-CRITICAL"
                            ? "bg-red-950 text-red-300 border border-red-500/50 animate-pulse"
                            : i.level === "P2-HIGH"
                            ? "bg-orange-950 text-orange-300 border border-orange-500/40"
                            : "bg-cyan-950 text-cyan-300 border border-cyan-500/30"
                        }`}
                      >
                        {i.level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded bg-[#04243d] border border-cyan-500/30 text-cyan-300 text-[10px]">
                        {i.mitigation}
                      </span>
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
