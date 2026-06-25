import type { ImageFitMode } from "@/lib/types";

export function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, safeRadius);
  ctx.fill();
}

export function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const sourceText = text.trim();
  const fontSize = getCanvasFontSize(ctx);
  const safeLineHeight = Math.max(lineHeight, fontSize * 1.16);
  const words = tokenizeText(sourceText);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const separator = shouldInsertSpace(currentLine, word) ? " " : "";
    const nextLine = currentLine ? `${currentLine}${separator}${word}` : word;
    if (ctx.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }

    if (lines.length >= maxLines) {
      break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  const visibleText = lines.join("");
  const shouldTruncate = sourceText.replace(/\s+/g, "").length > visibleText.replace(/\s+/g, "").length;
  lines.forEach((line, index) => {
    const suffix = index === maxLines - 1 && shouldTruncate ? "..." : "";
    ctx.fillText(`${line}${suffix}`, x, y + index * safeLineHeight);
  });
}

export function drawFittedSingleLineText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  weight: number,
  maxFontSize: number,
  minFontSize: number,
  family = "Inter, Arial, sans-serif"
) {
  const sourceText = text.trim();
  if (!sourceText) {
    return;
  }

  setFont(ctx, weight, maxFontSize, family);
  const measuredWidth = ctx.measureText(sourceText).width;
  if (measuredWidth <= maxWidth) {
    ctx.fillText(sourceText, x, y);
    return;
  }

  const readableFloor = Math.min(minFontSize, Math.max(6, maxFontSize * 0.38));
  const fittedFontSize = Math.max(readableFloor, Math.floor(maxFontSize * (maxWidth / measuredWidth)));
  setFont(ctx, weight, fittedFontSize, family);

  const fittedWidth = ctx.measureText(sourceText).width;
  if (fittedWidth <= maxWidth) {
    ctx.fillText(sourceText, x, y);
    return;
  }

  const horizontalScale = maxWidth / fittedWidth;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(horizontalScale, 1);
  ctx.fillText(sourceText, 0, 0);
  ctx.restore();
}

function getCanvasFontSize(ctx: CanvasRenderingContext2D) {
  const match = /(\d+(?:\.\d+)?)px/.exec(ctx.font);
  return match ? Number(match[1]) : 16;
}

function tokenizeText(text: string) {
  const tokens: string[] = [];
  const parts = text.split(/(\s+)/).filter(Boolean);

  for (const part of parts) {
    if (/^\s+$/.test(part)) {
      continue;
    }

    if (/[\u3400-\u9fff]/.test(part)) {
      tokens.push(...part.split(""));
    } else if (part.length > 20) {
      tokens.push(...part.split(""));
    } else {
      tokens.push(part);
    }
  }

  return tokens;
}

function shouldInsertSpace(currentLine: string, word: string) {
  if (!currentLine) {
    return false;
  }

  return !/[\u3400-\u9fff]$/.test(currentLine) && !/^[\u3400-\u9fff]/.test(word);
}

export function drawImageInBox(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  fitMode: ImageFitMode
) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const boxRatio = width / height;

  if (fitMode === "center") {
    const drawWidth = Math.min(image.naturalWidth, width);
    const drawHeight = Math.min(image.naturalHeight, height);
    ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
    return;
  }

  const shouldCover = fitMode === "cover";
  const useBoxWidth = shouldCover ? imageRatio < boxRatio : imageRatio > boxRatio;
  const drawWidth = useBoxWidth ? width : height * imageRatio;
  const drawHeight = useBoxWidth ? width / imageRatio : height;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

export function setFont(ctx: CanvasRenderingContext2D, weight: number, size: number, family = "Inter, Arial, sans-serif") {
  ctx.font = `${weight} ${size}px ${family}`;
}

export function shade(hexColor: string, amount: number) {
  const hex = hexColor.replace("#", "");
  const numeric = Number.parseInt(hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex, 16);
  const r = Math.max(0, Math.min(255, (numeric >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((numeric >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (numeric & 0xff) + amount));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
