import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Path,
  Circle,
} from "@react-pdf/renderer";
import type { Finding, FindingSeverity } from "@/types/scan";
import { INFO_POSITIVE_SUMMARY_ID, prepareFindingsForDisplay } from "@/lib/findings-display";
import { getFindingGuidance } from "@/lib/findings-guidance";
import { registerPdfFonts } from "@/lib/pdf/register-fonts";

registerPdfFonts();

const colors = {
  slate900: "#0f172a",
  slate600: "#475569",
  slate500: "#64748b",
  slate200: "#e2e8f0",
  slate300: "#cbd5e1",
  slate100: "#f1f5f9",
  white: "#ffffff",
  high: "#dc2626",
  medium: "#ea580c",
  low: "#ca8a04",
  info: "#64748b",
  green: "#16a34a",
  amber: "#d97706",
  red: "#dc2626",
};

function scoreBandColor(score: number): string {
  if (score <= 40) return colors.red;
  if (score <= 70) return colors.amber;
  return colors.green;
}

function categoryLabel(c: Finding["category"]): string {
  const map: Record<Finding["category"], string> = {
    dns: "DNS",
    ssl: "SSL",
    shodan: "Arşiv",
    hibp: "Veri ihlali",
    headers: "HTTP başlıkları",
    robots: "robots / sitemap",
    whois: "WHOIS",
    general: "Genel",
  };
  return map[c];
}

function severityLabelTr(s: FindingSeverity): string {
  const map: Record<FindingSeverity, string> = {
    high: "Yüksek",
    medium: "Orta",
    low: "Düşük",
    info: "Bilgi",
  };
  return map[s];
}

function severityColor(s: FindingSeverity): string {
  switch (s) {
    case "high":
      return colors.high;
    case "medium":
      return colors.medium;
    case "low":
      return colors.low;
    default:
      return colors.info;
  }
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingHorizontal: 40,
    paddingBottom: 48,
    fontSize: 10,
    fontFamily: "NotoSans",
    color: colors.slate900,
    backgroundColor: colors.white,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.slate200,
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandIcon: {
    marginRight: 10,
  },
  brandName: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.slate900,
    letterSpacing: -0.5,
  },
  brandTag: {
    fontSize: 9,
    color: colors.slate500,
    marginTop: 2,
  },
  metaRow: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  metaBoxSpaced: {
    marginRight: 8,
    marginBottom: 8,
  },
  metaBox: {
    backgroundColor: colors.slate100,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 140,
  },
  metaLabel: { fontSize: 8, color: colors.slate500, marginBottom: 2 },
  metaValue: { fontSize: 11, fontWeight: 700 },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
  },
  scoreCircleWrap: { width: 120, height: 120, marginRight: 28 },
  scoreLegend: { flex: 1 },
  scoreTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 6,
    color: colors.slate900,
  },
  scoreSub: { fontSize: 10, color: colors.slate600, lineHeight: 1.4 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 10,
    color: colors.slate900,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: colors.slate900,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  th: { fontSize: 9, fontWeight: 700, color: colors.white },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.white,
  },
  colCat: { width: "18%" },
  colSev: { width: "16%" },
  colDesc: { width: "66%" },
  sevBadge: {
    fontSize: 8,
    fontWeight: 700,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  descTitle: { fontSize: 9, fontWeight: 700, marginBottom: 3 },
  descBody: { fontSize: 9, color: colors.slate600, lineHeight: 1.35 },
  guBox: {
    marginTop: 6,
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  guFixBox: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  guRiskBox: {
    marginTop: 4,
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
  },
  guLabel: { fontSize: 8, fontWeight: 700, marginBottom: 2 },
  guFixLabel: { color: "#047857" },
  guRiskLabel: { color: "#be123c" },
  guText: { fontSize: 8, color: colors.slate600, lineHeight: 1.35 },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { fontSize: 8, color: colors.slate500 },
  footerAccent: {
    width: 40,
    height: 3,
    backgroundColor: colors.slate900,
    borderRadius: 2,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerRule: {
    width: 32,
    height: 1,
    backgroundColor: colors.slate300,
    marginRight: 8,
  },
});

function HeaderLogo() {
  return (
    <View style={styles.brandIcon}>
      <Svg width={36} height={36} viewBox="0 0 24 24">
      <Path
        d="M12 2L4 5v6.09c0 4.52 2.98 8.69 7 9.91 4.02-1.22 7-5.39 7-9.91V5l-8-3zm0 2.18l6 2.25v4.66c0 3.45-2.24 6.64-6 7.78-3.76-1.14-6-4.33-6-7.78V6.43l6-2.25z"
        fill={colors.slate900}
      />
      <Path
        d="M11 14.17l-2.83-2.83-1.41 1.41L11 17 17.59 10.41 16.18 9"
        fill={colors.green}
      />
      </Svg>
    </View>
  );
}

function ScoreRingPdf({ score }: { score: number }) {
  const cx = 60;
  const cy = 60;
  const r = 48;
  const stroke = 10;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const dash = c * pct;
  const band = scoreBandColor(score);

  return (
    <View style={styles.scoreCircleWrap}>
      <Svg width={120} height={120} viewBox="0 0 120 120">
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={colors.slate200}
          strokeWidth={stroke}
        />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={band}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: 700, color: band }}>{score}</Text>
        <Text style={{ fontSize: 8, color: colors.slate500, marginTop: 2 }}>/ 100</Text>
      </View>
    </View>
  );
}

