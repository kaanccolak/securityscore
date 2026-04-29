import type { Finding, FindingSeverity } from "@/types/scan";

/** Web + PDF: birleşik “olumlu” özet kartı */
export const INFO_POSITIVE_SUMMARY_ID = "info-positive-summary";

const HEADER_POSITIVE_MAP: Record<string, string> = {
  "headers-csp-present": "CSP",
  "headers-hsts-present": "HSTS",
  "headers-xfo-present": "X-Frame-Options",
  "headers-xcto-present": "X-Content-Type-Options",
  "headers-xss-present": "X-XSS-Protection",
};

const DNS_POSITIVE_MAP: Record<string, string> = {
  "dns-spf-ok": "SPF",
  "dns-dmarc-ok": "DMARC",
};

const COLLAPSED_IDS = new Set([...Object.keys(HEADER_POSITIVE_MAP), ...Object.keys(DNS_POSITIVE_MAP)]);

const SEVERITY_ORDER: Record<FindingSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
  info: 3,
};

export function sortFindingsBySeverity(findings: Finding[]): Finding[] {
  return [...findings].sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.id.localeCompare(b.id),
  );
}

function buildSummaryDetail(collapsed: Finding[]): string {
  const headerLabels: string[] = [];
  const dnsLabels: string[] = [];
  for (const f of collapsed) {
    const h = HEADER_POSITIVE_MAP[f.id];
    if (h) headerLabels.push(h);
    const d = DNS_POSITIVE_MAP[f.id];
    if (d) dnsLabels.push(d);
  }

  const headerOrder = ["CSP", "HSTS", "X-Frame-Options", "X-Content-Type-Options", "X-XSS-Protection"];
  const orderedHeaders = headerOrder.filter((l) => headerLabels.includes(l));
  const extraHeaders = headerLabels.filter((l) => !headerOrder.includes(l));
  const parts: string[] = [];

  if (orderedHeaders.length > 0 || extraHeaders.length > 0) {
    const list = [...orderedHeaders, ...extraHeaders];
    parts.push(`Güvenlik başlıkları: ${list.join(", ")} tespit edildi.`);
  }

  const dnsUniq = Array.from(new Set(dnsLabels));
  if (dnsUniq.length === 1) {
    parts.push(`E-posta (DNS): ${dnsUniq[0]} kaydı mevcut.`);
  } else if (dnsUniq.length > 1) {
    parts.push(`E-posta (DNS): ${dnsUniq.join(" ve ")} yapılandırması mevcut.`);
  }

  return parts.join(" ");
}

function buildSummaryFinding(collapsed: Finding[]): Finding {
  return {
    id: INFO_POSITIVE_SUMMARY_ID,
    category: "general",
    severity: "info",
    title: "✅ Olumlu yapılandırmalar",
    detail: buildSummaryDetail(collapsed),
  };
}

/**
 * Bulguları önem sırasına göre sıralar (yüksek → orta → düşük → bilgi).
 * Bilgi seviyesindeki “mevcut” başlık bulgularını (CSP/HSTS/… ve SPF/DMARC iyi)
 * tek özet kartında birleştirir; özet listenin sonunda gösterilir.
 */
export function prepareFindingsForDisplay(findings: Finding[]): Finding[] {
  if (findings.length === 0) return [];

  const collapsed = findings.filter((f) => COLLAPSED_IDS.has(f.id));
  const filtered = findings.filter((f) => !COLLAPSED_IDS.has(f.id));
  const sorted = sortFindingsBySeverity(filtered);

  if (collapsed.length === 0) {
    return sorted;
  }

  const summary = buildSummaryFinding(collapsed);
  return [...sorted, summary];
}
