"use client";

import React, { useCallback, useState } from "react";

interface DemoCaptchaProps {
  verified: boolean;
  onVerifyChange: (verified: boolean) => void;
}

type TileKind =
  | "traffic_light"
  | "bicycle"
  | "bus"
  | "car"
  | "crosswalk"
  | "tree"
  | "building";

interface ImageChallenge {
  id: string;
  target: TileKind;
  label: string;
  tiles: TileKind[];
}

const CHALLENGE_POOL: ImageChallenge[] = [
  {
    id: "preset-traffic-lights",
    target: "traffic_light",
    label: "traffic lights",
    tiles: [
      "traffic_light",
      "car",
      "building",
      "bus",
      "traffic_light",
      "tree",
      "traffic_light",
      "bicycle",
      "crosswalk",
    ],
  },
  {
    id: "preset-bicycles",
    target: "bicycle",
    label: "bicycles",
    tiles: [
      "car",
      "bicycle",
      "tree",
      "bicycle",
      "bus",
      "traffic_light",
      "crosswalk",
      "bicycle",
      "building",
    ],
  },
  {
    id: "preset-buses",
    target: "bus",
    label: "buses",
    tiles: [
      "bus",
      "tree",
      "car",
      "traffic_light",
      "bus",
      "bicycle",
      "building",
      "bus",
      "bus",
    ],
  },
  {
    id: "preset-cars",
    target: "car",
    label: "cars",
    tiles: [
      "tree",
      "car",
      "bus",
      "crosswalk",
      "traffic_light",
      "car",
      "car",
      "building",
      "bicycle",
    ],
  },
  {
    id: "preset-crosswalks",
    target: "crosswalk",
    label: "crosswalks",
    tiles: [
      "crosswalk",
      "bicycle",
      "car",
      "building",
      "crosswalk",
      "bus",
      "tree",
      "traffic_light",
      "crosswalk",
    ],
  },
];

function TileIllustration({ kind }: { kind: TileKind }) {
  switch (kind) {
    case "traffic_light":
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none">
          <rect x="23" y="8" width="18" height="38" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
          <circle cx="32" cy="17" r="4" fill="#ef4444" />
          <circle cx="32" cy="27" r="4" fill="#f59e0b" />
          <circle cx="32" cy="37" r="4" fill="#22c55e" />
          <rect x="30" y="46" width="4" height="12" fill="#64748b" />
        </svg>
      );
    case "bicycle":
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none">
          <circle cx="17" cy="42" r="9" stroke="#38bdf8" strokeWidth="2.5" />
          <circle cx="47" cy="42" r="9" stroke="#38bdf8" strokeWidth="2.5" />
          <path d="M17 42 L28 26 L41 26 L47 42 M28 26 L33 42 L17 42 M41 26 L43 20 L48 20 M25 22 L30 22" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "bus":
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none">
          <rect x="14" y="12" width="36" height="36" rx="5" fill="#0284c7" stroke="#7dd3fc" strokeWidth="2" />
          <rect x="19" y="18" width="26" height="13" rx="2" fill="#e0f2fe" />
          <rect x="24" y="14" width="16" height="2.5" rx="1" fill="#0f172a" />
          <circle cx="21" cy="40" r="2.5" fill="#fef08a" />
          <circle cx="43" cy="40" r="2.5" fill="#fef08a" />
          <rect x="18" y="48" width="6" height="5" rx="1.5" fill="#334155" />
          <rect x="40" y="48" width="6" height="5" rx="1.5" fill="#334155" />
        </svg>
      );
    case "car":
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none">
          <path d="M14 34 L19 22 L45 22 L50 34 Z" fill="#334155" stroke="#94a3b8" strokeWidth="2" strokeLinejoin="round" />
          <rect x="10" y="33" width="44" height="12" rx="4" fill="#6366f1" stroke="#a5b4fc" strokeWidth="2" />
          <circle cx="17" cy="39" r="2.2" fill="#fef08a" />
          <circle cx="47" cy="39" r="2.2" fill="#fef08a" />
          <circle cx="19" cy="47" r="4.5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
          <circle cx="45" cy="47" r="4.5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
        </svg>
      );
    case "crosswalk":
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none">
          <rect x="8" y="16" width="48" height="32" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
          <rect x="13" y="21" width="6" height="22" rx="1" fill="#f8fafc" />
          <rect x="23" y="21" width="6" height="22" rx="1" fill="#f8fafc" />
          <rect x="35" y="21" width="6" height="22" rx="1" fill="#f8fafc" />
          <rect x="45" y="21" width="6" height="22" rx="1" fill="#f8fafc" />
        </svg>
      );
    case "tree":
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none">
          <rect x="29" y="40" width="6" height="14" rx="1" fill="#92400e" />
          <circle cx="32" cy="28" r="13" fill="#15803d" stroke="#4ade80" strokeWidth="2" />
          <circle cx="24" cy="33" r="8" fill="#166534" />
          <circle cx="40" cy="33" r="8" fill="#166534" />
        </svg>
      );
    case "building":
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none">
          <rect x="16" y="12" width="32" height="42" rx="2" fill="#334155" stroke="#64748b" strokeWidth="2" />
          <rect x="22" y="18" width="5" height="6" fill="#94a3b8" />
          <rect x="37" y="18" width="5" height="6" fill="#94a3b8" />
          <rect x="22" y="28" width="5" height="6" fill="#94a3b8" />
          <rect x="37" y="28" width="5" height="6" fill="#94a3b8" />
          <rect x="28" y="42" width="8" height="12" fill="#0f172a" />
        </svg>
      );
  }
}

