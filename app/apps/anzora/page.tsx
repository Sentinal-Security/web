"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface MeshNode {
  id: string;
  hostname: string;
  ip: string;
  os: "Linux" | "macOS" | "Windows" | "Kubernetes";
  version: string;
  lastSeen: string;
  tx: string;
  rx: string;
  directRoute: boolean;
  status: "Online" | "Idle" | "Syncing";
}

const MESH_NODES: MeshNode[] = [
  {
    id: "n-1",
    hostname: "prod-db-primary-us-east",
    ip: "100.64.0.12",
    os: "Linux",
    version: "v1.44.2",
    lastSeen: "Connected",
    tx: "4.8 GB",
    rx: "12.1 GB",
    directRoute: true,
    status: "Online",
  },
  {
    id: "n-2",
    hostname: "ingress-gateway-frankfurt",
    ip: "100.64.1.45",
    os: "Kubernetes",
    version: "v1.44.0",
    lastSeen: "Connected",
    tx: "24.9 GB",
    rx: "41.6 GB",
    directRoute: true,
    status: "Online",
  },
  {
    id: "n-3",
    hostname: "macbook-pro-nadia",
    ip: "100.64.4.88",
    os: "macOS",
    version: "v1.44.2",
    lastSeen: "Connected",
    tx: "840 MB",
    rx: "2.1 GB",
    directRoute: true,
    status: "Online",
  },
  {
    id: "n-4",
    hostname: "dev-k8s-cluster-oregon",
    ip: "100.64.9.102",
    os: "Kubernetes",
    version: "v1.42.8",
    lastSeen: "3m ago",
    tx: "1.2 GB",
    rx: "3.4 GB",
    directRoute: false,
    status: "Idle",
  },
  {
    id: "n-5",
    hostname: "win-bastion-internal",
    ip: "100.64.12.3",
    os: "Windows",
    version: "v1.44.1",
    lastSeen: "Syncing keys",
    tx: "140 MB",
    rx: "520 MB",
    directRoute: true,
    status: "Syncing",
  },
];

