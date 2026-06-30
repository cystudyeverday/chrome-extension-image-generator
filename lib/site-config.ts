const fallbackSiteUrl = "https://www.easyimagegen.work";

function normalizeSiteUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export const siteConfig = {
  url: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? fallbackSiteUrl),
  name: "Chrome Store Image Generator",
  title: "Chrome Store Image Generator",
  description:
    "Create Chrome Web Store promotional images from one screenshot with local-first templates, live previews, and one-click PNG downloads.",
  keywords: [
    "Chrome Web Store images",
    "Chrome extension image generator",
    "Chrome Store promotional image generator",
    "Chrome extension promo image maker",
    "Chrome Web Store screenshot generator",
    "browser extension marketing assets",
    "promotional image templates",
    "Chrome extension listing assets"
  ]
};
