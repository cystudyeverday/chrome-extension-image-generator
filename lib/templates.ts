import { drawImageInBox, drawWrappedText, fillRoundedRect, setFont, shade } from "@/lib/canvas-utils";
import type { ExportSize, Template, TemplateRenderArgs } from "@/lib/types";

export const exportSizes: ExportSize[] = [
  { id: "store-large", label: "Chrome Store Large", width: 1280, height: 800, useCase: "商店详情页主宣传图" },
  { id: "store-marquee", label: "Chrome Store Marquee", width: 1400, height: 560, useCase: "商店横幅宣传图" },
  { id: "store-small", label: "Chrome Store Small", width: 440, height: 280, useCase: "商店小尺寸素材" },
  { id: "square", label: "Social Square", width: 1080, height: 1080, useCase: "社媒 1:1 封面" },
  { id: "portrait", label: "Social Portrait", width: 1080, height: 1350, useCase: "社媒 4:5 信息流" },
  { id: "wide", label: "Wide Cover", width: 1920, height: 1080, useCase: "YouTube / 横版封面" },
  { id: "xhs", label: "Xiaohongshu Cover", width: 1242, height: 1660, useCase: "小红书 3:4 封面" },
  { id: "ad-landscape", label: "Ad Landscape", width: 1200, height: 628, useCase: "广告横版素材" },
  { id: "ad-vertical", label: "Ad Vertical", width: 1080, height: 1920, useCase: "广告竖版素材" },
  { id: "ad-box", label: "Ad Box", width: 300, height: 250, useCase: "展示广告矩形素材" }
];

const sizesById = Object.fromEntries(exportSizes.map((size) => [size.id, size]));

function pickSizes(ids: string[]) {
  return ids.map((id) => sizesById[id]).filter(Boolean);
}

function drawBase(ctx: CanvasRenderingContext2D, width: number, height: number, color: string) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, shade(color, 34));
  gradient.addColorStop(0.55, color);
  gradient.addColorStop(1, shade(color, -42));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawImageCard(args: TemplateRenderArgs, x: number, y: number, width: number, height: number, radius: number) {
  const { ctx, image, data } = args;
  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.22)";
  ctx.shadowBlur = Math.max(18, width * 0.03);
  ctx.shadowOffsetY = Math.max(14, height * 0.04);
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  fillRoundedRect(ctx, x, y, width, height, radius);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x + 10, y + 10, width - 20, height - 20, Math.max(8, radius - 8));
  ctx.clip();
  drawImageInBox(ctx, image, x + 10, y + 10, width - 20, height - 20, data.fitMode);
  ctx.restore();
}

