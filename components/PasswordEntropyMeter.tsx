"use client";

import React, { useMemo } from "react";
import { evaluatePasswordStrength } from "@/lib/passwordEntropy";

interface PasswordEntropyMeterProps {
  password: string;
  showSuggestions?: boolean;
}

export function PasswordEntropyMeter({
  password,
  showSuggestions = true,
}: PasswordEntropyMeterProps) {
  const result = useMemo(() => evaluatePasswordStrength(password), [password]);

  if (!password) {
    return null;
  }

  return (
    <div className="mt-2.5 p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[11px] font-medium">Entropy Rating:</span>
          <span className={`font-semibold font-mono text-[11px] ${result.colorClass}`}>
            {result.label} (Level {result.score}/4)
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          Est. Crack: <span className="text-slate-200">{result.crackTimeDisplay}</span>
        </div>
      </div>

      {/* 4-Segment Progress Bar */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((step) => {
          const isActive = result.score >= step;
          return (
            <div
              key={step}
              className={`h-full rounded-full transition-all duration-300 ${
                isActive ? result.barColor : "bg-white/10"
              }`}
            />
          );
        })}
      </div>

      {/* Warning & Guidance Feedback */}
      {showSuggestions && (result.warning || (result.suggestions && result.suggestions.length > 0)) && (
        <div className="space-y-1 pt-1 border-t border-white/5 text-[11px]">
          {result.warning && (
            <div className="flex items-start gap-1.5 text-amber-300">
              <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{result.warning}</span>
            </div>
          )}
          {result.suggestions.map((sug, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-slate-300 text-[10px]">
              <span className="text-cyan-400 shrink-0 font-bold">•</span>
              <span>{sug}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
