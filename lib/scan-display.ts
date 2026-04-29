import type { Finding, FindingSeverity } from "@/types/scan";

export function scoreBandClass(score: number): "red" | "amber" | "green" {
  if (score <= 40) return "red";
  if (score <= 70) return "amber";
  return "green";
}

export function scoreBandColors(score: number): {
  stroke: string;
  text: string;
  bgSoft: string;
} {
  const band = scoreBandClass(score);
  if (band === "red") {
    return { stroke: "#dc2626", text: "#b91c1c", bgSoft: "rgba(220, 38, 38, 0.08)" };
  }
  if (band === "amber") {
    return { stroke: "#d97706", text: "#b45309", bgSoft: "rgba(217, 119, 6, 0.1)" };
  }
  return { stroke: "#16a34a", text: "#15803d", bgSoft: "rgba(22, 163, 74, 0.08)" };
}

export function countSeverities(findings: Finding[]): Record<
  Extract<FindingSeverity, "high" | "medium" | "low">,
  number
> {
  const counts = { high: 0, medium: 0, low: 0 };
  for (const f of findings) {
    if (f.severity === "high") counts.high += 1;
    else if (f.severity === "medium") counts.medium += 1;
    else if (f.severity === "low") counts.low += 1;
  }
  return counts;
}
