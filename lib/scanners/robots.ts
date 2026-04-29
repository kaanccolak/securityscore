import type { Finding } from "@/types/scan";

export interface RobotsScanResult {
  findings: Finding[];
  /** Yalnızca hassas yol bulgusu varsa doldurulur. */
  raw?: unknown;
}

const UA = "SecurityScore/1.0 (robots kontrolü)";

/** robots.txt satırlarında hassas yol ipuçları */
const SENSITIVE_PATTERNS: Array<{ id: string; label: string; re: RegExp }> = [
  { id: "git", label: ".git", re: /\.git/i },
  { id: "env", label: ".env / ortam dosyası", re: /\.env/i },
  { id: "backup", label: "yedek", re: /backup|\.bak|\.old|dump|\.sql/i },
  { id: "admin", label: "yönetim", re: /\/admin|wp-admin|phpmyadmin|pma|cpanel|phpinfo/i },
  { id: "internal", label: "iç API / staging", re: /internal|staging|\.svn|\.hg/i },
];

async function fetchText(url: string): Promise<{
  ok: boolean;
  status: number;
  text: string;
  finalUrl: string;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": UA, Accept: "text/plain,text/html,*/*" },
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text, finalUrl: res.url };
  } catch {
    return { ok: false, status: 0, text: "", finalUrl: url };
  } finally {
    clearTimeout(timeout);
  }
}

function parseDisallowPaths(robotsBody: string): string[] {
  const paths: string[] = [];
  for (const line of robotsBody.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = /^disallow:\s*(.*)$/i.exec(t);
    if (m) {
      const p = m[1].trim();
      if (p && p !== "") paths.push(p);
    }
  }
  return paths;
}

/**
 * Yalnızca robots.txt içinde hassas Disallow ipuçları için bulgu üretir.
 * Bilgi amaçlı satırlar (erişilebilir, sitemap vb.) rapora eklenmez.
 */
export async function scanRobotsAndSitemap(domain: string): Promise<RobotsScanResult> {
  const normalized = domain.trim().toLowerCase();
  const findings: Finding[] = [];

  const httpsRobots = `https://${normalized}/robots.txt`;
  let { ok, status, text, finalUrl } = await fetchText(httpsRobots);

  if (!ok && status !== 403 && status !== 401) {
    const httpRobots = `http://${normalized}/robots.txt`;
    const second = await fetchText(httpRobots);
    if (second.status > 0) {
      ok = second.ok;
      status = second.status;
      text = second.text;
      finalUrl = second.finalUrl;
    }
  }

  if (!ok || text.length === 0 || status === 404) {
    return { findings: [] };
  }

  const paths = parseDisallowPaths(text);
  const seen = new Set<string>();

  for (const p of paths) {
    const lower = p.toLowerCase();
    for (const { id, label, re } of SENSITIVE_PATTERNS) {
      if (re.test(p) || re.test(lower)) {
        const key = `${id}:${p}`;
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push({
          id: `robots-sensitive-${id}-${seen.size}`,
          category: "robots",
          severity: "medium",
          title: `robots.txt hassas yol ipucu (${label})`,
          detail: `Disallow: ${p} — Bu yol kamuya açık listelenmiş olabilir; dizin gerçekten varsa sertleştirme gözden geçirilmeli.`,
        });
      }
    }
  }

  if (findings.length === 0) {
    return { findings: [] };
  }

  return {
    findings,
    raw: {
      domain: normalized,
      robotsUrl: finalUrl,
      matchedPaths: paths.filter((p) =>
        SENSITIVE_PATTERNS.some(({ re }) => re.test(p) || re.test(p.toLowerCase())),
      ),
    },
  };
}
