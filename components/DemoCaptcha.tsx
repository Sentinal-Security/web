"use client";

import React, { useCallback, useEffect, useState } from "react";

interface DemoCaptchaProps {
  verified: boolean;
  onVerifyChange: (verified: boolean) => void;
}

function generateChallenge(): { a: number; b: number; answer: number } {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b };
}

export function DemoCaptcha({ verified, onVerifyChange }: DemoCaptchaProps) {
  const [expanded, setExpanded] = useState(false);
  const [challenge, setChallenge] = useState<{ a: number; b: number; answer: number }>({
    a: 3,
    b: 4,
    answer: 7,
  });
  const [inputValue, setInputValue] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setChallenge(generateChallenge());
  }, []);

  const refreshChallenge = useCallback(() => {
    setChallenge(generateChallenge());
    setInputValue("");
    setErrorMsg("");
    onVerifyChange(false);
  }, [onVerifyChange]);

  const handleCheckboxClick = () => {
    if (verified) {
      refreshChallenge();
      setExpanded(false);
      return;
    }
    setExpanded(true);
    setErrorMsg("");
  };

  const handleInputChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 3);
    setInputValue(clean);
    setErrorMsg("");
    if (clean && Number(clean) === challenge.answer) {
      onVerifyChange(true);
      setExpanded(false);
    }
  };

  const handleVerifyClick = () => {
    if (inputValue && Number(inputValue) === challenge.answer) {
      onVerifyChange(true);
      setExpanded(false);
      setErrorMsg("");
    } else {
      setErrorMsg("Incorrect answer. Try again.");
      onVerifyChange(false);
    }
  };

  return (
    <div className="rounded-xl border border-line-subtle bg-surface-elevated p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleCheckboxClick}
          className="flex items-center gap-2.5 text-left cursor-pointer"
        >
          <span
            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
              verified
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                : "bg-surface-input border-line-subtle text-transparent"
            }`}
          >
            {verified && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
          <span className="text-xs font-semibold text-ink-primary">
            {verified ? "Human Verification Passed" : "I am not a robot"}
          </span>
        </button>

        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
          Sentinel Captcha
        </span>
      </div>

      {expanded && !verified && (
        <div className="pt-2 border-t border-line-subtle space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-ink-secondary">
              Solve to verify: <strong className="text-accent-text">{challenge.a} + {challenge.b} = ?</strong>
            </span>
            <button
              type="button"
              onClick={refreshChallenge}
              className="text-[11px] font-mono text-ink-muted hover:text-ink-primary underline cursor-pointer"
            >
              New Challenge
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Answer"
              className="w-24 px-2.5 py-1.5 rounded-lg bg-surface-input border border-line-subtle text-xs text-ink-primary outline-none focus:border-line-accent"
            />
            <button
              type="button"
              onClick={handleVerifyClick}
              className="px-3 py-1.5 rounded-lg bg-accent-primary hover:bg-accent-primary-hover text-accent-primary-fg text-xs font-bold cursor-pointer transition-colors"
            >
              Verify
            </button>
          </div>

          {errorMsg && <p className="text-[11px] text-rose-400 font-medium">{errorMsg}</p>}
        </div>
      )}
    </div>
  );
}