export function DemoCaptcha({ verified, onVerifyChange }: DemoCaptchaProps) {
  const [expanded, setExpanded] = useState(false);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const challenge = CHALLENGE_POOL[challengeIndex];

  const cycleNextChallenge = useCallback(() => {
    setChallengeIndex((prev) => (prev + 1) % CHALLENGE_POOL.length);
    setSelectedIndices([]);
    setErrorMsg("");
    onVerifyChange(false);
  }, [onVerifyChange]);

  const handleCheckboxClick = () => {
    if (verified) {
      cycleNextChallenge();
      setExpanded(false);
      return;
    }
    setExpanded((prev) => !prev);
    setErrorMsg("");
  };

  const toggleTile = (idx: number) => {
    setErrorMsg("");
    setSelectedIndices((prev) =>
      prev.includes(idx) ? prev.filter((item) => item !== idx) : [...prev, idx]
    );
  };

  const handleVerifyClick = () => {
    const expected = challenge.tiles
      .map((tile, idx) => (tile === challenge.target ? idx : -1))
      .filter((idx) => idx !== -1);

    const sortedSelected = [...selectedIndices].sort((a, b) => a - b);
    const isMatch =
      expected.length === sortedSelected.length &&
      expected.every((val, i) => val === sortedSelected[i]);

    if (isMatch) {
      onVerifyChange(true);
      setExpanded(false);
      setErrorMsg("");
    } else {
      onVerifyChange(false);
      setChallengeIndex((prev) => (prev + 1) % CHALLENGE_POOL.length);
      setSelectedIndices([]);
      setErrorMsg("Selection did not match. Try the next challenge.");
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
        <div className="pt-2 border-t border-line-subtle space-y-2.5">
          <div className="flex items-center justify-between gap-2 bg-surface-input/70 rounded-lg px-3 py-2 border border-line-subtle">
            <div className="text-xs text-ink-secondary">
              Select all squares with{" "}
              <strong className="text-accent-text uppercase tracking-wide">
                {challenge.label}
              </strong>
            </div>
            <span className="text-[10px] font-mono text-ink-muted">
              {challengeIndex + 1}/{CHALLENGE_POOL.length}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {challenge.tiles.map((tile, idx) => {
              const isSelected = selectedIndices.includes(idx);
              return (
                <button
                  key={`${challenge.id}-${idx}`}
                  type="button"
                  onClick={() => toggleTile(idx)}
                  aria-pressed={isSelected}
                  className={`relative h-16 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? "border-cyan-400 bg-cyan-500/15 ring-1 ring-cyan-400"
                      : "border-line-subtle bg-surface-input hover:border-ink-muted"
                  }`}
                >
                  <TileIllustration kind={tile} />
                  {isSelected && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={cycleNextChallenge}
              className="text-[11px] font-mono text-ink-muted hover:text-ink-primary underline cursor-pointer"
            >
              New Challenge
            </button>
            <button
              type="button"
              onClick={handleVerifyClick}
              className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Verify
            </button>
          </div>

          {errorMsg && (
            <p className="text-[11px] text-rose-400 font-medium">{errorMsg}</p>
          )}
        </div>
      )}
    </div>
  );
}
