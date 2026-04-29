import type { Finding } from "@/types/scan";

export interface WhoapiScanResult {
  findings: Finding[];
  /** Anahtar yoksa veya modül atlandıysa tanımsız. */
  raw?: unknown;
}

interface WhoapiWhoisResponse {
  status?: string | number;
  status_desc?: string;
  date_created?: string;
  date_expires?: string;
  domain_name?: string;
  registered?: boolean | string;
}

function parseWhoapiDate(s: string): Date | null {
  const d = new Date(s.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * WhoAPI Whois — https://api.whoapi.com/?domain=...&r=whois&apikey=...
 * Ücretsiz deneme / ücretli planlar için hesaptan API anahtarı gerekir.
 */
export async function scanWhoapiDomain(domain: string): Promise<WhoapiScanResult> {
  const normalized = domain.trim().toLowerCase();
  const apikey = process.env.WHOAPI_API_KEY;

  if (!apikey?.trim()) {
    return { findings: [] };
  }

  const url = `https://api.whoapi.com/?domain=${encodeURIComponent(normalized)}&r=whois&apikey=${encodeURIComponent(apikey)}`;

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    const data = (await res.json()) as WhoapiWhoisResponse;

    const st = String(data.status ?? "");
    if (st !== "0") {
      return {
        findings: [
          {
            id: "whoapi-error",
            category: "whois",
            severity: "low",
            title: "WhoAPI Whois başarısız",
            detail: data.status_desc ?? `Durum kodu: ${st}`,
          },
        ],
        raw: data,
      };
    }

    const createdRaw = data.date_created;
    if (!createdRaw) {
      return {
        findings: [
          {
            id: "whoapi-no-date",
            category: "whois",
            severity: "info",
            title: "Kayıt tarihi dönmedi",
            detail: "WhoAPI yanıtında date_created alanı yok veya TLD desteği sınırlı olabilir.",
          },
        ],
        raw: data,
      };
    }

    const created = parseWhoapiDate(createdRaw);
    if (!created) {
      return {
        findings: [
          {
            id: "whoapi-bad-date",
            category: "whois",
            severity: "info",
            title: "Kayıt tarihi çözülemedi",
            detail: createdRaw,
          },
        ],
        raw: data,
      };
    }

    const ageMs = Date.now() - created.getTime();
    const ageDays = Math.floor(ageMs / 86_400_000);
    const ageYears = ageDays / 365.25;

    const findings: Finding[] = [];
    const dateTr = created.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (ageDays < 30) {
      findings.push({
        id: "whoapi-very-new",
        category: "whois",
        severity: "high",
        title: "Alan adı çok yeni",
        detail: `Kayıt: ${dateTr} (~${ageDays} gün). Yeni alan adları oltalama veya geçici altyapı ile ilişkilendirilebilir; ek doğrulama önerilir.`,
      });
    } else if (ageDays < 180) {
      findings.push({
        id: "whoapi-new",
        category: "whois",
        severity: "medium",
        title: "Alan adı nispeten yeni",
        detail: `Kayıt: ${dateTr} (~${Math.round(ageDays / 30)} ay). Kısa süreli kayıtlar risk sinyali olabilir.`,
      });
    } else {
      findings.push({
        id: "whoapi-age-ok",
        category: "whois",
        severity: "info",
        title: "Alan adı yaşı",
        detail: `Kayıt: ${dateTr} (~${ageYears.toFixed(1)} yıl).`,
      });
    }

    if (data.date_expires) {
      const exp = parseWhoapiDate(data.date_expires);
      if (exp) {
        const until = Math.ceil((exp.getTime() - Date.now()) / 86_400_000);
        if (until < 30 && until > 0) {
          findings.push({
            id: "whoapi-expiring",
            category: "whois",
            severity: "low",
            title: "Kayıt süresi yakında doluyor",
            detail: `Bitiş: ${data.date_expires} (~${until} gün).`,
          });
        }
      }
    }

    return {
      findings,
      raw: {
        date_created: data.date_created,
        date_expires: data.date_expires,
        domain_name: data.domain_name,
        ageDays,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return {
      findings: [
        {
          id: "whoapi-exception",
          category: "whois",
          severity: "low",
          title: "WhoAPI isteği hatası",
          detail: msg,
        },
      ],
      raw: { error: msg },
    };
  }
}
