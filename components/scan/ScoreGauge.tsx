import { scoreBandColors } from "@/lib/scan-display";

const R = 52;
const STROKE = 10;
const CIRC = 2 * Math.PI * R;

export function ScoreGauge({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const dash = CIRC * (clamped / 100);
  const { stroke, text, bgSoft } = scoreBandColors(clamped);

  return (
    <div className="flex flex-col items-center sm:items-start gap-4">
      <div
        className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full flex items-center justify-center"
        style={{ background: `radial-gradient(circle at 50% 50%, ${bgSoft} 0%, transparent 65%)` }}
      >
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 120 120"
          aria-hidden
        >
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-slate-200 dark:text-slate-700"
          />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke={stroke}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRC}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className="text-4xl sm:text-5xl font-bold tabular-nums tracking-tight"
            style={{ color: text }}
          >
            {score}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            / 100
          </span>
        </div>
      </div>
      <div className="text-center sm:text-left max-w-xs">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
          Güvenlik skoru
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          0–40 yüksek risk, 41–70 orta, 71–100 daha olumlu değerlendirme.
        </p>
      </div>
    </div>
  );
}
