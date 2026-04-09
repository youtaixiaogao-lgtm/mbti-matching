import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ec4899",
};

export const metadata: Metadata = {
  title: "MBTI Match - 相性の良い人としかマッチしないマッチングアプリ",
  description: "MBTIの16タイプの性格相性に基づいて、本当に合う人だけと出会えるマッチングアプリ。完全無料。スワイプで簡単にいいね、マッチ後すぐチャット。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MBTI Match",
  },
  openGraph: {
    title: "MBTI Match - 相性の良い人としかマッチしない",
    description: "MBTIの性格タイプに基づいて、本当に合う人だけと出会える。完全無料のマッチングアプリ。",
    type: "website",
    locale: "ja_JP",
    siteName: "MBTI Match",
  },
  twitter: {
    card: "summary_large_image",
    title: "MBTI Match - 相性の良い人としかマッチしない",
    description: "MBTIの性格タイプに基づいて、本当に合う人だけと出会える。完全無料。",
  },
  keywords: ["MBTI", "マッチングアプリ", "性格診断", "相性", "恋愛", "出会い", "16タイプ", "INTJ", "ENFP", "INFJ", "ENTP"],
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full bg-gray-50 font-sans">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js');
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
