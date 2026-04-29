import type { Finding } from "@/types/scan";
import { baseScore, severityPenalty } from "./weights";

export interface ScoreResult {
  score: number;
  findings: Finding[];
}

/**
 * Simple additive model: start at 100, subtract penalties by severity.
 * Caps between 0 and 100.
 */
export function scoreFindings(findings: Finding[]): ScoreResult {
  let penalty = 0;
  const seen = new Set<string>();
  for (const f of findings) {
    if (seen.has(f.id)) continue;
    seen.add(f.id);
    penalty += severityPenalty[f.severity] ?? 0;
  }
  const score = Math.max(0, Math.min(baseScore, baseScore - penalty));
  return { score, findings };
}
