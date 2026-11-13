import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const vazir = localFont({
  src: "./fonts/Vazirmatn.woff2",
  variable: "--font-vazir",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "صنعت‌هاب | بازار تجمیعی ضایعات مس و برنج",
  description:
    "براده و ضایعات مس و برنج کارگاه‌های تراشکاری، تجمیع‌شده به قیمت عمده‌بار؛ قیمت لحظه‌ای بر پایه دلار آزاد و مس جهانی.",
};

export const viewport: Viewport = { themeColor: "#0a0f1e", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
