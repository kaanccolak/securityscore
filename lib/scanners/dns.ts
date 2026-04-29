import type { Finding } from "@/types/scan";

/**
 * DNS: harici npm paketi yok. Önceden `node:dns/promises` (resolve4/Mx/Txt)
 * kullanılıyordu; sunucu/Vercel resolver’ı bazı alan adlarında eksik/yanlış
 * dönebiliyor. Şu an Google Public DNS JSON (DoH) — API key gerekmez.
 * @see https://developers.google.com/speed/public-dns/docs/doh/json
 */
const GOOGLE_DNS_RESOLVE = "https://dns.google/resolve";

const DNS_TYPE_A = 1;
const DNS_TYPE_AAAA = 28;
const DNS_TYPE_MX = 15;
const DNS_TYPE_TXT = 16;

type GoogleDnsAnswer = { name: string; type: number; TTL: number; data: string };

interface GoogleDnsResponse {
  Status: number;
  Answer?: GoogleDnsAnswer[];
  Comment?: string;
}

function debugGaranti(domain: string): boolean {
  return domain.trim().toLowerCase() === "garanti.com.tr";
}

async function fetchGoogleDns(name: string, type: string): Promise<GoogleDnsResponse> {
  const url = `${GOOGLE_DNS_RESOLVE}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/dns-json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google DNS HTTP ${res.status} ${res.statusText}: ${body.slice(0, 800)}`);
  }
  const json = (await res.json()) as GoogleDnsResponse;
  if (typeof json.Status !== "number") {
    throw new Error("Google DNS: geçersiz JSON (Status yok)");
  }
  return json;
}

/** 0 = NOERROR, 3 = NXDOMAIN (kayıt yok, hata değil) */
function isResolvableStatus(status: number): boolean {
  return status === 0 || status === 3;
}

function warnDnsStatus(name: string, type: string, j: GoogleDnsResponse): void {
  if (isResolvableStatus(j.Status)) return;
  console.error(
    `[dns] Google DNS beklenmeyen Status=${j.Status} name=${name} type=${type}`,
    j.Comment ?? "",
  );
}

function decodeDnsPresentation(data: string): string {
  return data.replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 10)));
}

function normalizeTxtRecord(data: string): string {
  let s = data.trim();
  if (s.startsWith('"') && s.endsWith('"')) {
    s = s.slice(1, -1).replace(/""/g, "");
  }
  return s;
}

function answersOfType(j: GoogleDnsResponse, rrType: number): string[] {
  if (!j.Answer?.length) return [];
  return j.Answer.filter((a) => a.type === rrType).map((a) => a.data.trim());
}

function parseMxRecords(j: GoogleDnsResponse): string[] {
  const rows: string[] = [];
  if (!j.Answer?.length) return rows;
  for (const a of j.Answer) {
    if (a.type !== DNS_TYPE_MX) continue;
    const d = decodeDnsPresentation(a.data.trim());
    const m = /^(\d+)\s+(.+)$/.exec(d);
    if (m) {
      const host = m[2].replace(/\s+$/, "").replace(/\.$/, "");
      rows.push(`${m[1]} ${host}`);
    }
  }
  return rows;
}

function parseTxtRecords(j: GoogleDnsResponse): string[] {
  if (!j.Answer?.length) return [];
  return j.Answer.filter((a) => a.type === DNS_TYPE_TXT).map((a) => normalizeTxtRecord(a.data));
}

export interface DnsScanResult {
  findings: Finding[];
  raw: {
    a: string[];
    mx: string[];
    txt: string[];
    dmarc: string | null;
    spf: string | null;
  };
}

function txtIncludesSpf(records: string[]): string | null {
  const spf = records.find((t) => t.toLowerCase().startsWith("v=spf1"));
  return spf ?? null;
}

/** A + AAAA birleşik liste (IPv4 ve IPv6) */
async function resolveAaaa(domain: string): Promise<string[]> {
  const debug = debugGaranti(domain);
  const aUrl = `${GOOGLE_DNS_RESOLVE}?name=${encodeURIComponent(domain)}&type=A`;
  if (debug) {
    console.log(`[dns] garanti.com.tr A sorgusu (Google DoH): ${aUrl}`);
  }

  const ipv4: string[] = [];
  const ipv6: string[] = [];

  try {
    const j4 = await fetchGoogleDns(domain, "A");
    warnDnsStatus(domain, "A", j4);
    if (debug) {
      console.log(
        `[dns] garanti.com.tr A yanıt: Status=${j4.Status}, kayıt sayısı=${j4.Answer?.length ?? 0}`,
      );
    }
    if (isResolvableStatus(j4.Status)) {
      ipv4.push(...answersOfType(j4, DNS_TYPE_A));
    }
  } catch (err) {
    if (debug) {
      console.error(
        "[dns] garanti.com.tr A sorgusu hata:",
        err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err),
      );
    } else {
      console.error(
        `[dns] A sorgusu başarısız (${domain}):`,
        err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : err,
      );
    }
  }

  try {
    const j6 = await fetchGoogleDns(domain, "AAAA");
    warnDnsStatus(domain, "AAAA", j6);
    if (isResolvableStatus(j6.Status)) {
      ipv6.push(...answersOfType(j6, DNS_TYPE_AAAA));
    }
  } catch (err) {
    console.error(
      `[dns] AAAA sorgusu başarısız (${domain}):`,
      err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : err,
    );
  }

  return [...ipv4, ...ipv6];
}

