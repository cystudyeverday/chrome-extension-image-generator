import type { ExportSize, Template, TemplateData } from "@/lib/types";

export function renderTemplateToCanvas(
  canvas: HTMLCanvasElement,
  template: Template,
  image: HTMLImageElement,
  data: TemplateData,
  size: ExportSize,
  scale = 1
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not supported in this browser.");
  }

  canvas.width = Math.round(size.width * scale);
  canvas.height = Math.round(size.height * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, size.width, size.height);
  template.render({ ctx, image, data, size });
}

export async function renderTemplateToBlob(template: Template, image: HTMLImageElement, data: TemplateData, size: ExportSize) {
  const canvas = document.createElement("canvas");
  renderTemplateToCanvas(canvas, template, image, data, size);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to export canvas as PNG."));
      }
    }, "image/png");
  });
}

export function createImageFromDataUrl(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image preview."));
    image.src = dataUrl;
  });
}

export function canvasToDataUrl(canvas: HTMLCanvasElement, quality = 0.88) {
  return canvas.toDataURL("image/png", quality);
}
