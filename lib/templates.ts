import {
  drawFittedSingleLineText,
  drawFittedTextBlock,
  drawImageInBox,
  fillRoundedRect,
  setFont,
  shade
} from "@/lib/canvas-utils";
import type { ExportSize, Template, TemplateRenderArgs } from "@/lib/types";

export const exportSizes: ExportSize[] = [
  { id: "store-large", label: "Chrome Store Large", width: 1280, height: 800, useCase: "Main listing hero image" },
  { id: "store-marquee", label: "Chrome Store Marquee", width: 1400, height: 560, useCase: "Wide promotional banner" },
  { id: "store-small", label: "Chrome Store Small", width: 440, height: 280, useCase: "Compact promotional image" }
];

const chromeStoreSizes = exportSizes;

const defaultData = {
  title: "Launch faster with Chrome tools",
  subtitle: "Turn one screenshot into polished promotional assets.",
  badge: "CHROME STORE READY",
  cta: "Private by design",
  feature: "One upload, every asset size",
  themeColor: "#2563eb",
  fitMode: "crop" as const
};

function drawGradientBase(ctx: CanvasRenderingContext2D, width: number, height: number, color: string) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, shade(color, 42));
  gradient.addColorStop(0.52, color);
  gradient.addColorStop(1, shade(color, -48));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getImageRatio(image: HTMLImageElement) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;

  if (width <= 0 || height <= 0) {
    return 16 / 10;
  }

  return width / height;
}

function getTemplateSpacing(width: number, height: number) {
  const shortSide = Math.min(width, height);

  return {
    textInset: clamp(shortSide * 0.052, 14, 40),
    gutter: clamp(width * 0.04, 18, 64),
    stackGap: clamp(height * 0.034, 10, 26)
  };
}

function getAdaptiveCardBounds(image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const slotRatio = width / height;
  const imageRatio = getImageRatio(image);
  const maskRatio = clamp(imageRatio, slotRatio * 0.72, slotRatio * 1.45);
  const isWiderThanSlot = maskRatio > slotRatio;
  const cardWidth = isWiderThanSlot ? width : height * maskRatio;
  const cardHeight = isWiderThanSlot ? width / maskRatio : height;

  return {
    x: x + (width - cardWidth) / 2,
    y: y + (height - cardHeight) / 2,
    width: cardWidth,
    height: cardHeight
  };
}

function drawImageCard(args: TemplateRenderArgs, x: number, y: number, width: number, height: number, radius: number) {
  const { ctx, image, data } = args;
  const card = getAdaptiveCardBounds(image, x, y, width, height);
  const inset = Math.max(6, Math.min(10, Math.min(card.width, card.height) * 0.025));
  const innerRadius = Math.max(8, Math.min(radius - inset * 0.8, Math.min(card.width, card.height) * 0.08));
  const outerRadius = Math.min(radius, Math.min(card.width, card.height) * 0.16);

  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.22)";
  ctx.shadowBlur = Math.max(18, card.width * 0.035);
  ctx.shadowOffsetY = Math.max(12, card.height * 0.045);
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  fillRoundedRect(ctx, card.x, card.y, card.width, card.height, outerRadius);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(card.x + inset, card.y + inset, card.width - inset * 2, card.height - inset * 2, innerRadius);
  ctx.clip();
  drawImageInBox(ctx, image, card.x + inset, card.y + inset, card.width - inset * 2, card.height - inset * 2, data.fitMode);
  ctx.restore();
}

