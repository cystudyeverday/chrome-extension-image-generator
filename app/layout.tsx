import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const siteUrl = "https://chrome-extension-images-generator.vercel.app";
const title = "Chrome Store Image Generator";
const description =
  "Generate Chrome Web Store promotional images locally with ready-made templates, live previews, and one-click PNG downloads.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: `%s | ${title}`
  },
  description,
  applicationName: title,
  keywords: [
    "Chrome Web Store images",
    "Chrome extension promo image generator",
    "Chrome Store screenshot generator",
    "browser extension marketing assets",
    "promotional image templates"
  ],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: title,
    type: "website"
  },
  twitter: {
    card: "summary",
    title,
    description
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
