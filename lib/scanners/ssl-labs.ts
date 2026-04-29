import type { Finding } from "@/types/scan";

export interface SslLabsScanResult {
  findings: Finding[];
  raw: unknown;
}

const BASE = "https://api.ssllabs.com/api/v3";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function scanSslLabs(host: string): Promise<SslLabsScanResult> {
  const findings: Finding[] = [];
  const maxWaitMs = 90_000;
  const start = Date.now();
  let last: Record<string, unknown> | null = null;

  try {
    let endpoint = `${BASE}/analyze?host=${encodeURIComponent(host)}&publish=off&startNew=on&all=done`;

    while (Date.now() - start < maxWaitMs) {
      const res = await fetch(endpoint, { next: { revalidate: 0 } });
      if (!res.ok) {
        return {
          findings: [
            {
              id: "ssl-labs-http",
              category: "ssl",
              severity: "low",
              title: "SSL Labs isteği başarısız",
              detail: `HTTP ${res.status}`,
            },
          ],
          raw: { status: res.status },
        };
      }
      last = (await res.json()) as Record<string, unknown>;
      const status = String(last.status ?? "");

      if (status === "READY" || status === "COMPLETE") {
        break;
      }
      if (status === "ERROR") {
        findings.push({
          id: "ssl-labs-assess-error",
          category: "ssl",
          severity: "medium",
          title: "SSL Labs değerlendirme hatası",
          detail: String(last.statusMessage ?? "Bilinmeyen hata"),
        });
        return { findings, raw: last };
      }

      endpoint = `${BASE}/analyze?host=${encodeURIComponent(host)}&publish=off`;
      await sleep(5000);
    }

    if (!last) {
      return {
        findings: [
          {
            id: "ssl-labs-timeout",
            category: "ssl",
            severity: "low",
            title: "SSL Labs zaman aşımı",
            detail: "Değerlendirme süresi içinde tamamlanamadı.",
          },
        ],
        raw: null,
      };
    }

    const endpoints = (last.endpoints as Array<Record<string, unknown>>) ?? [];
    const ep = endpoints[0];
    if (!ep) {
      findings.push({
        id: "ssl-labs-no-endpoint",
        category: "ssl",
        severity: "medium",
        title: "SSL Labs uç noktası yok",
        detail: "Sunucu için SSL uç noktası döndürülmedi.",
      });
      return { findings, raw: last };
    }

    const grade = ep.grade as string | undefined;
    if (grade && ["A+", "A"].includes(grade)) {
      findings.push({
        id: "ssl-grade-good",
        category: "ssl",
        severity: "info",
        title: `SSL notu: ${grade}`,
        detail: "SSL Labs genel notu kabul edilebilir veya iyi.",
      });
    } else if (grade) {
      findings.push({
        id: "ssl-grade-weak",
        category: "ssl",
        severity: "high",
        title: `SSL notu: ${grade}`,
        detail: "Sertifika veya yapılandırma iyileştirilmeli.",
      });
    }

    const details = ep.details as Record<string, unknown> | undefined;
    const cert = details?.cert as Record<string, unknown> | undefined;
    if (cert?.issues && Number(cert.issues) > 0) {
      findings.push({
        id: "ssl-cert-issues",
        category: "ssl",
        severity: "medium",
        title: "Sertifika uyarıları",
        detail: `SSL Labs sertifika sorunları bildirdi: ${String(cert.issues)}`,
      });
    }

    if (findings.length === 0) {
      findings.push({
        id: "ssl-summary",
        category: "ssl",
        severity: "info",
        title: "SSL Labs özeti",
        detail: "Değerlendirme tamamlandı.",
      });
    }

    return { findings, raw: last };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return {
      findings: [
        {
          id: "ssl-labs-exception",
          category: "ssl",
          severity: "low",
          title: "SSL Labs hatası",
          detail: msg,
        },
      ],
      raw: { error: msg },
    };
  }
}