export default function AnzoraPage() {
  const [activeNav, setActiveNav] = useState("machines");
  const [selectedTag, setSelectedTag] = useState("all");
  const [search, setSearch] = useState("");
  const [tailnetLocked, setTailnetLocked] = useState(true);

  const filteredNodes = MESH_NODES.filter((n) => {
    const matchSearch =
      n.hostname.toLowerCase().includes(search.toLowerCase()) ||
      n.ip.includes(search);
    if (selectedTag === "all") return matchSearch;
    return matchSearch && n.status.toLowerCase() === selectedTag.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-[#070711] text-slate-200 font-sans antialiased flex flex-row">
      {/* =========================================================
          DISTINCT NAVBAR: Dark Collapsible Left Sidebar (Console style)
      ========================================================= */}
      <aside className="w-64 bg-[#0d0d1a] border-r border-indigo-950/60 flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-indigo-950/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30">
                <Image
                  src="/images/logo-anzora.svg"
                  alt="Anzora"
                  width={26}
                  height={26}
                  className="w-6 h-6 object-contain"
                />
              </div>
              <div>
                <h1 className="font-bold text-sm text-white tracking-wide">Anzora Mesh</h1>
                <p className="text-[10px] text-purple-400 font-mono">tailnet: sentinel-corp.net</p>
              </div>
            </div>
          </div>

          {/* Connected SSO Banner */}
          <div className="mx-3.5 my-3 p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/30 flex items-center gap-2 text-[11px] text-purple-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sentinel SSO: <strong>Active</strong></span>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-1 text-xs font-medium">
            <button
              onClick={() => setActiveNav("machines")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeNav === "machines"
                  ? "bg-purple-600/20 text-purple-200 border border-purple-500/40 font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Machine Nodes</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-950 text-purple-300 font-mono">
                {MESH_NODES.length}
              </span>
            </button>

            <button
              onClick={() => setActiveNav("acls")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeNav === "acls"
                  ? "bg-purple-600/20 text-purple-200 border border-purple-500/40 font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Access Control Lists (ACL)</span>
            </button>

            <button
              onClick={() => setActiveNav("dns")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeNav === "dns"
                  ? "bg-purple-600/20 text-purple-200 border border-purple-500/40 font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span>MagicDNS & Split-Routes</span>
            </button>

            <button
              onClick={() => setActiveNav("settings")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeNav === "settings"
                  ? "bg-purple-600/20 text-purple-200 border border-purple-500/40 font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Mesh Keys & WireGuard</span>
            </button>
          </nav>
        </div>

        {/* Bottom Back Button & User Profile */}
        <div className="p-4 border-t border-indigo-950/50 space-y-3">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/50 border border-purple-700/40 text-xs font-semibold text-purple-200 transition-all shadow-md"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Exit to Sentinel IAM</span>
          </Link>

          <div className="flex items-center gap-2.5 px-2">
            <Image
              src="/images/nadia-clean.png"
              alt="Avatar"
              width={26}
              height={26}
              className="w-6 h-6 rounded-full object-cover border border-purple-400/40"
            />
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">Nadia (Admin)</p>
              <p className="text-[10px] text-slate-400 font-mono">100.64.4.88</p>
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================
          MAIN CONTENT AREA
      ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-indigo-950/50 px-6 sm:px-8 flex items-center justify-between bg-[#0a0a14]/60 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Tailnet:</span>
            <span className="text-xs font-mono font-semibold text-purple-300">sentinel-corp</span>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-medium text-white capitalize">{activeNav}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Tailnet Lock Toggle */}
            <button
              type="button"
              onClick={() => setTailnetLocked(!tailnetLocked)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                tailnetLocked
                  ? "bg-indigo-950/80 text-indigo-300 border-indigo-500/40"
                  : "bg-amber-950/80 text-amber-300 border-amber-500/40"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>{tailnetLocked ? "Tailnet Locked" : "Unrestricted"}</span>
            </button>

            <button
              type="button"
              onClick={() => alert("Peer node added: Share authentication key: tskey-auth-9201a4e")}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-md transition-all cursor-pointer"
            >
              + Add Machine
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto">
          {/* Topology Quick Bar */}
          <div className="p-4 rounded-2xl bg-[#0f0e21] border border-purple-900/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Encrypted Mesh</span>
                <span className="text-white font-mono font-bold text-sm">100% WireGuard</span>
              </div>
              <div className="h-7 w-[1px] bg-slate-800" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">DERP Relay Traffic</span>
                <span className="text-emerald-400 font-mono font-bold text-sm">0.8% (Direct p2p)</span>
              </div>
              <div className="h-7 w-[1px] bg-slate-800" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Mean Mesh RTT</span>
                <span className="text-purple-300 font-mono font-bold text-sm">1.6 ms</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by hostname or 100.64.x.x..."
                className="bg-[#181630] border border-purple-800/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 w-56"
              />
              <div className="flex rounded-xl bg-[#181630] p-1 border border-purple-800/30 text-xs">
                {["all", "online", "idle"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(t)}
                    className={`px-2.5 py-1 rounded-lg capitalize text-[11px] transition-all cursor-pointer ${
                      selectedTag === t
                        ? "bg-purple-600 text-white font-semibold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Machine Nodes Cards Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Showing {filteredNodes.length} connected endpoints in tailnet</span>
              <span className="font-mono text-[11px]">Key expiry: Automatic (90 days)</span>
            </div>

            <div className="divide-y divide-purple-950/40 bg-[#0e0d1f] border border-purple-900/30 rounded-2xl overflow-hidden shadow-lg">
              {filteredNodes.map((node) => (
                <div
                  key={node.id}
                  className="p-4 sm:px-6 hover:bg-purple-950/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full mt-1 sm:mt-0 shrink-0 ${
                        node.status === "Online"
                          ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                          : node.status === "Idle"
                          ? "bg-slate-500"
                          : "bg-amber-400 animate-spin"
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm text-white">{node.hostname}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800/30">
                          {node.os}
                        </span>
                        {node.directRoute && (
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            direct
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="font-mono text-purple-300">{node.ip}</span>
                        <span>•</span>
                        <span>{node.version}</span>
                        <span>•</span>
                        <span>Tx: {node.tx} / Rx: {node.rx}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => alert(`Ping initiated to ${node.ip}: response in 1.4ms (p2p direct)`)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono transition-all cursor-pointer"
                    >
                      ping
                    </button>
                    <button
                      onClick={() => alert(`Copy SSH command: ssh ${node.hostname}`)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-mono transition-all cursor-pointer"
                    >
                      SSH
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
