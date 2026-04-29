import type { Finding, ScanRawPayload } from "@/types/scan";
import { scanDns } from "./dns";
import { scanHibp } from "./hibp";
import { scanHttpSecurityHeaders } from "./http-headers";
import { scanRobotsAndSitemap } from "./robots";
import { scanSslLabs } from "./ssl-labs";
import { scanWhoapiDomain } from "./whoapi";

export interface OrchestratorResult {
  findings: Finding[];
  raw: ScanRawPayload;
}

export async function runAllScans(domain: string): Promise<OrchestratorResult> {
  const normalized = domain.trim().toLowerCase();

  const [dns, ssl, hibp, headers, robots, whois] = await Promise.all([
    scanDns(normalized),
    scanSslLabs(normalized),
    scanHibp(normalized),
    scanHttpSecurityHeaders(normalized),
    scanRobotsAndSitemap(normalized),
    scanWhoapiDomain(normalized),
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
  scanSslLabs,
  scanWhoapiDomain,
};