function drawBadge(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, height: number, color: string) {
  const label = text.trim();
  const fontSize = Math.max(13, height * 0.34);
  const minFontSize = Math.max(10, fontSize * 0.68);
  const horizontalPadding = height * 0.66;
  setFont(ctx, 800, fontSize);
  const width = Math.min(maxWidth, Math.max(height * 2.45, ctx.measureText(label).width + horizontalPadding * 2));

  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.14)";
  ctx.shadowBlur = Math.max(10, height * 0.22);
  ctx.shadowOffsetY = Math.max(3, height * 0.08);
  ctx.fillStyle = "#ffffff";
  fillRoundedRect(ctx, x, y, width, height, 999);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
  ctx.lineWidth = Math.max(1, height * 0.035);
  ctx.beginPath();
  ctx.roundRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, width - ctx.lineWidth, height - ctx.lineWidth, 999);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  drawFittedSingleLineText(ctx, label, x + width / 2, y + height / 2, width - horizontalPadding * 2, 800, fontSize, minFontSize);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawChromeDots(ctx: CanvasRenderingContext2D, x: number, y: number, dotSize: number) {
  ["#ef4444", "#f59e0b", "#22c55e"].forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + index * dotSize * 1.65, y, dotSize / 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function textWithDefault(value: string | undefined, fallback: string) {
  return value ?? fallback;
}

function drawOptionalFittedTextBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  weight: number,
  maxFontSize: number,
  minFontSize: number,
  maxLines: number,
  lineHeightRatio = 1.16
) {
  if (!text.trim()) {
    return { fontSize: 0, lineHeight: 0, lineCount: 0, height: 0 };
  }

  return drawFittedTextBlock(ctx, text, {
    x,
    y,
    width,
    height,
    weight,
    maxFontSize,
    minFontSize,
    maxLines,
    lineHeightRatio
  });
}

function drawOptionalBadge(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, height: number, color: string) {
  if (!text.trim()) {
    return;
  }

  drawBadge(ctx, text, x, y, maxWidth, height, color);
}

function classicHero(args: TemplateRenderArgs) {
  const { ctx, data, size } = args;
  const { width, height } = size;
  drawGradientBase(ctx, width, height, data.themeColor);

  const padding = width * 0.07;
  const isMarquee = width / height > 2.1;
  const spacing = getTemplateSpacing(width, height);
  const imageWidth = isMarquee ? width * 0.45 : width * 0.48;
  const imageHeight = height * 0.68;
  const imageX = width - padding - imageWidth;
  const imageY = (height - imageHeight) / 2;

  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  fillRoundedRect(ctx, padding, padding, width - padding * 2, height - padding * 2, Math.min(48, width * 0.04));

  const textX = padding + spacing.textInset;
  const textRight = imageX - spacing.gutter;
  const textWidth = clamp(textRight - textX, width * 0.26, width * 0.42);
  const textTop = padding + spacing.textInset;
  const textBottom = height - padding - spacing.textInset;
  const textGap = spacing.stackGap;
  const badgeText = textWithDefault(data.badge, "CHROME STORE READY");
  const badgeHeight = Math.max(width < 700 ? 30 : 38, height * 0.075);
  const hasBadge = badgeText.trim().length > 0;

  ctx.fillStyle = "#ffffff";
  const titleFontSize = isMarquee ? Math.max(34, height * 0.1) : Math.max(32, width * 0.055);
  const titleBlock = drawOptionalFittedTextBlock(
    ctx,
    textWithDefault(data.title, "Launch faster with Chrome tools"),
    textX,
    textTop,
    textWidth,
    isMarquee ? height * 0.25 : height * 0.36,
    850,
    titleFontSize,
    Math.max(20, titleFontSize * 0.62),
    isMarquee ? 2 : 3
  );

  const subtitleFontSize = isMarquee ? Math.max(17, height * 0.04) : Math.max(15, width * 0.021);
  const subtitleY = textTop + titleBlock.height + textGap;
  const subtitleHeight = Math.max(
    subtitleFontSize * 1.45,
    textBottom - subtitleY - (hasBadge ? badgeHeight + textGap : 0)
  );
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = "#ffffff";
  drawOptionalFittedTextBlock(
    ctx,
    textWithDefault(data.subtitle, "Turn one screenshot into polished Chrome Web Store assets."),
    textX,
    subtitleY,
    textWidth,
    subtitleHeight,
    500,
    subtitleFontSize,
    Math.max(12, subtitleFontSize * 0.78),
    2,
    1.32
  );
  ctx.globalAlpha = 1;

  if (hasBadge) {
    drawOptionalBadge(ctx, badgeText, textX, textBottom - badgeHeight, Math.max(112, textWidth), badgeHeight, data.themeColor);
  }
  drawImageCard(args, imageX, imageY, imageWidth, imageHeight, Math.min(36, width * 0.025));
}