export async function scanDns(domain: string): Promise<DnsScanResult> {
  const findings: Finding[] = [];
  const raw = {
    a: [] as string[],
    mx: [] as string[],
    txt: [] as string[],
    dmarc: null as string | null,
    spf: null as string | null,
  };

  raw.a = await resolveAaaa(domain);

  if (raw.a.length === 0) {
    findings.push({
      id: "dns-no-a",
      category: "dns",
      severity: "high",
      title: "A/AAAA kaydı bulunamadı",
      detail: "Alan adı için IPv4/IPv6 çözümlemesi alınamadı veya boş.",
    });
  }

  try {
    const jMx = await fetchGoogleDns(domain, "MX");
    warnDnsStatus(domain, "MX", jMx);
    if (isResolvableStatus(jMx.Status)) {
      raw.mx = parseMxRecords(jMx);
    }
  } catch (err) {
    console.error(
      `[dns] MX sorgusu başarısız (${domain}):`,
      err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : err,
    );
    raw.mx = [];
  }

  if (raw.mx.length === 0) {
    findings.push({
      id: "dns-no-mx",
      category: "dns",
      severity: "medium",
      title: "MX kaydı yok",
      detail: "E-posta teslimi için MX kaydı bulunamadı.",
    });
  }

  try {
    const jTxt = await fetchGoogleDns(domain, "TXT");
    warnDnsStatus(domain, "TXT", jTxt);
    if (isResolvableStatus(jTxt.Status)) {
      raw.txt = parseTxtRecords(jTxt);
    }
  } catch (err) {
    console.error(
      `[dns] TXT sorgusu başarısız (${domain}):`,
      err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : err,
    );
    raw.txt = [];
  }

  raw.spf = txtIncludesSpf(raw.txt);
  if (!raw.spf) {
    findings.push({
      id: "dns-no-spf",
      category: "dns",
      severity: "medium",
      title: "SPF kaydı yok",
      detail: "Alan adı kökünde SPF (TXT) kaydı tespit edilmedi.",
    });
  }

  const dmarcName = `_dmarc.${domain}`;
  try {
    const jDmarc = await fetchGoogleDns(dmarcName, "TXT");
    warnDnsStatus(dmarcName, "TXT", jDmarc);
    if (isResolvableStatus(jDmarc.Status)) {
      const dmarcTxt = parseTxtRecords(jDmarc);
      raw.dmarc = dmarcTxt.find((t) => t.toLowerCase().startsWith("v=dmarc1")) ?? null;
    }
  } catch (err) {
    console.error(
      `[dns] DMARC TXT sorgusu başarısız (${dmarcName}):`,
      err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : err,
    );
    raw.dmarc = null;
  }

  if (!raw.dmarc) {
    findings.push({
      id: "dns-no-dmarc",
      category: "dns",
      severity: "high",
      title: "DMARC yok veya geçersiz",
      detail: `_dmarc.${domain} için geçerli bir DMARC TXT kaydı bulunamadı.`,
    });
  } else if (!raw.dmarc.toLowerCase().includes("p=reject") && !raw.dmarc.toLowerCase().includes("p=quarantine")) {
    findings.push({
      id: "dns-dmarc-soft",
      category: "dns",
      severity: "low",
      title: "DMARC politika zayıf",
      detail: "DMARC var ancak p=reject veya p=quarantine kullanılmıyor olabilir.",
    });
  } else {
    findings.push({
      id: "dns-dmarc-ok",
      category: "dns",
      severity: "info",
      title: "DMARC yapılandırılmış",
      detail: "DMARC kaydı tespit edildi.",
    });
  }

  if (raw.spf) {
    findings.push({
      id: "dns-spf-ok",
      category: "dns",
      severity: "info",
      title: "SPF kaydı mevcut",
      detail: "SPF TXT kaydı bulundu.",
    });
  }

  return { findings, raw };
}
