"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { downloadAllSizes, downloadSize } from "@/lib/download";
import { addHistoryItem, loadHistory } from "@/lib/history";
import { canvasToDataUrl, createImageFromDataUrl, renderTemplateToCanvas } from "@/lib/renderer";
import { defaultTemplate, templates } from "@/lib/templates";
import type { EditableField, ExportSize, HistoryItem, ImageFitMode, Template, TemplateData } from "@/lib/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const initialData: TemplateData = {
  title: "Launch visuals in minutes",
  subtitle: "Upload one image, choose a template, and export every size locally.",
  badge: "LOCAL PNG EXPORT",
  cta: "Generate now",
  price: "$29",
  themeColor: "#7c3aed",
  fitMode: "cover"
};

const fieldLabels: Record<EditableField, string> = {
  title: "标题",
  subtitle: "副标题",
  badge: "标签 / 角标",
  cta: "CTA 文案",
  price: "价格 / 折扣"
};

const fitModeOptions: Array<{ label: string; value: ImageFitMode }> = [
  { label: "裁剪铺满", value: "cover" },
  { label: "完整适配", value: "contain" },
  { label: "居中原图", value: "center" }
];

type PreviewCardProps = {
  template: Template;
  image: HTMLImageElement;
  data: TemplateData;
  size: ExportSize;
  onDownload: (size: ExportSize) => void;
};

function PreviewCard({ template, image, data, size, onDownload }: PreviewCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    try {
      setError("");
      const previewScale = Math.min(1, 540 / size.width);
      renderTemplateToCanvas(canvas, template, image, data, size, previewScale);
    } catch (renderError) {
      setError(renderError instanceof Error ? renderError.message : "渲染失败");
    }
  }, [data, image, size, template]);

  return (
    <article className="preview-card">
      <div className="preview-card__meta">
        <div>
          <strong>{size.label}</strong>
          <span>
            {size.width} x {size.height} · {size.useCase}
          </span>
        </div>
        <button type="button" className="button button--ghost" onClick={() => onDownload(size)}>
          下载
        </button>
      </div>
      <div className="preview-stage" style={{ aspectRatio: `${size.width} / ${size.height}` }}>
        {error ? <p className="error-text">{error}</p> : <canvas ref={canvasRef} aria-label={`${size.label} 预览`} />}
      </div>
    </article>
  );
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("读取图片失败"));
    reader.readAsDataURL(file);
  });
}

