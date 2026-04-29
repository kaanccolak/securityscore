import { createClient } from "@/lib/supabase/server";
import { CheckoutButton } from "@/components/marketing/CheckoutButton";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold">Faturalama</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Mevcut plan: <strong>{sub?.plan ?? "—"}</strong> ({sub?.status ?? "—"})
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <h2 className="text-lg font-medium">Pro plan</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Sınırsız tarama ve öncelikli destek (örnek). iyzico sandbox ile test edin;
          API anahtarlarını `.env.local` içinde tanımlayın.
        </p>
        <p className="text-2xl font-semibold">₺99 / ay</p>
        <CheckoutButton />
      </div>
    </div>
  );
}
