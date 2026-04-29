import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * iyzico ödeme bildirimi. Gerçek entegrasyonda imza doğrulaması ve
 * CheckoutForm sonucu sorgulama eklenmelidir.
 */
export async function POST(request: Request) {
  let json: Record<string, unknown>;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const status = String(json.status ?? "");
  const conversationId = String(json.conversationId ?? "");

  if (status === "success" && conversationId.startsWith("sub_")) {
    const userId = conversationId.slice(4);
    try {
      const admin = createAdminClient();
      await admin.from("subscriptions").upsert(
        {
          user_id: userId,
          plan: "pro",
          status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    } catch {
      // SUPABASE_SERVICE_ROLE_KEY yoksa veya tablo yoksa sessizce geç
    }
  }

  return NextResponse.json({ ok: true });
}
