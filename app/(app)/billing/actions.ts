"use server";

import { initializeCheckoutForm, type CheckoutPayload } from "@/lib/payments/iyzico";
import { createClient } from "@/lib/supabase/server";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function startProCheckout(): Promise<{
  ok: boolean;
  paymentPageUrl?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { ok: false, error: "Oturum gerekli" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const name = profile?.full_name?.trim() || user.email.split("@")[0] || "User";
  const [firstName, ...rest] = name.split(/\s+/);
  const surname = rest.length ? rest.join(" ") : firstName;

  const payload: CheckoutPayload = {
    locale: "tr",
    conversationId: `sub_${user.id}`,
    price: "99.00",
    paidPrice: "99.00",
    currency: "TRY",
    basketId: `basket_${user.id}`,
    paymentGroup: "SUBSCRIPTION",
    callbackUrl: `${APP_URL}/api/webhooks/iyzico`,
    enabledInstallments: [1],
    buyer: {
      id: user.id,
      name: firstName,
      surname,
      email: user.email,
      identityNumber: "11111111111",
      registrationAddress: "Istanbul",
      city: "Istanbul",
      country: "Turkey",
      ip: "85.34.78.112",
    },
    shippingAddress: {
      contactName: name,
      city: "Istanbul",
      country: "Turkey",
      address: "Istanbul",
    },
    billingAddress: {
      contactName: name,
      city: "Istanbul",
      country: "Turkey",
      address: "Istanbul",
    },
    basketItems: [
      {
        id: "pro-plan",
        name: "SecurityScore Pro",
        category1: "Subscription",
        itemType: "VIRTUAL",
        price: "99.00",
      },
    ],
  };

  const res = await initializeCheckoutForm(payload);
  if (res.status !== "success" || !res.paymentPageUrl) {
    return {
      ok: false,
      error: res.errorMessage ?? "Ödeme başlatılamadı",
    };
  }

  return { ok: true, paymentPageUrl: res.paymentPageUrl };
}
