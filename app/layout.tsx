import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TemplatePic - Local Image Template Generator",
  description: "Generate multi-size promotional images locally with templates."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
