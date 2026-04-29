import type { FindingSeverity } from "@/types/scan";

/** Penalty points per finding severity (subtracted from base score). */
export const severityPenalty: Record<FindingSeverity, number> = {
  info: 0,
  low: 3,
  medium: 8,
  high: 15,
};

export const baseScore = 100;
