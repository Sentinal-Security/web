import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as zxcvbnCommon from "@zxcvbn-ts/language-common";
import * as zxcvbnEn from "@zxcvbn-ts/language-en";

const factory = new ZxcvbnFactory({
  translations: zxcvbnEn.translations,
  graphs: zxcvbnCommon.adjacencyGraphs,
  dictionary: {
    ...zxcvbnCommon.dictionary,
    ...zxcvbnEn.dictionary,
  },
});

export interface PasswordEntropyResult {
  score: number; // 0 - 4
  label: "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";
  colorClass: string;
  barColor: string;
  crackTimeDisplay: string;
  warning?: string;
  suggestions: string[];
}

export function evaluatePasswordStrength(password: string): PasswordEntropyResult {
  if (!password || password.trim().length === 0) {
    return {
      score: 0,
      label: "Very Weak",
      colorClass: "text-slate-400",
      barColor: "bg-slate-700",
      crackTimeDisplay: "Instant",
      suggestions: ["Enter a password of at least 8 characters."],
    };
  }

  const res = factory.check(password);
  const score = res.score;

  let label: PasswordEntropyResult["label"] = "Very Weak";
  let colorClass = "text-red-400";
  let barColor = "bg-red-500";

  switch (score) {
    case 0:
      label = "Very Weak";
      colorClass = "text-red-400";
      barColor = "bg-red-500";
      break;
    case 1:
      label = "Weak";
      colorClass = "text-orange-400";
      barColor = "bg-orange-500";
      break;
    case 2:
      label = "Fair";
      colorClass = "text-amber-400";
      barColor = "bg-amber-400";
      break;
    case 3:
      label = "Strong";
      colorClass = "text-emerald-400";
      barColor = "bg-emerald-400";
      break;
    case 4:
      label = "Very Strong";
      colorClass = "text-cyan-400";
      barColor = "bg-cyan-400";
      break;
  }

  const crackTime =
    res.crackTimes?.offlineSlowHashingXPerSecond?.display ||
    res.crackTimes?.onlineNoThrottlingXPerSecond?.display ||
    "Instant";

  return {
    score,
    label,
    colorClass,
    barColor,
    crackTimeDisplay: crackTime,
    warning: res.feedback?.warning || undefined,
    suggestions: res.feedback?.suggestions || [],
  };
}
