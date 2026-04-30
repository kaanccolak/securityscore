import type { Finding, ScanRawPayload } from "@/types/scan";
import { isTimeoutError, SCANNER_TIMEOUT_MS, withTimeout } from "@/lib/scanner-timeout";
import type { DnsScanResult } from "./dns";
import { scanDns } from "./dns";
import type { HibpScanResult } from "./hibp";
import { scanHibp } from "./hibp";
import type { HttpHeadersScanResult } from "./http-headers";
import { scanHttpSecurityHeaders } from "./http-headers";
import type { RobotsScanResult } from "./robots";
import { scanRobotsAndSitemap } from "./robots";
import type { SslTlsScanResult } from "./ssl-check";
import { scanSslTls } from "./ssl-check";
import type { WhoapiScanResult } from "./whoapi";
import { scanWhoapiDomain } from "./whoapi";

export interface OrchestratorResult {
  findings: Finding[];
  raw: ScanRawPayload;
}

function dnsFallback(err: unknown): DnsScanResult {
  const timeout = isTimeoutError(err);
  const msg = err instanceof Error ? err.message : String(err);
  return {
    findings: [
      {
        id: timeout ? "dns-scan-timeout" : "dns-scan-error",
        category: "dns",
        severity: "low",
        title: timeout ? "DNS taraması zaman aşımı" : "DNS taraması hatası",
        detail: timeout
          ? `DNS modülü ${SCANNER_TIMEOUT_MS / 1000} saniyede tamamlanamadı; bu bölüm atlandı.`
          : msg,
      },
    ],
    raw: { a: [], mx: [], txt: [], dmarc: null, spf: null, skipped: true, error: msg },
  };
}

function sslFallback(err: unknown): SslTlsScanResult {
  const timeout = isTimeoutError(err);
  const msg = err instanceof Error ? err.message : String(err);
  return {
    findings: [
      {
        id: timeout ? "ssl-scan-timeout" : "ssl-scan-error",
        category: "ssl",
        severity: "low",
        title: timeout ? "TLS taraması zaman aşımı" : "TLS taraması kesildi",
        detail: timeout
          ? `TLS modülü ${SCANNER_TIMEOUT_MS / 1000} saniyede tamamlanamadı; bu bölüm atlandı.`
          : msg,
      },
    ],
    raw: { skipped: true, error: msg },
  };
}

function hibpFallback(err: unknown): HibpScanResult {
  const timeout = isTimeoutError(err);
  const msg = err instanceof Error ? err.message : String(err);
  return {
    findings: [
      {
        id: timeout ? "hibp-scan-timeout" : "hibp-scan-error",
        category: "hibp",
        severity: "low",
        title: timeout ? "Veri ihlali kontrolü zaman aşımı" : "Veri ihlali kontrolü hatası",
        detail: timeout
          ? `HIBP modülü ${SCANNER_TIMEOUT_MS / 1000} saniyede tamamlanamadı; bu bölüm atlandı.`
          : msg,
      },
    ],
    raw: { skipped: true, error: msg },
  };
}

function headersFallback(err: unknown): HttpHeadersScanResult {
  const timeout = isTimeoutError(err);
  const msg = err instanceof Error ? err.message : String(err);
  return {
    findings: [
      {
        id: timeout ? "headers-scan-timeout" : "headers-scan-error",
        category: "headers",
        severity: "low",
        title: timeout ? "HTTP başlık taraması zaman aşımı" : "HTTP başlık taraması hatası",
        detail: timeout
          ? `Başlık modülü ${SCANNER_TIMEOUT_MS / 1000} saniyede tamamlanamadı; bu bölüm atlandı.`
          : msg,
      },
    ],
    raw: { skipped: true, error: msg },
  };
}

