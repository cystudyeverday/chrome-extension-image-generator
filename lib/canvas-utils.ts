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
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(nextLine).width <= maxWidth || !currentLine) {
      currentLine = nextLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }

    if (lines.length === maxLines) {
      break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  lines.forEach((line, index) => {
    const suffix = index === maxLines - 1 && words.join(" ").length > lines.join(" ").length ? "..." : "";
    ctx.fillText(`${line}${suffix}`, x, y + index * lineHeight);
  });
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
