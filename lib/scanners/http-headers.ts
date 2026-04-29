import type { Finding } from "@/types/scan";

export interface HttpHeadersScanResult {
  findings: Finding[];
  raw: unknown;
}

/** 10s — WAF / yavaş TLS için makul üst sınır */
const FETCH_TIMEOUT_MS = 10_000;
/** Birçok site bot/WAF ile özel UA veya HEAD’i keser; tarayıcı benzeri UA daha güvenilir */
const FETCH_USER_AGENT = "Mozilla/5.0";

function pickHeader(headers: Headers, names: string[]): string | null {
  for (const n of names) {
    const v = headers.get(n);
    if (v && v.trim()) return v.trim();
  }
  return null;
}

function baseFetchInit(signal: AbortSignal): RequestInit {
  return {
    redirect: "follow",
    cache: "no-store",
    signal,
    headers: {
      "User-Agent": FETCH_USER_AGENT,
      Accept: "text/html,*/*",
    },
  };
}

function logFetchError(phase: string, url: string, err: unknown): void {
  if (err instanceof Error) {
    console.error(`[http-headers] ${phase} ${url}: ${err.name}: ${err.message}`, err.stack);
  } else {
    console.error(`[http-headers] ${phase} ${url}:`, err);
  }
}

async function fetchHeadOrGet(url: string): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    let res = await fetch(url, {
      ...baseFetchInit(controller.signal),
      method: "HEAD",
    });
    if (res.status === 405 || res.status === 501) {
      clearTimeout(timeout);
      const c2 = new AbortController();
      const t2 = setTimeout(() => c2.abort(), FETCH_TIMEOUT_MS);
      try {
        res = await fetch(url, {
          ...baseFetchInit(c2.signal),
          method: "GET",
        });
      } catch (err) {
        logFetchError("GET(405)", url, err);
        return null;
      } finally {
        clearTimeout(t2);
      }
    }
    return res;
  } catch (err) {
    logFetchError("HEAD", url, err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchGet(url: string): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...baseFetchInit(controller.signal),
      method: "GET",
    });
  } catch (err) {
    logFetchError("GET", url, err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Hedef sitenin yanıt başlıklarını doğrudan okur.
 * Sıra: https://apex, http://apex, https://www.apex, http://www.apex — ilk başarılı yanıtın başlıkları kullanılır.
 */
export async function scanHttpSecurityHeaders(domain: string): Promise<HttpHeadersScanResult> {
  const normalized = domain.trim().toLowerCase().replace(/\/+$/, "");
  const apexHost = normalized.replace(/^www\./, "") || normalized;
  const findings: Finding[] = [];
  const tried: string[] = [];

  const candidateUrls = [
    `https://${apexHost}/`,
    `http://${apexHost}/`,
    `https://www.${apexHost}/`,
    `http://www.${apexHost}/`,
  ];

  let res: Response | null = null;
  let requestedUrl = candidateUrls[0]!;
  for (const url of candidateUrls) {
    tried.push(url);
    let attempt = await fetchHeadOrGet(url);
    if (!attempt) {
      attempt = await fetchGet(url);
    }
    if (attempt) {
      res = attempt;
      requestedUrl = url;
      break;
    }
  }

  const finalUrl = res ? res.url || requestedUrl : requestedUrl;

  if (!res) {
    return {
      findings: [
        {
          id: "headers-unreachable",
          category: "headers",
          severity: "medium",
          title: "Site yanıtı alınamadı",
          detail:
            "HTTPS/HTTP ile apex ve www adresleri denendi; yanıt alınamadı veya zaman aşımı. Güvenlik başlıkları değerlendirilemedi.",
        },
      ],
      raw: { tried, error: "fetch_failed" },
    };
  }

  if (res.status >= 400) {
    findings.push({
      id: "headers-http-status",
      category: "headers",
      severity: "low",
      title: `Ana sayfa HTTP ${res.status}`,
      detail: `${finalUrl} yanıt verdi ancak başlık analizi sınırlı olabilir.`,
    });
  }

  const h = res.headers;
  const csp = pickHeader(h, ["content-security-policy", "content-security-policy-report-only"]);
  const xfo = pickHeader(h, ["x-frame-options"]);
  const xss = pickHeader(h, ["x-xss-protection"]);
  const xcto = pickHeader(h, ["x-content-type-options"]);
  const sts = pickHeader(h, ["strict-transport-security"]);

  if (!csp) {
    findings.push({
      id: "headers-no-csp",
      category: "headers",
      severity: "high",
      title: "Content-Security-Policy yok",
      detail:
        "CSP tanımlı değil; XSS ve veri enjeksiyonu riskini azaltmak için politika eklenmeli.",
    });
  } else {
    findings.push({
      id: "headers-csp-present",
      category: "headers",
      severity: "info",
      title: "Content-Security-Policy mevcut",
      detail: `İlk direktifler: ${csp.length > 120 ? `${csp.slice(0, 120)}…` : csp}`,
    });
  }

  if (!xfo) {
    findings.push({
      id: "headers-no-xfo",
      category: "headers",
      severity: "medium",
      title: "X-Frame-Options yok",
      detail: "Clickjacking riskini azaltmak için DENY veya SAMEORIGIN kullanılmalı.",
    });
  } else {
    findings.push({
      id: "headers-xfo-present",
      category: "headers",
      severity: "info",
      title: "X-Frame-Options mevcut",
      detail: xfo,
    });
  }

  if (!xss) {
    findings.push({
      id: "headers-no-xss",
      category: "headers",
      severity: "low",
      title: "X-XSS-Protection başlığı yok",
      detail:
        "Başlık eski tarayıcılar için kullanılırdı; asıl koruma CSP ile sağlanır ancak tutarlılık için eklenebilir.",
    });
  } else {
    findings.push({
      id: "headers-xss-present",
      category: "headers",
      severity: "info",
      title: "X-XSS-Protection mevcut",
      detail: xss,
    });
  }

  if (!xcto) {
    findings.push({
      id: "headers-no-xcto",
      category: "headers",
      severity: "low",
      title: "X-Content-Type-Options yok",
      detail: "nosniff ile MIME sniffing azaltılmalı.",
    });
  } else {
    findings.push({
      id: "headers-xcto-present",
      category: "headers",
      severity: "info",
      title: "X-Content-Type-Options mevcut",
      detail: xcto,
    });
  }

  if (finalUrl.startsWith("https://") && !sts) {
    findings.push({
      id: "headers-no-hsts",
      category: "headers",
      severity: "medium",
      title: "Strict-Transport-Security (HSTS) yok",
      detail: "HTTPS oturumlarını sabitlemek için HSTS önerilir.",
    });
  } else if (sts) {
    findings.push({
      id: "headers-hsts-present",
      category: "headers",
      severity: "info",
      title: "HSTS mevcut",
      detail: sts.length > 100 ? `${sts.slice(0, 100)}…` : sts,
    });
  }

  return {
    findings,
    raw: {
      finalUrl: res.url || finalUrl,
      status: res.status,
      present: {
        csp: Boolean(csp),
        xFrameOptions: Boolean(xfo),
        xXssProtection: Boolean(xss),
        xContentTypeOptions: Boolean(xcto),
        strictTransportSecurity: Boolean(sts),
      },
    },
  };
}
