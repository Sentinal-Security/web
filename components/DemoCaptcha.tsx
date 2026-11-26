"use client";

import React, { useCallback, useEffect, useState } from "react";

interface DemoCaptchaProps {
  verified: boolean;
  onVerifyChange: (verified: boolean) => void;
}

type TileCategory =
  | "traffic_light"
  | "bicycle"
  | "bus"
  | "car"
  | "crosswalk"
  | "hydrant"
  | "bridge"
  | "motorcycle"
  | "tree"
  | "building";

interface CaptchaTile {
  photo: string;
  category: TileCategory;
}

interface ImageChallenge {
  target: TileCategory;
  label: string;
  tiles: CaptchaTile[];
}

const CATEGORY_CATALOG: Record<TileCategory, { label: string; photos: string[] }> = {
  traffic_light: {
    label: "traffic lights",
    photos: ["traffic_light_1", "traffic_light_2", "traffic_light_3", "traffic_light_4"],
  },
  bicycle: {
    label: "bicycles",
    photos: ["bicycle_1", "bicycle_2", "bicycle_3", "bicycle_4"],
  },
  bus: {
    label: "buses",
    photos: ["bus_1", "bus_2", "bus_3", "bus_4"],
  },
  car: {
    label: "cars",
    photos: ["car_1", "car_2", "car_3", "car_4"],
  },
  crosswalk: {
    label: "crosswalks",
    photos: ["crosswalk_1", "crosswalk_2", "crosswalk_3", "crosswalk_4"],
  },
  hydrant: {
    label: "fire hydrants",
    photos: ["hydrant_1", "hydrant_2", "hydrant_3", "hydrant_4"],
  },
  bridge: {
    label: "bridges",
    photos: ["bridge_1", "bridge_2", "bridge_3", "bridge_4"],
  },
  motorcycle: {
    label: "motorcycles",
    photos: ["motorcycle_1", "motorcycle_2", "motorcycle_3", "motorcycle_4"],
  },
  tree: {
    label: "trees",
    photos: ["tree_1", "tree_2", "tree_3", "tree_4"],
  },
  building: {
    label: "buildings",
    photos: ["building_1", "building_2", "building_3", "building_4"],
  },
};

const TARGET_CATEGORIES: TileCategory[] = [
  "traffic_light",
  "bicycle",
  "bus",
  "car",
  "crosswalk",
  "hydrant",
  "bridge",
  "motorcycle",
];

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateDynamicChallenge(excludeTarget?: TileCategory): ImageChallenge {
  const candidates = excludeTarget
    ? TARGET_CATEGORIES.filter((c) => c !== excludeTarget)
    : TARGET_CATEGORIES;
  const target = candidates[Math.floor(Math.random() * candidates.length)];

  const targetCount = Math.random() < 0.5 ? 3 : 4;
  const targetPhotos = shuffleArray(CATEGORY_CATALOG[target].photos)
    .slice(0, targetCount)
    .map((photo) => ({ photo, category: target }));

  const distractorPool: CaptchaTile[] = [];
  for (const [cat, info] of Object.entries(CATEGORY_CATALOG) as [TileCategory, { label: string; photos: string[] }][]) {
    if (cat === target) continue;
    for (const photo of info.photos) {
      distractorPool.push({ photo, category: cat });
    }
  }

  const distractors = shuffleArray(distractorPool).slice(0, 9 - targetCount);
  const tiles = shuffleArray([...targetPhotos, ...distractors]);

  return {
    target,
    label: CATEGORY_CATALOG[target].label,
    tiles,
  };
}

export function DemoCaptcha({ verified, onVerifyChange }: DemoCaptchaProps) {
  const [expanded, setExpanded] = useState(false);
  const [challenge, setChallenge] = useState<ImageChallenge>(() => ({
    target: "bicycle",
    label: "bicycles",
    tiles: [
      { photo: "bicycle_1", category: "bicycle" },
      { photo: "car_1", category: "car" },
      { photo: "bridge_1", category: "bridge" },
      { photo: "bus_1", category: "bus" },
      { photo: "bicycle_2", category: "bicycle" },
      { photo: "hydrant_1", category: "hydrant" },
      { photo: "motorcycle_1", category: "motorcycle" },
      { photo: "bicycle_3", category: "bicycle" },
      { photo: "tree_1", category: "tree" },
    ],
  }));
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setChallenge(generateDynamicChallenge());
  }, []);

  const isExactMatch = useCallback(
    (indices: number[]) => {
      const expected = challenge.tiles
        .map((tile, idx) => (tile.category === challenge.target ? idx : -1))
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
    setChallenge((prev) => generateDynamicChallenge(prev.target));
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
      setChallenge((prev) => generateDynamicChallenge(prev.target));
      setSelectedIndices([]);
      setErrorMsg("Selection did not match. Try the new challenge.");
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
              3x3 GRID
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 w-full max-w-[340px] mx-auto">
            {challenge.tiles.map((tile, idx) => {
              const isSelected = selectedIndices.includes(idx);
              return (
                <button
                  key={`${challenge.target}-${tile.photo}-${idx}`}
                  type="button"
                  onClick={() => toggleTile(idx)}
                  aria-pressed={isSelected}
                  aria-label={`Verification tile ${idx + 1}`}
                  className={`relative aspect-square w-full rounded-lg border overflow-hidden transition-all cursor-pointer ${
                    isSelected
                      ? "border-cyan-400 ring-2 ring-cyan-400"
                      : "border-line-subtle hover:border-ink-muted"
                  }`}
                >
                  <img
                    src={`/captcha/${tile.photo}.jpg`}
                    alt=""
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
