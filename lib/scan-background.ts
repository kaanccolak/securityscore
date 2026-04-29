import { waitUntil } from "@vercel/functions";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runAllScans } from "@/lib/scanners";
import { scoreFindings } from "@/lib/scoring/engine";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function safeRevalidate(...paths: string[]) {
  for (const p of paths) {
    try {
      revalidatePath(p);
    } catch (e) {
      console.warn("[scan-background] revalidatePath atlandı:", p, e);
    }
  }
}

async function getSupabaseForJob(): Promise<SupabaseClient> {
  try {
    return createAdminClient();
  } catch {
    return createClient();
  }
}

/**
 * Taramayı HTTP yanıtı döndükten sonra çalıştırır (Vercel `waitUntil`).
 * Üretimde `SUPABASE_SERVICE_ROLE_KEY` tanımlı olmalı; yoksa oturumlu `createClient` denenir.
 */
export function scheduleScanCompletion(params: {
  scanId: string;
  userId: string;
  domain: string;
}): void {
  const job = async () => {
    const { scanId, userId, domain } = params;
    let supabase: SupabaseClient;
    try {
      supabase = await getSupabaseForJob();
    } catch (e) {
      console.error("[scan-background] Supabase istemcisi oluşturulamadı:", e);
      return;
    }

    try {
      const { findings, raw } = await runAllScans(domain);
      const { score } = scoreFindings(findings);

      const { error } = await supabase
        .from("scans")
        .update({
          status: "completed",
          score,
          findings: findings as unknown as Record<string, unknown>[],
          raw_payload: raw as unknown as Record<string, unknown>,
          completed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", scanId)
        .eq("user_id", userId);

      if (error) {
        console.error("[scan-background] Tamamlandı güncellemesi başarısız:", error);
      }

      safeRevalidate("/dashboard", "/scan", `/scan/${scanId}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Tarama hatası";
      console.error("[scan-background] Tarama hatası:", e);
      await supabase
        .from("scans")
        .update({
          status: "failed",
          error_message: msg,
          completed_at: new Date().toISOString(),
        })
        .eq("id", scanId)
        .eq("user_id", userId);

      safeRevalidate("/dashboard", "/scan", `/scan/${scanId}`);
    }
  };

  const p = job();
  const registered = waitUntil(p);
  if (registered === undefined) {
    console.warn(
      "[scan-background] waitUntil kullanılamadı (yerel ortam?). Tarama yine de arka planda çalıştırılıyor.",
    );
    void p.catch((err) => console.error("[scan-background] Arka plan hatası:", err));
  }
}
