import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StoreShot - Chrome Store Image Generator",
  description: "Generate Chrome Web Store promotional images locally with templates."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
