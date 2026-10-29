"use client";

import React from "react";

interface InactivityWarningModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
}

export function InactivityWarningModal({
  isOpen,
  secondsRemaining,
  onExtend,
  onLogout,
}: InactivityWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl shadow-amber-500/10 flex flex-col">
        {/* Header with Security Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
              Security Policy Enforcement
            </span>
            <h3 className="text-base font-semibold text-white">
              Session Inactivity Warning
            </h3>
          </div>
        </div>

        {/* Message and Countdown Display */}
        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          Due to enterprise zero-trust security compliance, inactive IAM sessions are automatically terminated to prevent unauthorized workstation access.
        </p>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-white/10 mb-5 flex items-center justify-between">
          <span className="text-xs text-slate-400">Automatic logout in:</span>
          <span className="text-lg font-mono font-bold text-amber-400 tracking-wider">
            {String(secondsRemaining).padStart(2, "0")}s
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer border border-white/10"
          >
            Sign Out Now
          </button>
          <button
            type="button"
            onClick={onExtend}
            className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            Stay Signed In
          </button>
        </div>
      </div>
    </div>
  );
}