function browserFrame(args: TemplateRenderArgs) {
  const { ctx, data, size } = args;
  const { width, height } = size;
  const isMarquee = width / height > 2.1;
  const spacing = getTemplateSpacing(width, height);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);

  const containerX = width * 0.06;
  const containerY = height * 0.08;
  const containerHeight = height * 0.84;
  ctx.fillStyle = data.themeColor;
  fillRoundedRect(ctx, containerX, containerY, width * 0.88, containerHeight, width * 0.04);

  const frameX = width * 0.34;
  const frameY = height * 0.18;
  const frameWidth = width * 0.56;
  const frameHeight = height * 0.62;
  ctx.fillStyle = "#ffffff";
  fillRoundedRect(ctx, frameX, frameY, frameWidth, frameHeight, width * 0.024);
  ctx.fillStyle = "#e2e8f0";
  fillRoundedRect(ctx, frameX + 12, frameY + 12, frameWidth - 24, height * 0.075, width * 0.016);
  drawChromeDots(ctx, frameX + width * 0.035, frameY + height * 0.05, Math.max(9, width * 0.011));
  drawImageCard(args, frameX + 24, frameY + height * 0.11, frameWidth - 48, frameHeight - height * 0.15, width * 0.018);

  const textX = containerX + spacing.textInset;
  const textWidth = clamp(frameX - textX - spacing.gutter, width * 0.18, width * 0.24);
  const textTop = containerY + spacing.textInset;
  const textBottom = containerY + containerHeight - spacing.textInset;
  const textGap = spacing.stackGap;
  ctx.fillStyle = "#ffffff";
  const titleFontSize = isMarquee ? Math.max(31, height * 0.09) : Math.max(31, width * 0.052);
  const titleBlock = drawOptionalFittedTextBlock(
    ctx,
    textWithDefault(data.title, "A smarter browser workflow"),
    textX,
    textTop,
    textWidth,
    height * 0.34,
    900,
    titleFontSize,
    Math.max(18, titleFontSize * 0.6),
    isMarquee ? 2 : 3
  );
  const subtitleFontSize = isMarquee ? Math.max(16, height * 0.038) : Math.max(16, width * 0.019);
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
  drawOptionalFittedTextBlock(
    ctx,
    textWithDefault(data.subtitle, "Show your extension inside a clean Chrome frame."),
    textX,
    textTop + titleBlock.height + textGap,
    textWidth,
    textBottom - (textTop + titleBlock.height + textGap),
    600,
    subtitleFontSize,
    Math.max(12, subtitleFontSize * 0.76),
    isMarquee ? 2 : 3,
    1.3
  );
}

