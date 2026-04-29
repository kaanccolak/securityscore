import type { Metadata } from "next";
import localFont from "next/font/local";
import { Noto_Sans } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans",
  display: "swap",
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "SecurityScore — Siber güvenlik skoru",
  description:
    "Şirket alan adları için otomatik güvenlik analizi, skor ve PDF rapor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${notoSans.variable} ${geistSans.variable} ${geistMono.variable} ${notoSans.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