export function ImageTemplateGenerator() {
  const [templateId, setTemplateId] = useState(defaultTemplate.id);
  const [data, setData] = useState<TemplateData>(initialData);
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>(defaultTemplate.sizes.map((size) => size.id));
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const selectedTemplate = useMemo(() => templates.find((template) => template.id === templateId) ?? defaultTemplate, [templateId]);
  const selectedSizes = useMemo(
    () => selectedTemplate.sizes.filter((size) => selectedSizeIds.includes(size.id)),
    [selectedSizeIds, selectedTemplate]
  );

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    if (!selectedTemplate.sizes.some((size) => selectedSizeIds.includes(size.id))) {
      setSelectedSizeIds(selectedTemplate.sizes.map((size) => size.id));
    }
  }, [selectedSizeIds, selectedTemplate]);

  async function handleFile(file: File) {
    setMessage("");

    if (!file.type.startsWith("image/")) {
      setMessage("请上传 PNG、JPG 或 WebP 图片。");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage("图片超过 10 MB，请压缩后再上传。");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const loadedImage = await createImageFromDataUrl(dataUrl);
      setImageDataUrl(dataUrl);
      setImage(loadedImage);
      setMessage("图片已在本地加载，没有上传到服务器。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "图片加载失败");
    }
  }

  function updateData<K extends keyof TemplateData>(key: K, value: TemplateData[K]) {
    setData((current) => ({ ...current, [key]: value }));
  }

  function toggleSize(sizeId: string) {
    setSelectedSizeIds((current) => {
      if (current.includes(sizeId)) {
        return current.length === 1 ? current : current.filter((id) => id !== sizeId);
      }

      return [...current, sizeId];
    });
  }

  function handleTemplateChange(nextTemplateId: string) {
    const nextTemplate = templates.find((template) => template.id === nextTemplateId) ?? defaultTemplate;
    setTemplateId(nextTemplate.id);
    setSelectedSizeIds(nextTemplate.sizes.map((size) => size.id));
  }

  function buildHistoryItem(thumbnailDataUrl?: string): HistoryItem {
    return {
      id: createId(),
      createdAt: new Date().toISOString(),
      templateId: selectedTemplate.id,
      selectedSizeIds,
      data,
      imageDataUrl,
      thumbnailDataUrl
    };
  }

  function createThumbnail() {
    if (!image || !selectedSizes[0]) {
      return undefined;
    }

    try {
      const canvas = document.createElement("canvas");
      renderTemplateToCanvas(canvas, selectedTemplate, image, data, selectedSizes[0], 0.2);
      return canvasToDataUrl(canvas);
    } catch {
      return undefined;
    }
  }

  function persistHistory() {
    const nextHistory = addHistoryItem(buildHistoryItem(createThumbnail()));
    setHistory(nextHistory);
  }

  async function handleDownloadSize(size: ExportSize) {
    if (!image) {
      setMessage("请先上传图片。");
      return;
    }

    try {
      setIsDownloading(true);
      await downloadSize(selectedTemplate, image, data, size);
      persistHistory();
      setMessage(`${size.label} 已开始下载。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "下载失败");
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleDownloadAll() {
    if (!image) {
      setMessage("请先上传图片。");
      return;
    }

    if (selectedSizes.length === 0) {
      setMessage("请至少选择一个导出尺寸。");
      return;
    }

    try {
      setIsDownloading(true);
      await downloadAllSizes(selectedTemplate, image, data, selectedSizes);
      persistHistory();
      setMessage(`已触发 ${selectedSizes.length} 个 PNG 下载。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "批量下载失败");
    } finally {
      setIsDownloading(false);
    }
  }

  async function restoreHistory(item: HistoryItem) {
    const nextTemplate = templates.find((template) => template.id === item.templateId) ?? defaultTemplate;
    setTemplateId(nextTemplate.id);
    setData(item.data);
    setSelectedSizeIds(item.selectedSizeIds.filter((sizeId) => nextTemplate.sizes.some((size) => size.id === sizeId)));

    if (item.imageDataUrl) {
      try {
        const restoredImage = await createImageFromDataUrl(item.imageDataUrl);
        setImageDataUrl(item.imageDataUrl);
        setImage(restoredImage);
        setMessage("已恢复历史记录。");
      } catch {
        setMessage("已恢复配置，但历史图片无法加载。");
      }
    } else {
      setMessage("已恢复配置，请重新上传原图。");
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">TemplatePic MVP</p>
          <h1>本地图片模板生成器</h1>
          <p>
            上传图片、选择模板、填写文案，一次生成 Chrome Store、社媒、电商和广告所需的多尺寸 PNG。
            全部处理都在浏览器本地完成。
          </p>
        </div>
        <button type="button" className="button button--primary" disabled={!image || isDownloading} onClick={handleDownloadAll}>
          {isDownloading ? "正在生成..." : "下载全部选中尺寸"}
        </button>
      </section>

      <div className="workspace">
        <aside className="panel controls">
          <section>
            <div className="section-title">
              <span>1</span>
              <h2>上传图片</h2>
            </div>
            <label
              className={`upload-box ${isDragging ? "upload-box--active" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                const file = event.dataTransfer.files[0];
                if (file) {
                  void handleFile(file);
                }
              }}
            >
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleFile(file);
                  }
                }}
              />
              {imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageDataUrl} alt="已上传图片预览" />
              ) : (
                <div>
                  <strong>点击或拖拽上传</strong>
                  <span>PNG / JPG / WebP，最大 10 MB</span>
                </div>
              )}
            </label>
          </section>

          <section>
            <div className="section-title">
              <span>2</span>
              <h2>选择模板</h2>
            </div>
            <div className="template-list">
              {templates.map((template) => (
                <button
                  type="button"
                  key={template.id}
                  className={`template-option ${template.id === selectedTemplate.id ? "template-option--active" : ""}`}
                  onClick={() => handleTemplateChange(template.id)}
                >
                  <strong>{template.name}</strong>
                  <span>{template.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="section-title">
              <span>3</span>
              <h2>编辑文案</h2>
            </div>
            <div className="field-grid">
              {selectedTemplate.fields.map((field) => (
                <label key={field} className="field">
                  <span>{fieldLabels[field]}</span>
                  <input value={data[field]} onChange={(event) => updateData(field, event.target.value)} />
                </label>
              ))}
              <label className="field">
                <span>主题色</span>
                <input type="color" value={data.themeColor} onChange={(event) => updateData("themeColor", event.target.value)} />
              </label>
              <label className="field">
                <span>图片位置</span>
                <select value={data.fitMode} onChange={(event) => updateData("fitMode", event.target.value as ImageFitMode)}>
                  {fitModeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section>
            <div className="section-title">
              <span>4</span>
              <h2>导出尺寸</h2>
            </div>
            <div className="size-list">
              {selectedTemplate.sizes.map((size) => (
                <label key={size.id} className="size-option">
                  <input type="checkbox" checked={selectedSizeIds.includes(size.id)} onChange={() => toggleSize(size.id)} />
                  <span>
                    <strong>{size.label}</strong>
                    {size.width} x {size.height}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {message ? <p className="notice">{message}</p> : null}
        </aside>

        <section className="panel previews">
          <div className="previews__header">
            <div>
              <p className="eyebrow">Live Preview</p>
              <h2>多尺寸实时预览</h2>
            </div>
            <button type="button" className="button button--secondary" disabled={!image} onClick={persistHistory}>
              保存到历史
            </button>
          </div>

          {!image ? (
            <div className="empty-state">
              <strong>先上传一张图片</strong>
              <span>上传后会按当前模板和尺寸自动生成预览。</span>
            </div>
          ) : (
            <div className="preview-grid">
              {selectedSizes.map((size) => (
                <PreviewCard
                  key={size.id}
                  template={selectedTemplate}
                  image={image}
                  data={data}
                  size={size}
                  onDownload={(nextSize) => void handleDownloadSize(nextSize)}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="panel history">
          <div className="section-title">
            <span>5</span>
            <h2>最近历史</h2>
          </div>
          {history.length === 0 ? (
            <p className="muted">生成或保存后会在这里保留最近 10 条记录。</p>
          ) : (
            <div className="history-list">
              {history.map((item) => {
                const template = templates.find((entry) => entry.id === item.templateId);
                return (
                  <button type="button" key={item.id} className="history-item" onClick={() => void restoreHistory(item)}>
                    {item.thumbnailDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.thumbnailDataUrl} alt="" />
                    ) : (
                      <span className="history-item__placeholder" />
                    )}
                    <span>
                      <strong>{template?.name ?? "未知模板"}</strong>
                      {new Date(item.createdAt).toLocaleString("zh-CN")}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