function darkTech(args: TemplateRenderArgs) {
  const { ctx, data, size } = args;
  const { width, height } = size;
  const isMarquee = width / height > 2.1;
  const spacing = getTemplateSpacing(width, height);
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = data.themeColor;
  ctx.lineWidth = Math.max(1, width * 0.0015);
  for (let x = -width * 0.2; x < width * 1.2; x += width * 0.08) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + width * 0.28, height);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = data.themeColor;
  ctx.globalAlpha = 0.22;
  ctx.beginPath();
  ctx.arc(width * 0.78, height * 0.28, width * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  drawImageCard(args, width * 0.5, height * 0.16, width * 0.4, height * 0.66, width * 0.028);

  const textX = width * 0.09 + spacing.textInset * 0.35;
  const textWidth = clamp(width * 0.5 - textX - spacing.gutter, width * 0.27, width * 0.36);
  const textTop = height * 0.16 + spacing.textInset;
  const textBottom = height * 0.84 - spacing.textInset;
  const textGap = spacing.stackGap;
  const badgeText = textWithDefault(data.badge, "NEW EXTENSION");
  const badgeHeight = Math.max(width < 700 ? 28 : 36, height * 0.072);
  const hasBadge = badgeText.trim().length > 0;
  ctx.fillStyle = "#ffffff";
  const titleFontSize = isMarquee ? Math.max(34, height * 0.1) : Math.max(32, width * 0.056);
  const titleBlock = drawOptionalFittedTextBlock(
    ctx,
    textWithDefault(data.title, "Power up your Chrome tab"),
    textX,
    textTop,
    textWidth,
    isMarquee ? height * 0.26 : height * 0.36,
    900,
    titleFontSize,
    Math.max(20, titleFontSize * 0.62),
    isMarquee ? 2 : 3
  );
  ctx.fillStyle = "#a5b4fc";
  const subtitleFontSize = isMarquee ? Math.max(17, height * 0.04) : Math.max(17, width * 0.021);
  const subtitleY = textTop + titleBlock.height + textGap;
  drawOptionalFittedTextBlock(
    ctx,
    textWithDefault(data.subtitle, "A high-contrast template for developer and productivity extensions."),
    textX,
    subtitleY,
    textWidth,
    textBottom - subtitleY - (hasBadge ? badgeHeight + textGap : 0),
    600,
    subtitleFontSize,
    Math.max(12, subtitleFontSize * 0.76),
    2,
    1.32
  );
  if (hasBadge) {
    drawOptionalBadge(ctx, badgeText, textX, textBottom - badgeHeight, Math.max(112, textWidth * 0.68), badgeHeight, data.themeColor);
  }
}