function robotsFallback(err: unknown): RobotsScanResult {
  const timeout = isTimeoutError(err);
  const msg = err instanceof Error ? err.message : String(err);
  return {
    findings: [
      {
        id: timeout ? "robots-scan-timeout" : "robots-scan-error",
        category: "robots",
        severity: "low",
        title: timeout ? "robots.txt taraması zaman aşımı" : "robots.txt taraması hatası",
        detail: timeout
          ? `robots modülü ${SCANNER_TIMEOUT_MS / 1000} saniyede tamamlanamadı; bu bölüm atlandı.`
          : msg,
      },
    ],
    raw: { skipped: true, error: msg },
  };
}

function whoisFallback(err: unknown): WhoapiScanResult {
  const timeout = isTimeoutError(err);
  const msg = err instanceof Error ? err.message : String(err);
  return {
    findings: [
      {
        id: timeout ? "whois-scan-timeout" : "whois-scan-error",
        category: "whois",
        severity: "low",
        title: timeout ? "WHOIS taraması zaman aşımı" : "WHOIS taraması hatası",
        detail: timeout
          ? `WHOIS modülü ${SCANNER_TIMEOUT_MS / 1000} saniyede tamamlanamadı; bu bölüm atlandı.`
          : msg,
      },
    ],
    raw: { skipped: true, error: msg },
  };
}

async function timedDns(domain: string): Promise<DnsScanResult> {
  try {
    return await withTimeout(scanDns(domain), SCANNER_TIMEOUT_MS);
  } catch (e) {
    return dnsFallback(e);
  }
}

async function timedSsl(domain: string): Promise<SslTlsScanResult> {
  try {
    return await withTimeout(scanSslTls(domain), SCANNER_TIMEOUT_MS);
  } catch (e) {
    return sslFallback(e);
  }
}

async function timedHibp(domain: string): Promise<HibpScanResult> {
  try {
    return await withTimeout(scanHibp(domain), SCANNER_TIMEOUT_MS);
  } catch (e) {
    return hibpFallback(e);
  }
}

async function timedHeaders(domain: string): Promise<HttpHeadersScanResult> {
  try {
    return await withTimeout(scanHttpSecurityHeaders(domain), SCANNER_TIMEOUT_MS);
  } catch (e) {
    return headersFallback(e);
  }
}

async function timedRobots(domain: string): Promise<RobotsScanResult> {
  try {
    return await withTimeout(scanRobotsAndSitemap(domain), SCANNER_TIMEOUT_MS);
  } catch (e) {
    return robotsFallback(e);
  }
}

async function timedWhois(domain: string): Promise<WhoapiScanResult> {
  try {
    return await withTimeout(scanWhoapiDomain(domain), SCANNER_TIMEOUT_MS);
  } catch (e) {
    return whoisFallback(e);
  }
}

/**
 * Tüm tarayıcıları paralel çalıştırır (Promise.all).
 * Her modül en fazla SCANNER_TIMEOUT_MS ile sınırlıdır; aşımda modül atlanır ve düşük önemli bulgu üretilir.
 */
export async function runAllScans(domain: string): Promise<OrchestratorResult> {
  const normalized = domain.trim().toLowerCase();

  const [dns, ssl, hibp, headers, robots, whois] = await Promise.all([
    timedDns(normalized),
    timedSsl(normalized),
    timedHibp(normalized),
    timedHeaders(normalized),
    timedRobots(normalized),
    timedWhois(normalized),
  ]);

  const findings: Finding[] = [
    ...dns.findings,
    ...ssl.findings,
    ...hibp.findings,
    ...headers.findings,
    ...robots.findings,
    ...whois.findings,
  ];

  const raw: ScanRawPayload = {
    dns: dns.raw,
    sslLabs: ssl.raw,
    httpHeaders: headers.raw,
    ...(hibp.raw !== undefined ? { hibp: hibp.raw } : {}),
    ...(robots.raw !== undefined ? { robots: robots.raw } : {}),
    ...(whois.raw !== undefined ? { whois: whois.raw } : {}),
  };

  return { findings, raw };
}

export {
  scanDns,
  scanHibp,
  scanHttpSecurityHeaders,
  scanRobotsAndSitemap,
  scanSslTls,
  scanWhoapiDomain,
};
