import type { Finding } from "@/types/scan";

export interface HibpScanResult {
  findings: Finding[];
  /** Tanımsız: modül sessizce atlandı (ör. API anahtarı yok). */
  raw?: unknown;
}

/** HIBP v3 breached domain (requires API key). */
export async function scanHibp(domain: string): Promise<HibpScanResult> {
  const key = process.env.HIBP_API_KEY;
  if (!key?.trim()) {
    return { findings: [] };
  }

  const url = `https://haveibeenpwned.com/api/v3/breacheddomain/${encodeURIComponent(domain)}`;
  try {
    const res = await fetch(url, {
      headers: { "hibp-api-key": key },
      next: { revalidate: 0 },
    });

    if (res.status === 404) {
      return {
        findings: [
          {
            id: "hibp-clean",
            category: "hibp",
            severity: "info",
            title: "Bilinen alan adı ihlali yok",
            detail: "HIBP bu alan adı için bilinen bir ihlal listelemedi.",
          },
        ],
        raw: [],
      };
    }

    if (!res.ok) {
      return {
        findings: [
          {
            id: "hibp-http",
            category: "hibp",
            severity: "low",
            title: "HIBP isteği başarısız",
            detail: `HTTP ${res.status}`,
          },
        ],
        raw: { status: res.status },
      };
    }

    const names = (await res.json()) as string[];
    const findings: Finding[] = names.slice(0, 15).map((name) => ({
      id: `hibp-${name}`,
      category: "hibp" as const,
      severity: "high" as const,
      title: `İhlal: ${name}`,
      detail: "Bu ihlalde alan adına ait hesaplar sızmış olabilir.",
    }));

    if (names.length > 15) {
      findings.push({
        id: "hibp-more",
        category: "hibp",
        severity: "medium",
        title: "Ek ihlaller",
        detail: `+${names.length - 15} ek ihlal adı listelenmedi.`,
      });
    }

    return { findings, raw: names };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return {
      findings: [
        {
          id: "hibp-exception",
          category: "hibp",
          severity: "low",
          title: "HIBP hatası",
          detail: msg,
        },
      ],
      raw: { error: msg },
    };
  }
}