function minimalWhite(args: TemplateRenderArgs) {
  const { ctx, data, size } = args;
  const { width, height } = size;
  const isMarquee = width / height > 2.1;
  const spacing = getTemplateSpacing(width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const containerX = width * 0.055;
  const containerY = height * 0.08;
  const containerHeight = height * 0.84;
  ctx.fillStyle = "#f1f5f9";
  fillRoundedRect(ctx, containerX, containerY, width * 0.89, containerHeight, width * 0.04);
  ctx.fillStyle = data.themeColor;
  fillRoundedRect(ctx, containerX + spacing.textInset, containerY + spacing.textInset * 0.8, width * 0.055, width * 0.055, width * 0.016);

  const imageX = width * 0.52;
  const textX = containerX + spacing.textInset;
  const textWidth = clamp(imageX - textX - spacing.gutter, width * 0.28, width * 0.39);
  const textTop = containerY + spacing.textInset + width * 0.075;
  const textBottom = containerY + containerHeight - spacing.textInset;
  const textGap = spacing.stackGap;
  ctx.fillStyle = "#0f172a";
  const titleFontSize = isMarquee ? Math.max(34, height * 0.1) : Math.max(34, width * 0.056);
  const titleBlock = drawOptionalFittedTextBlock(
    ctx,
    textWithDefault(data.title, "Clean assets for your extension"),
    textX,
    textTop,
    textWidth,
    isMarquee ? height * 0.26 : height * 0.36,
    900,
    titleFontSize,
    Math.max(20, titleFontSize * 0.62),
    isMarquee ? 2 : 3
  );
  ctx.fillStyle = "#475569";
  const subtitleFontSize = isMarquee ? Math.max(17, height * 0.04) : Math.max(17, width * 0.021);
  drawOptionalFittedTextBlock(
    ctx,
    textWithDefault(data.subtitle, "A minimal layout for polished Chrome Store screenshots."),
    textX,
    textTop + titleBlock.height + textGap,
    textWidth,
    textBottom - (textTop + titleBlock.height + textGap),
    500,
    subtitleFontSize,
    Math.max(12, subtitleFontSize * 0.76),
    2,
    1.32
  );

  drawImageCard(args, imageX, height * 0.2, width * 0.36, height * 0.58, width * 0.03);
}

function featureCards(args: TemplateRenderArgs) {
  const { ctx, data, size } = args;
  const { width, height } = size;
  const isMarquee = width / height > 2.1;
  const spacing = getTemplateSpacing(width, height);
  drawGradientBase(ctx, width, height, data.themeColor);

  drawImageCard(args, width * 0.42, height * 0.14, width * 0.5, height * 0.68, width * 0.028);

  const imageX = width * 0.42;
  const textX = width * 0.08 + spacing.textInset * 0.25;
  const textWidth = clamp(imageX - textX - spacing.gutter, width * 0.24, width * 0.3);
  const textTop = height * 0.14 + spacing.textInset;
  ctx.fillStyle = "#ffffff";
  const titleFontSize = isMarquee ? Math.max(31, height * 0.09) : Math.max(31, width * 0.052);
  const titleBlock = drawOptionalFittedTextBlock(
    ctx,
    textWithDefault(data.title, "Everything you need, one click away"),
    textX,
    textTop,
    textWidth,
    height * 0.31,
    900,
    titleFontSize,
    Math.max(18, titleFontSize * 0.6),
    isMarquee ? 2 : 3
  );

  const cards = [
    textWithDefault(data.feature, "Capture, compose, and export store assets locally."),
    textWithDefault(data.cta, "No account"),
    textWithDefault(data.subtitle, "Private by design")
  ].filter((card) => card.trim());
  const cardGap = spacing.stackGap;
  const firstCardY = Math.max(height * 0.52, textTop + titleBlock.height + cardGap);
  const cardHeight = height * 0.082;
  const cardPadding = clamp(cardHeight * 0.55, 12, 30);
  const maxCardWidth = Math.min(width * 0.28, textWidth);
  const baseCardFontSize = Math.max(14, width * 0.018);
  const minCardFontSize = Math.max(10, baseCardFontSize * 0.7);
  const sharedCardFontSize = cards.reduce((fontSize, card) => {
    setFont(ctx, 800, baseCardFontSize);
    const measuredWidth = ctx.measureText(card.trim()).width;
    const fittedFontSize = measuredWidth > 0 ? Math.floor(baseCardFontSize * ((maxCardWidth - cardPadding * 2) / measuredWidth)) : baseCardFontSize;

    return Math.max(minCardFontSize, Math.min(fontSize, fittedFontSize));
  }, baseCardFontSize);

  cards.forEach((card, index) => {
    const cardY = firstCardY + index * height * 0.115;
    const cardX = textX;
    setFont(ctx, 800, sharedCardFontSize);
    const cardWidth = Math.min(maxCardWidth, Math.max(cardHeight * 2.7, ctx.measureText(card.trim()).width + cardPadding * 2));

    ctx.save();
    ctx.shadowColor = "rgba(15, 23, 42, 0.12)";
    ctx.shadowBlur = Math.max(8, cardHeight * 0.2);
    ctx.shadowOffsetY = Math.max(3, cardHeight * 0.08);
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    fillRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, width * 0.018);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.68)";
    ctx.lineWidth = Math.max(1, cardHeight * 0.025);
    ctx.beginPath();
    ctx.roundRect(cardX + ctx.lineWidth / 2, cardY + ctx.lineWidth / 2, cardWidth - ctx.lineWidth, cardHeight - ctx.lineWidth, width * 0.018);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = data.themeColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    drawFittedSingleLineText(
      ctx,
      card.trim(),
      cardX + cardWidth / 2,
      cardY + cardHeight / 2,
      cardWidth - cardPadding * 2,
      800,
      sharedCardFontSize,
      sharedCardFontSize
    );
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  });
}

