import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "vietnamese"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "vietnamese"] });
// Serif mềm, có cá tính — cho tiêu đề, gợi chất thủ công/dân gian
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin", "vietnamese"], axes: ["SOFT", "opsz"] });

export const metadata: Metadata = {
  title: { default: "Folkify — Học nhạc cụ dân tộc", template: "%s · Folkify" },
  description: "Học đàn tranh, đàn bầu, đàn nhị, đàn tỳ bà, sáo trúc qua video, câu hỏi ôn tập và AI chấm điểm.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f6ef" },
    { media: "(prefers-color-scheme: dark)", color: "#10201a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
