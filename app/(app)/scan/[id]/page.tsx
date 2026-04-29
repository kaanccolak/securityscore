import Link from "next/link";
import { notFound } from "next/navigation";
import { FindingsList } from "@/components/scan/FindingsList";
import { FindingsSummary } from "@/components/scan/FindingsSummary";
import { ScoreGauge } from "@/components/scan/ScoreGauge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { countSeverities } from "@/lib/scan-display";
import type { Finding } from "@/types/scan";

export default async function ScanDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: scan, error } = await supabase
    .from("scans")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user!.id)
    .single();

  if (error || !scan) notFound();

  const findings = (scan.findings ?? []) as Finding[];
  const sev = countSeverities(findings);
  const actionable = sev.high + sev.medium + sev.low;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Link
            href="/scan"
            className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1"
          >
            <span aria-hidden>←</span> Tarama
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-3 text-slate-900 dark:text-slate-50">
            {scan.domain}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Durum: <span className="font-medium text-slate-700 dark:text-slate-300">{scan.status}</span>
            {scan.error_message ? (
              <span className="text-red-600 dark:text-red-400"> — {scan.error_message}</span>
            ) : null}
          </p>
        </div>
        {scan.status === "completed" && scan.score !== null && (
          <a href={`/api/scans/${scan.id}/pdf`} className="shrink-0">
            <Button variant="secondary" className="w-full sm:w-auto shadow-sm">
              PDF indir
            </Button>
          </a>
        )}
      </div>

      {scan.status === "completed" && scan.score !== null ? (
        <>
          <section className="rounded-2xl border border-slate-200/90 dark:border-slate-700/90 bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm p-6 sm:p-8 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
              Özet
            </h2>
            <FindingsSummary findings={findings} />
            {actionable > 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                Toplam <strong className="text-slate-700 dark:text-slate-300">{actionable}</strong>{" "}
                öncelikli bulgu (yüksek, orta veya düşük). Bilgi notları özette yer almaz.
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                Öncelikli (yüksek / orta / düşük) bulgu yok; yalnızca bilgi düzeyi kayıtlar olabilir.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200/90 dark:border-slate-700/90 bg-gradient-to-b from-white to-slate-50/80 dark:from-slate-900/50 dark:to-slate-950/50 p-6 sm:p-8 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6">
              Skor
            </h2>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <ScoreGauge score={scan.score} />
              <div className="flex-1 min-h-[120px] rounded-xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 p-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>
                  Bu skor, DNS güvenliği (SPF, DMARC), TLS yapılandırması, web güvenlik başlıkları
                  ve yapılandırılmışsa veri ihlali kontrollerinden türetilir. Tek bir
                  ölçüm değildir; operasyonel önceliklendirme için bulgu listesini birlikte
                  değerlendirin.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
              Bulgular
            </h2>
            <FindingsList findings={findings} />
          </section>
        </>
      ) : (
        <p className="text-slate-600 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          {scan.status === "running"
            ? "Tarama sürüyor; sayfayı yenileyin."
            : "Bu tarama için sonuç yok veya hata oluştu."}
        </p>
      )}
    </div>
  );
}