export function ScanReportPdf({
  domain,
  score,
  findings,
  generatedAt,
}: {
  domain: string;
  score: number;
  findings: Finding[];
  generatedAt: string;
}) {
  const formattedDate = new Date(generatedAt).toLocaleString("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const rows = prepareFindingsForDisplay(findings);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.brandBlock}>
            <HeaderLogo />
            <View>
              <Text style={styles.brandName}>SecurityScore</Text>
              <Text style={styles.brandTag}>Siber güvenlik risk raporu</Text>
            </View>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.metaBox, styles.metaBoxSpaced]}>
            <Text style={styles.metaLabel}>Hedef alan adı</Text>
            <Text style={styles.metaValue}>{domain}</Text>
          </View>
          <View style={[styles.metaBox, styles.metaBoxSpaced]}>
            <Text style={styles.metaLabel}>Rapor tarihi</Text>
            <Text style={styles.metaValue}>{formattedDate}</Text>
          </View>
        </View>

        <View style={styles.scoreRow}>
          <ScoreRingPdf score={score} />
          <View style={styles.scoreLegend}>
            <Text style={styles.scoreTitle}>Genel güvenlik skoru</Text>
            <Text style={styles.scoreSub}>
              Skor; DNS, SSL/TLS, HTTP güvenlik başlıkları ve yapılandırılmışsa veri ihlali sinyallerinden türetilmiştir.
              0–40 aralığı yüksek risk, 41–70 orta, 71–100 daha olumlu olarak yorumlanabilir.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Bulgular özeti</Text>
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.colCat]}>Kategori</Text>
            <Text style={[styles.th, styles.colSev]}>Önem</Text>
            <Text style={[styles.th, styles.colDesc]}>Açıklama</Text>
          </View>
          {rows.map((f) => {
            const bg =
              f.severity === "high"
                ? "#fef2f2"
                : f.severity === "medium"
                  ? "#fff7ed"
                  : f.severity === "low"
                    ? "#fefce8"
                    : "#f8fafc";
            const guide = getFindingGuidance(f);
            const isPositiveSummary = f.id === INFO_POSITIVE_SUMMARY_ID;
            return (
              <View key={f.id} style={[styles.tableRow, { backgroundColor: bg }]}>
                <View style={styles.colCat}>
                  <Text style={{ fontSize: 9, fontWeight: 600 }}>{categoryLabel(f.category)}</Text>
                </View>
                <View style={styles.colSev}>
                  <View
                    style={[
                      styles.sevBadge,
                      {
                        backgroundColor:
                          f.severity === "high"
                            ? "#fee2e2"
                            : f.severity === "medium"
                              ? "#ffedd5"
                              : f.severity === "low"
                                ? "#fef9c3"
                                : "#f1f5f9",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        color: severityColor(f.severity),
                      }}
                    >
                      {severityLabelTr(f.severity)}
                    </Text>
                  </View>
                </View>
                <View style={styles.colDesc}>
                  <Text style={styles.descTitle}>{f.title}</Text>
                  <Text style={styles.descBody}>{f.detail}</Text>
                  {!isPositiveSummary ? (
                    <>
                      <View style={[styles.guBox, styles.guFixBox]}>
                        <Text style={[styles.guLabel, styles.guFixLabel]}>✅ Nasıl düzeltilir?</Text>
                        <Text style={styles.guText}>{guide.remediation}</Text>
                      </View>
                      <View style={[styles.guBox, styles.guRiskBox]}>
                        <Text style={[styles.guLabel, styles.guRiskLabel]}>⚠️ Düzeltmezseniz ne olur?</Text>
                        <Text style={styles.guText}>{guide.risk}</Text>
                      </View>
                    </>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>SecurityScore tarafından oluşturuldu</Text>
          <View style={styles.footerRight}>
            <View style={styles.footerRule} />
            <View style={styles.footerAccent} />
          </View>
        </View>
      </Page>
    </Document>
  );
}
