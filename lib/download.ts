import { renderTemplateToBlob } from "@/lib/renderer";
import type { ExportSize, Template, TemplateData } from "@/lib/types";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function createFilename(template: Template, size: ExportSize) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${slugify(template.name) || template.id}-${size.width}x${size.height}-${timestamp}.png`;
}

export async function downloadSize(template: Template, image: HTMLImageElement, data: TemplateData, size: ExportSize) {
  const blob = await renderTemplateToBlob(template, image, data, size);
  downloadBlob(blob, createFilename(template, size));
}

export async function downloadAllSizes(template: Template, image: HTMLImageElement, data: TemplateData, sizes: ExportSize[]) {
  for (const size of sizes) {
    const blob = await renderTemplateToBlob(template, image, data, size);
    downloadBlob(blob, createFilename(template, size));
    await new Promise((resolve) => window.setTimeout(resolve, 150));
  }
}
