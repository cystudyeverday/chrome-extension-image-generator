export type TemplateCategory = "store";

export type ImageFitMode = "contain" | "cover" | "center";

export type EditableField = "title" | "subtitle" | "badge" | "cta";

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
