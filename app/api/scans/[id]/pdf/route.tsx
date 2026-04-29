import { NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import { ScanReportPdf } from "@/lib/pdf/report";
import { createClient } from "@/lib/supabase/server";
import type { Finding } from "@/types/scan";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("scans")
    .select("domain, score, findings, status, completed_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data || data.status !== "completed" || data.score === null) {
    return NextResponse.json({ error: "Rapor hazır değil" }, { status: 404 });
  }

  const findings = (data.findings ?? []) as Finding[];
  const generatedAt = data.completed_at ?? new Date().toISOString();

  const doc = (
    <ScanReportPdf
      domain={data.domain}
      score={data.score}
      findings={findings}
      generatedAt={generatedAt}
    />
  );

  const blob = await pdf(doc).toBlob();
  const arrayBuffer = await blob.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="securityscore-${data.domain}.pdf"`,
    },
  });
}