function bigBadge(args: TemplateRenderArgs) {
  const { ctx, data, size } = args;
  const { width, height } = size;
  const isMarquee = width / height > 2.1;
  const spacing = getTemplateSpacing(width, height);
  ctx.fillStyle = shade(data.themeColor, 8);
  ctx.fillRect(0, 0, width, height);
  const containerX = width * 0.07;
  const containerY = height * 0.1;
  const containerHeight = height * 0.8;
  ctx.fillStyle = "#ffffff";
  fillRoundedRect(ctx, containerX, containerY, width * 0.86, containerHeight, width * 0.05);

  const imageX = width * 0.56;
  const textX = containerX + spacing.textInset;
  const textWidth = clamp(imageX - textX - spacing.gutter, width * 0.28, width * 0.38);
  const textBottom = containerY + containerHeight - spacing.textInset;
  const textGap = spacing.stackGap;
  const badgeText = textWithDefault(data.badge, "FEATURED");
  const badgeY = containerY + spacing.textInset;
  const badgeHeight = Math.max(width < 700 ? 30 : 42, height * 0.105);

  drawOptionalBadge(ctx, badgeText, textX, badgeY, Math.max(110, textWidth), badgeHeight, data.themeColor);

  ctx.fillStyle = "#111827";
  const titleFontSize = isMarquee ? Math.max(34, height * 0.1) : Math.max(36, width * 0.06);
  const titleY = badgeY + (badgeText.trim() ? badgeHeight + textGap : 0);
  const titleBlock = drawOptionalFittedTextBlock(
    ctx,
    textWithDefault(data.title, "Make Chrome feel personal"),
    textX,
    titleY,
    textWidth,
    isMarquee ? height * 0.25 : height * 0.34,
    900,
    titleFontSize,
    Math.max(20, titleFontSize * 0.6),
    isMarquee ? 2 : 3
  );
  ctx.fillStyle = "#64748b";
  const subtitleFontSize = isMarquee ? Math.max(17, height * 0.04) : Math.max(17, width * 0.021);
  drawOptionalFittedTextBlock(
    ctx,
    textWithDefault(data.subtitle, "A bold editorial style for benefit-led store assets."),
    textX,
    titleY + titleBlock.height + textGap,
    textWidth,
    textBottom - (titleY + titleBlock.height + textGap),
    600,
    subtitleFontSize,
    Math.max(12, subtitleFontSize * 0.76),
    2,
    1.32
  );

  drawImageCard(args, imageX, height * 0.2, width * 0.3, height * 0.58, width * 0.032);
}

