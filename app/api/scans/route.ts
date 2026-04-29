import { NextResponse } from "next/server";
import { scheduleScanCompletion } from "@/lib/scan-background";
import { createClient } from "@/lib/supabase/server";
import { normalizeDomain } from "@/lib/utils";

/** Vercel / Node: arka plan tarama işi bu süre içinde bitebilir (waitUntil). Hobby için ek ayar: vercel.json */
export const maxDuration = 60;

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

  scheduleScanCompletion({
    scanId: row.id,
    userId: user.id,
    domain: normalized,
  });

  return NextResponse.json({ id: row.id, status: "running" });
}
