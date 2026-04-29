import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: scans } = await supabase
    .from("scans")
    .select("id, domain, score, status, created_at, completed_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Raporlar</h1>
      {!scans?.length ? (
        <p className="text-sm text-slate-500">Henüz rapor yok.</p>
      ) : (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-2 font-medium">Alan adı</th>
                <th className="px-4 py-2 font-medium">Skor</th>
                <th className="px-4 py-2 font-medium">Durum</th>
                <th className="px-4 py-2 font-medium">Tarih</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {scans.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <Link href={`/scan/${s.id}`} className="font-medium hover:underline">
                      {s.domain}
                    </Link>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {s.score ?? "—"}
                  </td>
                  <td className="px-4 py-3">{s.status}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(s.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {s.status === "completed" && s.score !== null && (
                      <Link
                        href={`/api/scans/${s.id}/pdf`}
                        className="text-slate-900 dark:text-slate-100 underline"
                      >
                        PDF
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