function chromeBlue(args: TemplateRenderArgs) {
  const { ctx, data, size } = args;
  const { width, height } = size;
  const isMarquee = width / height > 2.1;
  const spacing = getTemplateSpacing(width, height);
  ctx.fillStyle = "#e0f2fe";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = data.themeColor;
  ctx.beginPath();
  ctx.arc(width * 0.86, height * 0.22, width * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shade(data.themeColor, 36);
  ctx.beginPath();
  ctx.arc(width * 0.15, height * 0.83, width * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shade(data.themeColor, -28);
  ctx.beginPath();
  ctx.arc(width * 0.16, height * 0.12, width * 0.12, 0, Math.PI * 2);
  ctx.fill();

  const containerX = width * 0.06;
  const containerY = height * 0.09;
  const containerHeight = height * 0.82;
  ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
  fillRoundedRect(ctx, containerX, containerY, width * 0.88, containerHeight, width * 0.045);
  const imageX = width * 0.47;
  drawImageCard(args, imageX, height * 0.18, width * 0.42, height * 0.62, width * 0.032);

  const textX = containerX + spacing.textInset;
  const textWidth = clamp(imageX - textX - spacing.gutter, width * 0.25, width * 0.33);
  const textTop = containerY + spacing.textInset + height * 0.08;
  const textBottom = containerY + containerHeight - spacing.textInset;
  const textGap = spacing.stackGap;
  ctx.fillStyle = "#0f172a";
  const titleFontSize = isMarquee ? Math.max(34, height * 0.1) : Math.max(34, width * 0.057);
  const titleBlock = drawOptionalFittedTextBlock(
    ctx,
    textWithDefault(data.title, "Built for Chrome users"),
    textX,
    textTop,
    textWidth,
    isMarquee ? height * 0.26 : height * 0.36,
    900,
    titleFontSize,
    Math.max(20, titleFontSize * 0.62),
    isMarquee ? 2 : 3
  );
  ctx.fillStyle = "#334155";
  const subtitleFontSize = isMarquee ? Math.max(17, height * 0.04) : Math.max(17, width * 0.021);
  drawOptionalFittedTextBlock(
    ctx,
    textWithDefault(data.subtitle, "A friendly Chrome-inspired layout with soft shapes."),
    textX,
    textTop + titleBlock.height + textGap,
    textWidth,
    textBottom - (textTop + titleBlock.height + textGap),
    600,
    subtitleFontSize,
    Math.max(12, subtitleFontSize * 0.76),
    2,
    1.32
  );
}

function diagonalShowcase(args: TemplateRenderArgs) {
  const { ctx, data, size } = args;
  const { width, height } = size;
  const isMarquee = width / height > 2.1;
  const spacing = getTemplateSpacing(width, height);
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = data.themeColor;
  ctx.beginPath();
  ctx.moveTo(width * 0.45, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, height);
  ctx.lineTo(width * 0.25, height);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.translate(width * 0.64, height * 0.5);
  ctx.rotate(-0.08);
  drawImageCard(args, -width * 0.22, -height * 0.32, width * 0.44, height * 0.64, width * 0.03);
  ctx.restore();

  const textX = width * 0.08 + spacing.textInset * 0.25;
  const imageLeft = width * 0.42;
  const textWidth = clamp(imageLeft - textX - spacing.gutter, width * 0.25, width * 0.34);
  const textTop = spacing.textInset + height * 0.16;
  const textBottom = height - spacing.textInset - height * 0.12;
  const textGap = spacing.stackGap;
  ctx.fillStyle = "#ffffff";
  const titleFontSize = isMarquee ? Math.max(33, height * 0.1) : Math.max(33, width * 0.055);
  const titleBlock = drawOptionalFittedTextBlock(
    ctx,
    textWithDefault(data.title, "Show the moment it clicks"),
    textX,
    textTop,
    textWidth,
    isMarquee ? height * 0.26 : height * 0.36,
    900,
    titleFontSize,
    Math.max(20, titleFontSize * 0.62),
    isMarquee ? 2 : 3
  );
  ctx.fillStyle = "#cbd5e1";
  const subtitleFontSize = isMarquee ? Math.max(17, height * 0.04) : Math.max(17, width * 0.021);
  drawOptionalFittedTextBlock(
    ctx,
    textWithDefault(data.subtitle, "A dynamic angled layout for action-focused extensions."),
    textX,
    textTop + titleBlock.height + textGap,
    textWidth,
    textBottom - (textTop + titleBlock.height + textGap),
    600,
    subtitleFontSize,
    Math.max(12, subtitleFontSize * 0.76),
    2,
    1.32
  );
}

export const templates: Template[] = [
  {
    id: "chrome-classic-hero",
    name: "Chrome Hero",
    description: "Extension hero screenshot with large title and benefit text.",
    category: "chrome-store",
    fields: ["title", "subtitle", "badge"],
    sizes: chromeStoreSizes,
    defaultValues: {
      ...defaultData,
      title: "Launch faster with Chrome tools",
      subtitle: "Turn one screenshot into polished Chrome Web Store assets.",
      badge: "CHROME STORE READY"
    },
    previewAccent: defaultData.themeColor,
    render: classicHero
  },
  {
    id: "chrome-feature-spotlight",
    name: "Feature Spotlight",
    description: "Emphasize one core extension feature beside a screenshot.",
    category: "chrome-store",
    fields: ["title", "feature", "cta"],
    sizes: chromeStoreSizes,
    defaultValues: {
      ...defaultData,
      title: "Everything you need, one click away",
      subtitle: "Private by design",
      badge: "Fast setup",
      cta: "No account",
      feature: "Capture, compose, and export store assets locally."
    },
    previewAccent: defaultData.themeColor,
    render: featureCards
  },
  {
    id: "chrome-browser-frame",
    name: "Browser Frame",
    description: "Places your screenshot inside a browser frame for product UI previews.",
    category: "chrome-store",
    fields: ["title", "subtitle"],
    sizes: chromeStoreSizes,
    defaultValues: {
      ...defaultData,
      title: "A smarter browser workflow",
      subtitle: "Show your extension inside a clean Chrome frame."
    },
    previewAccent: defaultData.themeColor,
    render: browserFrame
  },
  {
    id: "chrome-dark-tech",
    name: "Dark Tech",
    description: "A dark, technical look for developer tools and productivity extensions.",
    category: "chrome-store",
    fields: ["title", "subtitle", "badge"],
    sizes: chromeStoreSizes,
    defaultValues: {
      ...defaultData,
      title: "Power up your Chrome tab",
      subtitle: "A high-contrast template for developer and productivity extensions.",
      badge: "NEW EXTENSION"
    },
    previewAccent: defaultData.themeColor,
    render: darkTech
  },
  {
    id: "chrome-minimal-white",
    name: "Minimal White",
    description: "A minimal light style for polished professional tools.",
    category: "chrome-store",
    fields: ["title", "subtitle"],
    sizes: chromeStoreSizes,
    defaultValues: {
      ...defaultData,
      title: "Clean assets for your extension",
      subtitle: "A minimal layout for polished Chrome Store screenshots."
    },
    previewAccent: defaultData.themeColor,
    render: minimalWhite
  },
  {
    id: "chrome-feature-cards",
    name: "Feature Cards",
    description: "Three feature cards that highlight the extension's core benefits.",
    category: "chrome-store",
    fields: ["title", "subtitle", "badge", "cta"],
    sizes: chromeStoreSizes,
    defaultValues: {
      ...defaultData,
      title: "Everything you need, one click away",
      subtitle: "Private by design",
      badge: "Fast setup",
      cta: "No account"
    },
    previewAccent: defaultData.themeColor,
    render: featureCards
  },
  {
    id: "chrome-big-badge",
    name: "Big Badge",
    description: "A large badge and strong headline for launches or featured placements.",
    category: "chrome-store",
    fields: ["title", "subtitle", "badge"],
    sizes: chromeStoreSizes,
    defaultValues: {
      ...defaultData,
      title: "Make Chrome feel personal",
      subtitle: "A bold editorial style for benefit-led store assets.",
      badge: "FEATURED"
    },
    previewAccent: defaultData.themeColor,
    render: bigBadge
  },
  {
    id: "chrome-blue-shapes",
    name: "Chrome Blue Shapes",
    description: "Chrome-inspired colors and circular shapes for a friendly visual style.",
    category: "chrome-store",
    fields: ["title", "subtitle"],
    sizes: chromeStoreSizes,
    defaultValues: {
      ...defaultData,
      title: "Built for Chrome users",
      subtitle: "A friendly Chrome-inspired layout with soft shapes."
    },
    previewAccent: defaultData.themeColor,
    render: chromeBlue
  },
  {
    id: "chrome-diagonal-showcase",
    name: "Diagonal Showcase",
    description: "An angled composition with a tilted screenshot for more dynamic assets.",
    category: "chrome-store",
    fields: ["title", "subtitle"],
    sizes: chromeStoreSizes,
    defaultValues: {
      ...defaultData,
      title: "Show the moment it clicks",
      subtitle: "A dynamic angled layout for action-focused extensions."
    },
    previewAccent: defaultData.themeColor,
    render: diagonalShowcase
  }
];

export const defaultTemplate = templates[0];
