import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: scans } = await supabase
    .from("scans")
    .select("id, domain, score, status, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Panel</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Son taramalarınız ve hızlı erişim.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/scan"
          className="inline-flex rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2 text-sm font-medium"
        >
          Yeni tarama
        </Link>
        <Link
          href="/reports"
          className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Tüm raporlar
        </Link>
      </div>
      <section>
        <h2 className="text-lg font-medium mb-3">Son taramalar</h2>
        {!scans?.length ? (
          <p className="text-sm text-slate-500">Henüz tarama yok.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            {scans.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <Link href={`/scan/${s.id}`} className="font-medium hover:underline">
                    {s.domain}
                  </Link>
                  <span className="text-slate-500 ml-2">{s.status}</span>
                </div>
                <div className="tabular-nums">
                  {s.score !== null ? `${s.score}/100` : "—"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
