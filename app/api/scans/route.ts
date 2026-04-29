import { NextResponse } from "next/server";
import { runAllScans } from "@/lib/scanners";

/** Paralel tarayıcılar + SSL Labs süresi için (Vercel varsayılan süre sınırını aşmamak) */
export const maxDuration = 60;
import { scoreFindings } from "@/lib/scoring/engine";
import { createClient } from "@/lib/supabase/server";
import { normalizeDomain } from "@/lib/utils";
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { domain?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const normalized = normalizeDomain(body.domain ?? "");
  if (!normalized) {
    return NextResponse.json({ error: "domain required" }, { status: 400 });
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
    return NextResponse.json({ error: insertError?.message }, { status: 500 });
  }

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
      .eq("id", row.id);

    return NextResponse.json({ id: row.id, score, findings });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "scan failed";
    await supabase
      .from("scans")
      .update({
        status: "failed",
        error_message: msg,
        completed_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    return NextResponse.json({ error: msg, id: row.id }, { status: 500 });
  }
}
