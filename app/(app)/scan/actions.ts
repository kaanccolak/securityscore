"use server";

import { revalidatePath } from "next/cache";
import { runAllScans } from "@/lib/scanners";
import { scoreFindings } from "@/lib/scoring/engine";
import { createClient } from "@/lib/supabase/server";
import { normalizeDomain } from "@/lib/utils";
export async function runSecurityScan(domain: string): Promise<{
  ok: boolean;
  scanId?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum gerekli" };
  }

  const normalized = normalizeDomain(domain);
  if (!normalized || !/^[\w.-]+\.[\w.-]+$/i.test(normalized)) {
    return { ok: false, error: "Geçerli bir alan adı girin" };
  }

  const { data: row, error: insertError } = await supabase
    .from("scans")
    .insert({
      user_id: user.id,
      domain: normalized,
      status: "running",
    })
    .select("id")
    .single();

  if (insertError || !row) {
    return { ok: false, error: insertError?.message ?? "Kayıt oluşturulamadı" };
  }

  const scanId = row.id;

  try {
    const { findings, raw } = await runAllScans(normalized);
    const { score } = scoreFindings(findings);

    await supabase
      .from("scans")
      .update({
        status: "completed",
        score,
        findings: findings as unknown as Record<string, unknown>[],
        raw_payload: raw as unknown as Record<string, unknown>,
        completed_at: new Date().toISOString(),
      })
      .eq("id", scanId);

    revalidatePath("/dashboard");
    revalidatePath("/scan");
    revalidatePath(`/scan/${scanId}`);
    return { ok: true, scanId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Tarama hatası";
    await supabase
      .from("scans")
      .update({
        status: "failed",
        error_message: msg,
        completed_at: new Date().toISOString(),
      })
      .eq("id", scanId);
    revalidatePath("/dashboard");
    return { ok: false, error: msg, scanId };
  }
}
