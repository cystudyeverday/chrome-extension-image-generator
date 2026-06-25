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
  const { lines, truncated } = wrapTextLines(ctx, sourceText, maxWidth, maxLines);
  lines.forEach((line, index) => {
    const suffix = index === maxLines - 1 && truncated ? "..." : "";
    ctx.fillText(`${line}${suffix}`, x, y + index * safeLineHeight);
  });
}

export type FittedTextBlockResult = {
  fontSize: number;
  lineHeight: number;
  lineCount: number;
  height: number;
};

type FittedTextBlockOptions = {
  x: number;
  y: number;
  width: number;
  height: number;
  weight: number;
  maxFontSize: number;
  minFontSize: number;
  lineHeightRatio?: number;
  maxLines: number;
  family?: string;
};

export function drawFittedTextBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  {
    x,
    y,
    width,
    height,
    weight,
    maxFontSize,
    minFontSize,
    lineHeightRatio = 1.16,
    maxLines,
    family = "Inter, Arial, sans-serif"
  }: FittedTextBlockOptions
): FittedTextBlockResult {
  const sourceText = text.trim();
  if (!sourceText || width <= 0 || height <= 0 || maxLines <= 0) {
    return { fontSize: 0, lineHeight: 0, lineCount: 0, height: 0 };
  }

  const safeMinFontSize = Math.max(8, Math.min(minFontSize, maxFontSize));
  let fontSize = Math.max(safeMinFontSize, maxFontSize);
  let lineHeight = fontSize * lineHeightRatio;
  let lines: string[] = [];
  let truncated = false;

  for (let nextFontSize = fontSize; nextFontSize >= safeMinFontSize; nextFontSize -= 1) {
    setFont(ctx, weight, nextFontSize, family);
    const nextLineHeight = nextFontSize * lineHeightRatio;
    const availableLines = Math.max(1, Math.min(maxLines, Math.floor(height / nextLineHeight)));
    const wrapped = wrapTextLines(ctx, sourceText, width, availableLines);

    fontSize = nextFontSize;
    lineHeight = nextLineHeight;
    lines = wrapped.lines;
    truncated = wrapped.truncated;

    if (lines.length * lineHeight <= height && lines.length > 0) {
      break;
    }
  }

  if (lines.length === 0) {
    return { fontSize, lineHeight, lineCount: 0, height: 0 };
  }

  const lastIndex = lines.length - 1;
  if (truncated) {
    lines[lastIndex] = fitLineWithEllipsis(ctx, lines[lastIndex], width);
  }

  ctx.save();
  ctx.textBaseline = "top";
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
  ctx.restore();

  return {
    fontSize,
    lineHeight,
    lineCount: lines.length,
    height: lines.length * lineHeight
  };
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

function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const sourceText = text.trim();
  const words = tokenizeText(sourceText);
  const lines: string[] = [];
  let currentLine = "";
  let consumedTokens = 0;

  for (const word of words) {
    const separator = shouldInsertSpace(currentLine, word) ? " " : "";
    const nextLine = currentLine ? `${currentLine}${separator}${word}` : word;
    if (ctx.measureText(nextLine).width <= maxWidth || !currentLine) {
      currentLine = nextLine;
      consumedTokens += 1;
    } else {
      lines.push(currentLine);
      if (lines.length >= maxLines) {
        return { lines, truncated: consumedTokens < words.length };
      }
      currentLine = word;
      consumedTokens += 1;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return { lines, truncated: consumedTokens < words.length };
}

function fitLineWithEllipsis(ctx: CanvasRenderingContext2D, line: string, maxWidth: number) {
  const ellipsis = "...";
  let nextLine = line.trimEnd();

  while (nextLine && ctx.measureText(`${nextLine}${ellipsis}`).width > maxWidth) {
    nextLine = nextLine.slice(0, -1).trimEnd();
  }

  return nextLine ? `${nextLine}${ellipsis}` : ellipsis;
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

  const shouldCover = fitMode === "cover" || fitMode === "crop" || fitMode === "fill";
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
