import { Font } from "@react-pdf/renderer";

/**
 * Noto Sans (TTF) — Türkçe glifler. Google Fonts kaynak ağacı (jsDelivr CDN).
 */
const NOTO_REGULAR =
  "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Regular.ttf";
const NOTO_BOLD =
  "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Bold.ttf";

let registered = false;

export function registerPdfFonts(): void {
  if (registered) return;
  Font.register({
    family: "NotoSans",
    fonts: [
      { src: NOTO_REGULAR, fontWeight: 400 },
      { src: NOTO_BOLD, fontWeight: 700 },
    ],
  });
  registered = true;
}
