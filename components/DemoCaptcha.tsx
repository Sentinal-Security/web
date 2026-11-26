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

const TILE_IMAGE_PATHS: Record<TileKind, string> = {
  traffic_light: "/captcha/traffic_light.jpg",
  bicycle: "/captcha/bicycle.jpg",
  bus: "/captcha/bus.jpg",
  car: "/captcha/car.jpg",
  crosswalk: "/captcha/crosswalk.jpg",
  tree: "/captcha/tree.jpg",
  building: "/captcha/building.jpg",
};

const TILE_LABELS: Record<TileKind, string> = {
  traffic_light: "Traffic light",
  bicycle: "Bicycle",
  bus: "Bus",
  car: "Car",
  crosswalk: "Crosswalk",
  tree: "Tree",
  building: "Building",
};

export function DemoCaptcha({ verified, onVerifyChange }: DemoCaptchaProps) {
  const [expanded, setExpanded] = useState(false);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const challenge = CHALLENGE_POOL[challengeIndex];

  const isExactMatch = useCallback(
    (indices: number[]) => {
      const expected = challenge.tiles
        .map((tile, idx) => (tile === challenge.target ? idx : -1))
        .filter((idx) => idx !== -1);
      const sortedSelected = [...indices].sort((a, b) => a - b);
      return (
        expected.length === sortedSelected.length &&
        expected.every((val, i) => val === sortedSelected[i])
      );
    },
    [challenge]
  );

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
    setSelectedIndices((prev) => {
      const next = prev.includes(idx)
        ? prev.filter((item) => item !== idx)
        : [...prev, idx];
      if (isExactMatch(next)) {
        onVerifyChange(true);
        setExpanded(false);
      }
      return next;
    });
  };

  const handleVerifyClick = () => {
    if (isExactMatch(selectedIndices)) {
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
                  className={`relative h-20 rounded-lg border overflow-hidden transition-all cursor-pointer ${
                    isSelected
                      ? "border-cyan-400 ring-2 ring-cyan-400"
                      : "border-line-subtle hover:border-ink-muted"
                  }`}
                >
                  <img
                    src={TILE_IMAGE_PATHS[tile]}
                    alt={TILE_LABELS[tile]}
                    className={`w-full h-full object-cover transition-transform ${
                      isSelected ? "scale-95 opacity-85" : "scale-100"
                    }`}
                  />
                  {isSelected && (
                    <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
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
