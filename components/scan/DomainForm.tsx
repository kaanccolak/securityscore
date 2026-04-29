"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const POLL_MS = 3000;
const MAX_POLLS = 100;

export function DomainForm() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusLine, setStatusLine] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatusLine(null);
    setLoading(true);

    try {
      const post = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
        credentials: "same-origin",
      });

      const body = (await post.json().catch(() => ({}))) as {
        id?: string;
        status?: string;
        error?: string;
      };

      if (!post.ok) {
        setLoading(false);
        setError(body.error ?? `İstek başarısız (${post.status})`);
        return;
      }

      const scanId = body.id;
      if (!scanId) {
        setLoading(false);
        setError("Tarama kimliği alınamadı");
        return;
      }

      setStatusLine("Taranıyor…");

      for (let i = 0; i < MAX_POLLS; i++) {
        if (i > 0) {
          await new Promise((r) => setTimeout(r, POLL_MS));
        }

        const get = await fetch(`/api/scans/${scanId}`, {
          credentials: "same-origin",
        });

        if (!get.ok) {
          setLoading(false);
          setStatusLine(null);
          setError(`Durum okunamadı (${get.status})`);
          return;
        }

        const row = (await get.json()) as { status?: string; error_message?: string | null };

        if (row.status === "completed") {
          setLoading(false);
          setStatusLine(null);
          router.push(`/scan/${scanId}`);
          return;
        }

        if (row.status === "failed") {
          setLoading(false);
          setStatusLine(null);
          setError(row.error_message ?? "Tarama başarısız");
          router.push(`/scan/${scanId}`);
          return;
        }
      }

      setLoading(false);
      setStatusLine(null);
      setError("Tarama zaman aşımına uğradı; sonuçlar için tarama sayfasına bakın.");
      router.push(`/scan/${scanId}`);
    } catch (err) {
      setLoading(false);
      setStatusLine(null);
      setError(err instanceof Error ? err.message : "Ağ hatası");
    }
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
      {statusLine && !error && (
        <p className="text-sm text-slate-600 dark:text-slate-400" role="status">
          {statusLine}
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Taranıyor…" : "Taramayı başlat"}
      </Button>
    </form>
  );
}
