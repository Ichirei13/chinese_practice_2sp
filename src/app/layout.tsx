import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSansSc = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sc"
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "期末試験対策 — Chinese Learning App",
  description: "中国語期末試験の単語と文法を様々なモードで効率よく学習できるアプリ。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "期末試験",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" data-theme="dark" className={`${inter.variable} ${notoSansSc.variable}`}>
      <body className="antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
