"use client";

import { useState } from "react";
import { startProCheckout } from "@/app/(app)/billing/actions";
import { Button } from "@/components/ui/button";

export function CheckoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    setLoading(true);
    const res = await startProCheckout();
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Hata");
      return;
    }
    if (res.paymentPageUrl) {
      window.location.href = res.paymentPageUrl;
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={onClick} disabled={loading}>
        {loading ? "Yönlendiriliyor…" : "iyzico ile öde"}
      </Button>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
