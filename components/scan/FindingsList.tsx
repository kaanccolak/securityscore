import type { Finding } from "@/types/scan";
import { getFindingGuidance } from "@/lib/findings-guidance";
import { INFO_POSITIVE_SUMMARY_ID, prepareFindingsForDisplay } from "@/lib/findings-display";
import { cn } from "@/lib/utils";

const stripe: Record<string, string> = {
  high: "border-l-[#dc2626] bg-gradient-to-r from-red-50/90 to-white dark:from-red-950/50 dark:to-slate-950/30",
  medium:
    "border-l-[#ea580c] bg-gradient-to-r from-orange-50/90 to-white dark:from-orange-950/45 dark:to-slate-950/30",
  low: "border-l-[#ca8a04] bg-gradient-to-r from-yellow-50/90 to-white dark:from-yellow-950/35 dark:to-slate-950/30",
  info: "border-l-slate-400 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950/30",
};

const badge: Record<string, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-200",
  medium: "bg-orange-100 text-orange-900 dark:bg-orange-950/80 dark:text-orange-100",
  low: "bg-yellow-100 text-yellow-900 dark:bg-yellow-950/60 dark:text-yellow-100",
  info: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

const categoryLabel: Record<Finding["category"], string> = {
  dns: "DNS",
  ssl: "SSL",
  shodan: "Arşiv",
  hibp: "Veri ihlali",
  headers: "HTTP",
  robots: "robots.txt",
  whois: "WHOIS",
  general: "Genel",
};

function FindingGuidanceBlocks({ finding }: { finding: Finding }) {
  const g = getFindingGuidance(finding);
  return (
    <div className="mt-4 space-y-3 text-sm">
      <div className="rounded-lg bg-emerald-50/90 dark:bg-emerald-950/35 p-3 border border-emerald-200/70 dark:border-emerald-800/60">
        <div className="flex gap-2.5">
          <span className="shrink-0 text-base leading-none pt-0.5 select-none" aria-hidden>
            ✅
          </span>
          <div className="min-w-0">
            <div className="font-semibold text-emerald-900 dark:text-emerald-100">Nasıl düzeltilir?</div>
            <p className="mt-1.5 text-slate-700 dark:text-slate-200 leading-relaxed">{g.remediation}</p>
          </div>
        </div>
      </div>
      <div className="rounded-lg bg-rose-50/90 dark:bg-rose-950/25 p-3 border border-rose-200/70 dark:border-rose-900/50">
        <div className="flex gap-2.5">
          <span className="shrink-0 text-base leading-none pt-0.5 select-none" aria-hidden>
            ⚠️
          </span>
          <div className="min-w-0">
            <div className="font-semibold text-rose-900 dark:text-rose-100">Düzeltmezseniz ne olur?</div>
            <p className="mt-1.5 text-slate-700 dark:text-slate-200 leading-relaxed">{g.risk}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FindingsList({ findings }: { findings: Finding[] }) {
  const rows = prepareFindingsForDisplay(findings);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
        Bu tarama için listelenecek bulgu yok.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((f) => (
        <li
          key={f.id}
          className={cn(
            "rounded-r-xl border border-slate-200/80 dark:border-slate-700/80 border-l-[5px] pl-5 pr-4 py-4 shadow-sm",
            stripe[f.severity] ?? stripe.info,
          )}
        >
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md",
                badge[f.severity] ?? badge.info,
              )}
            >
              {f.severity}
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md bg-slate-100/80 dark:bg-slate-800/80">
              {categoryLabel[f.category]}
            </span>
          </div>
          <div className="font-semibold text-slate-900 dark:text-slate-50 text-sm sm:text-base">
            {f.title}
          </div>
          <div className="text-slate-600 dark:text-slate-300 mt-2 text-sm leading-relaxed">
            {f.detail}
          </div>
          {f.id !== INFO_POSITIVE_SUMMARY_ID ? <FindingGuidanceBlocks finding={f} /> : null}
        </li>
      ))}
    </ul>
  );
}
