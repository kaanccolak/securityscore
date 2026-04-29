"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { runSecurityScan } from "@/app/(app)/scan/actions";
import { Button } from "@/components/ui/button";

export function DomainForm() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await runSecurityScan(domain);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Bilinmeyen hata");
      if (res.scanId) router.push(`/scan/${res.scanId}`);
      return;
    }
    if (res.scanId) router.push(`/scan/${res.scanId}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 max-w-xl">
      <div>
        <label htmlFor="domain" className="block text-sm font-medium mb-1">
          Alan adı
        </label>
        <input
          id="domain"
          name="domain"
          type="text"
          required
          placeholder="ornek.com.tr"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Taranıyor…" : "Taramayı başlat"}
      </Button>
    </form>
  );
}
