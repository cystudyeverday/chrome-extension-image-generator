export type TemplateCategory = "chrome-store";

export type ImageFitMode = "center" | "fill" | "contain" | "crop" | "cover";

export type EditableField = "title" | "subtitle" | "badge" | "cta" | "feature";

export type ExportSize = {
  id: string;
  label: string;
  width: number;
  height: number;
  useCase: string;
};

export type TemplateData = {
  title: string;
  subtitle: string;
  badge: string;
  cta: string;
  feature: string;
  themeColor: string;
  fitMode: ImageFitMode;
};

export type TemplateRenderArgs = {
  ctx: CanvasRenderingContext2D;
  image: HTMLImageElement;
  data: TemplateData;
  size: ExportSize;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  fields: EditableField[];
  sizes: ExportSize[];
  defaultValues: TemplateData;
  previewAccent: string;
  render: (args: TemplateRenderArgs) => void;
};

export type HistoryItem = {
  id: string;
  createdAt: string;
  templateId: string;
  selectedSizeIds: string[];
  data: TemplateData;
  imageDataUrl?: string;
  thumbnailDataUrl?: string;
};
