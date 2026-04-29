"use server";

import { revalidatePath } from "next/cache";
import { scheduleScanCompletion } from "@/lib/scan-background";
import { createClient } from "@/lib/supabase/server";
import { normalizeDomain } from "@/lib/utils";

/** Tarama arka planda biter; hemen `scanId` döner (UI için API route tercih edilir). */
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

  scheduleScanCompletion({
    scanId: row.id,
    userId: user.id,
    domain: normalized,
  });

  revalidatePath("/dashboard");
  revalidatePath("/scan");

  return { ok: true, scanId: row.id };
}
