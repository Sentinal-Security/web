"use client";

import React from "react";

interface PasswordToggleAdornmentProps {
  show: boolean;
  onToggle: () => void;
  className?: string;
}

export function PasswordToggleAdornment({
  show,
  onToggle,
  className = "",
}: PasswordToggleAdornmentProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`text-slate-400 hover:text-slate-200 transition-colors shrink-0 p-1 rounded focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer ${className}`}
      aria-label={show ? "Hide password" : "Show password"}
      title={show ? "Hide password" : "Show password"}
      tabIndex={-1}
    >
      {show ? (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      )}
    </button>
  );
}