function chromeStoreHero(args: TemplateRenderArgs) {
  const { ctx, data, size } = args;
  const { width, height } = size;
  drawBase(ctx, width, height, data.themeColor);

  const padding = width * 0.07;
  const isWide = width / height > 1.7;
  const imageWidth = isWide ? width * 0.45 : width * 0.48;
  const imageHeight = height * 0.68;
  const imageX = width - padding - imageWidth;
  const imageY = (height - imageHeight) / 2;

  ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
  fillRoundedRect(ctx, padding, padding, width - padding * 2, height - padding * 2, Math.min(48, width * 0.04));

  ctx.fillStyle = "#ffffff";
  setFont(ctx, 800, Math.max(34, width * 0.055));
  drawWrappedText(ctx, data.title || "Launch faster with templates", padding * 1.35, height * 0.28, width * 0.42, width * 0.065, 3);

  ctx.globalAlpha = 0.9;
  setFont(ctx, 500, Math.max(18, width * 0.022));
  drawWrappedText(ctx, data.subtitle || "Turn one screenshot into every Chrome Store asset you need.", padding * 1.35, height * 0.55, width * 0.4, width * 0.032, 2);
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#ffffff";
  fillRoundedRect(ctx, padding * 1.35, height * 0.72, Math.max(120, width * 0.22), Math.max(38, height * 0.075), 999);
  ctx.fillStyle = data.themeColor;
  setFont(ctx, 800, Math.max(16, width * 0.018));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(data.badge || "CHROME STORE READY", padding * 1.35 + Math.max(120, width * 0.22) / 2, height * 0.72 + Math.max(38, height * 0.075) / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  drawImageCard(args, imageX, imageY, imageWidth, imageHeight, Math.min(36, width * 0.025));
}

function xiaohongshuCover(args: TemplateRenderArgs) {
  const { ctx, data, size } = args;
  const { width, height } = size;
  ctx.fillStyle = "#fff7f7";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = data.themeColor;
  fillRoundedRect(ctx, width * 0.06, height * 0.05, width * 0.88, height * 0.9, width * 0.06);

  drawImageCard(args, width * 0.12, height * 0.12, width * 0.76, height * 0.42, width * 0.045);

  ctx.fillStyle = "#ffffff";
  setFont(ctx, 900, Math.max(44, width * 0.075));
  drawWrappedText(ctx, data.title || "3 steps to better visuals", width * 0.14, height * 0.64, width * 0.72, width * 0.095, 3);

  ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
  setFont(ctx, 600, Math.max(22, width * 0.033));
  drawWrappedText(ctx, data.subtitle || "Upload once, generate covers for every channel.", width * 0.14, height * 0.84, width * 0.7, width * 0.044, 2);

  ctx.fillStyle = "#ffffff";
  fillRoundedRect(ctx, width * 0.14, height * 0.07, width * 0.34, height * 0.045, 999);
  ctx.fillStyle = data.themeColor;
  setFont(ctx, 800, Math.max(16, width * 0.02));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(data.badge || "TEMPLATEPIC", width * 0.31, height * 0.092);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function productPromo(args: TemplateRenderArgs) {
  const { ctx, data, size } = args;
  const { width, height } = size;
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = shade(data.themeColor, 12);
  fillRoundedRect(ctx, width * 0.06, height * 0.08, width * 0.88, height * 0.84, width * 0.045);

  drawImageCard(args, width * 0.1, height * 0.18, width * 0.42, height * 0.62, width * 0.035);

  ctx.fillStyle = "#ffffff";
  setFont(ctx, 900, Math.max(36, width * 0.06));
  drawWrappedText(ctx, data.title || "Limited time deal", width * 0.58, height * 0.28, width * 0.3, width * 0.068, 3);

  ctx.fillStyle = "#fef3c7";
  fillRoundedRect(ctx, width * 0.58, height * 0.54, width * 0.28, height * 0.12, width * 0.035);
  ctx.fillStyle = "#92400e";
  setFont(ctx, 900, Math.max(28, width * 0.045));
  ctx.textBaseline = "middle";
  ctx.fillText(data.price || "$29", width * 0.61, height * 0.6);
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
  setFont(ctx, 600, Math.max(18, width * 0.023));
  drawWrappedText(ctx, data.subtitle || "Fast local generation for your next campaign.", width * 0.58, height * 0.73, width * 0.3, width * 0.032, 2);
}

function minimalPoster(args: TemplateRenderArgs) {
  const { ctx, data, size } = args;
  const { width, height } = size;
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = data.themeColor;
  fillRoundedRect(ctx, width * 0.08, height * 0.08, width * 0.06, height * 0.06, width * 0.015);

  ctx.fillStyle = "#0f172a";
  setFont(ctx, 900, Math.max(42, width * 0.065));
  drawWrappedText(ctx, data.title || "Make assets in minutes", width * 0.08, height * 0.24, width * 0.58, width * 0.078, 3);

  ctx.fillStyle = "#475569";
  setFont(ctx, 500, Math.max(20, width * 0.024));
  drawWrappedText(ctx, data.subtitle || "A quiet, clean template for polished launch materials.", width * 0.08, height * 0.52, width * 0.48, width * 0.034, 3);

  drawImageCard(args, width * 0.48, height * 0.2, width * 0.42, height * 0.62, width * 0.035);
}

function gradientAd(args: TemplateRenderArgs) {
  const { ctx, data, size } = args;
  const { width, height } = size;
  drawBase(ctx, width, height, data.themeColor);

  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  ctx.beginPath();
  ctx.arc(width * 0.84, height * 0.18, width * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(width * 0.18, height * 0.86, width * 0.28, 0, Math.PI * 2);
  ctx.fill();

  drawImageCard(args, width * 0.52, height * 0.18, width * 0.36, height * 0.58, width * 0.035);

  ctx.fillStyle = "#ffffff";
  setFont(ctx, 900, Math.max(38, width * 0.06));
  drawWrappedText(ctx, data.title || "Create more ads from one image", width * 0.1, height * 0.27, width * 0.36, width * 0.071, 3);

  ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
  setFont(ctx, 600, Math.max(18, width * 0.023));
  drawWrappedText(ctx, data.subtitle || "Batch export platform-ready PNGs locally.", width * 0.1, height * 0.58, width * 0.34, width * 0.032, 2);

  ctx.fillStyle = "#ffffff";
  fillRoundedRect(ctx, width * 0.1, height * 0.72, width * 0.24, height * 0.09, 999);
  ctx.fillStyle = data.themeColor;
  setFont(ctx, 900, Math.max(16, width * 0.02));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(data.cta || "Generate now", width * 0.22, height * 0.765);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

export const templates: Template[] = [
  {
    id: "chrome-store-hero",
    name: "Chrome Store Hero",
    description: "适合扩展上架宣传图，强调截图和标题。",
    category: "store",
    fields: ["title", "subtitle", "badge"],
    sizes: pickSizes(["store-large", "store-marquee", "store-small"]),
    render: chromeStoreHero
  },
  {
    id: "xiaohongshu-cover",
    name: "小红书封面",
    description: "大标题、标签和封面图组合，适合内容平台。",
    category: "social",
    fields: ["title", "subtitle", "badge"],
    sizes: pickSizes(["xhs", "portrait", "square"]),
    render: xiaohongshuCover
  },
  {
    id: "product-promo",
    name: "商品促销图",
    description: "商品图、价格和卖点排版，适合促销素材。",
    category: "commerce",
    fields: ["title", "subtitle", "price", "badge"],
    sizes: pickSizes(["square", "portrait", "ad-box"]),
    render: productPromo
  },
  {
    id: "minimal-poster",
    name: "极简海报",
    description: "大留白和清爽文字，适合产品发布。",
    category: "poster",
    fields: ["title", "subtitle"],
    sizes: pickSizes(["wide", "square", "portrait"]),
    render: minimalPoster
  },
  {
    id: "gradient-ad",
    name: "渐变广告图",
    description: "渐变背景、CTA 和主视觉，适合广告投放测试。",
    category: "ads",
    fields: ["title", "subtitle", "cta", "badge"],
    sizes: pickSizes(["ad-landscape", "ad-vertical", "square"]),
    render: gradientAd
  }
];

export const defaultTemplate = templates[0];
