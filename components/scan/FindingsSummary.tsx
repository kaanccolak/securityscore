import { countSeverities } from "@/lib/scan-display";
import type { Finding } from "@/types/scan";

export function FindingsSummary({ findings }: { findings: Finding[] }) {
  const { high, medium, low } = countSeverities(findings);

  const items = [
    { label: "Yüksek", count: high, className: "border-l-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200" },
    { label: "Orta", count: medium, className: "border-l-orange-500 bg-orange-50 dark:bg-orange-950/35 text-orange-900 dark:text-orange-200" },
    { label: "Düşük", count: low, className: "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-900 dark:text-yellow-100" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-xl">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-xl border border-slate-200/80 dark:border-slate-700/80 border-l-4 pl-4 pr-3 py-3 shadow-sm ${item.className}`}
        >
          <div className="text-xs font-medium opacity-90">{item.label}</div>
          <div className="text-2xl font-bold tabular-nums mt-1">{item.count}</div>
          <div className="text-[10px] opacity-75 mt-0.5">bulgu</div>
        </div>
      ))}
    </div>
  );
}
