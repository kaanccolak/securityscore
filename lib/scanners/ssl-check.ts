import sslChecker from "ssl-checker";
import type { Finding } from "@/types/scan";

export interface SslTlsScanResult {
  findings: Finding[];
  raw: unknown;
}

const INTERNAL_MS = 6500;

function isDeprecatedTls(protocol: string | undefined): boolean {
  if (!protocol) return false;
  const p = protocol.toLowerCase();
  return p === "tlsv1" || p === "tlsv1.1" || p.includes("tlsv1.0") || p.includes("tlsv1.1");
}

/**
 * Yerel TLS/HTTPS el sıkışması (ssl-checker). SSL Labs API’sinden çok daha hızlıdır.
 */
export async function scanSslTls(host: string): Promise<SslTlsScanResult> {
  const findings: Finding[] = [];

  try {
    const result = await sslChecker(host, {
      method: "HEAD",
      timeout: INTERNAL_MS,
      validateSubjectAltName: true,
      warnDays: 30,
      grade: false,
      servername: host,
    });

    if (!result.valid && result.validationError) {
      findings.push({
        id: "ssl-cert-validation",
        category: "ssl",
        severity: "medium",
        title: "Sertifika doğrulama uyarısı",
        detail: result.validationError,
      });
    }

    if (result.daysRemaining < 0) {
      findings.push({
        id: "ssl-cert-expired",
        category: "ssl",
        severity: "high",
        title: "Sertifika süresi dolmuş",
        detail: "Sunucu sertifikası geçerlilik tarihini aştı; tarayıcılar uyarı gösterebilir.",
      });
    } else if (result.expiringSoon) {
      findings.push({
        id: "ssl-cert-expiring-soon",
        category: "ssl",
        severity: "low",
        title: "Sertifika süresi yakında dolacak",
        detail: `Kalan süre yaklaşık ${result.daysRemaining} gün; yenileme planlayın.`,
      });
    }

    if (!result.chainComplete) {
      findings.push({
        id: "ssl-cert-chain",
        category: "ssl",
        severity: "medium",
        title: "Sertifika zinciri eksik",
        detail: "Ara sertifikalar eksik olabilir; bazı istemciler bağlantıyı reddedebilir.",
      });
    }

    if (isDeprecatedTls(result.protocol)) {
      findings.push({
        id: "ssl-protocol-deprecated",
        category: "ssl",
        severity: "medium",
        title: "Eski TLS sürümü",
        detail: `Sunucu ${result.protocol} kullanıyor; TLS 1.2+ önerilir.`,
      });
    }

    if (findings.length === 0) {
      findings.push({
        id: "ssl-grade-good",
        category: "ssl",
        severity: "info",
        title: "TLS / sertifika temel kontrolü",
        detail: `HTTPS sertifikası geçerli; yaklaşık ${result.daysRemaining} gün geçerli. Protokol: ${result.protocol}.`,
      });
    }

    return { findings, raw: result };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      findings: [
        {
          id: "ssl-check-error",
          category: "ssl",
          severity: "low",
          title: "TLS kontrolü tamamlanamadı",
          detail: msg || "Bağlantı veya sertifika okunamadı.",
        },
      ],
      raw: { error: msg },
    };
  }
}
