"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { downloadAllSizes, downloadSize } from "@/lib/download";
import { addHistoryItem, loadHistory } from "@/lib/history";
import { canvasToDataUrl, createImageFromDataUrl, renderTemplateToCanvas } from "@/lib/renderer";
import { defaultTemplate, templates } from "@/lib/templates";
import type { EditableField, ExportSize, HistoryItem, ImageFitMode, Template, TemplateData } from "@/lib/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const initialData: TemplateData = {
  title: "Launch faster with Chrome tools",
  subtitle: "Turn one screenshot into polished Chrome Web Store assets.",
  badge: "CHROME STORE READY",
  cta: "Private by design",
  themeColor: "#2563eb",
  fitMode: "cover"
};

const fieldLabels: Record<EditableField, string> = {
  title: "Title",
  subtitle: "Subtitle",
  badge: "Badge",
  cta: "Feature Point"
};

const fitModeOptions: Array<{ label: string; value: ImageFitMode }> = [
  { label: "Crop to Fill", value: "cover" },
  { label: "Fit Entire Image", value: "contain" },
  { label: "Center Original", value: "center" }
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
      setError(renderError instanceof Error ? renderError.message : "Render failed");
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
          Download
        </button>
      </div>
      <div className="preview-stage" style={{ aspectRatio: `${size.width} / ${size.height}` }}>
        {error ? <p className="error-text">{error}</p> : <canvas ref={canvasRef} aria-label={`${size.label} preview`} />}
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
    reader.onerror = () => reject(new Error("Failed to read the image."));
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const fieldInputRefs = useRef<Partial<Record<EditableField, HTMLInputElement | null>>>({});

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
      setMessage("Upload a PNG, JPG, or WebP image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage("The image is over 10 MB. Compress it and try again.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const loadedImage = await createImageFromDataUrl(dataUrl);
      setImageDataUrl(dataUrl);
      setImage(loadedImage);
      setMessage("Image loaded locally. Nothing was uploaded to a server.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load the image.");
    }
  }

  function updateData<K extends keyof TemplateData>(key: K, value: TemplateData[K]) {
    setData((current) => ({ ...current, [key]: value }));
  }

  function clearField(field: EditableField) {
    updateData(field, "");
    requestAnimationFrame(() => {
      fieldInputRefs.current[field]?.focus();
    });
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
      setMessage("Upload an image first.");
      return;
    }

    try {
      setIsDownloading(true);
      await downloadSize(selectedTemplate, image, data, size);
      persistHistory();
      setMessage(`${size.label} download started.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Download failed.");
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleDownloadAll() {
    if (!image) {
      setMessage("Upload an image first.");
      return;
    }

    if (selectedSizes.length === 0) {
      setMessage("Select at least one export size.");
      return;
    }

    try {
      setIsDownloading(true);
      await downloadAllSizes(selectedTemplate, image, data, selectedSizes);
      persistHistory();
      setMessage(`${selectedSizes.length} PNG downloads started.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Batch download failed.");
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
        setMessage("History item restored.");
        setIsHistoryOpen(false);
      } catch {
        setMessage("Settings restored, but the saved image could not be loaded.");
      }
    } else {
      setMessage("Settings restored. Upload the source image again.");
      setIsHistoryOpen(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">TemplatePic MVP</p>
          <h1>Chrome Store Image Template Generator</h1>
          <p>
            Create Chrome Web Store assets from one extension screenshot. Pick a promotional template, edit the copy, and export
            1280x800, 1400x560, and 440x280 PNGs. Everything runs locally in your browser.
          </p>
        </div>
        <button type="button" className="button button--primary" disabled={!image || isDownloading} onClick={handleDownloadAll}>
          {isDownloading ? "Generating..." : "Download Selected Sizes"}
        </button>
      </section>

      <div className="workspace">
        <aside className="panel controls">
          <section>
            <div className="section-title">
              <span>1</span>
              <h2>Upload Image</h2>
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
                <img src={imageDataUrl} alt="Uploaded image preview" />
              ) : (
                <div>
                  <strong>Click or drag to upload</strong>
                  <span>PNG / JPG / WebP, up to 10 MB</span>
                </div>
              )}
            </label>
          </section>

          <section>
            <div className="section-title">
              <span>2</span>
              <h2>Choose Template</h2>
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
              <h2>Edit Copy</h2>
            </div>
            <div className="field-grid">
              {selectedTemplate.fields.map((field) => (
                <div key={field} className="field">
                  <div className="field__heading">
                    <label htmlFor={`copy-${field}`}>{fieldLabels[field]}</label>
                    <button type="button" className="field__clear" disabled={!data[field].trim()} onClick={() => clearField(field)}>
                      Clear
                    </button>
                  </div>
                  <input
                    id={`copy-${field}`}
                    ref={(input) => {
                      fieldInputRefs.current[field] = input;
                    }}
                    placeholder="Cleared. Type to restore this copy."
                    value={data[field]}
                    onChange={(event) => updateData(field, event.target.value)}
                  />
                </div>
              ))}
              <label className="field">
                <span>Theme Color</span>
                <input type="color" value={data.themeColor} onChange={(event) => updateData("themeColor", event.target.value)} />
              </label>
              <label className="field">
                <span>Image Fit</span>
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
              <h2>Export Sizes</h2>
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
              <h2>Multi-size Preview</h2>
            </div>
            <button type="button" className="button button--secondary" disabled={!image} onClick={persistHistory}>
              Save to History
            </button>
          </div>

          {!image ? (
            <div className="empty-state">
              <strong>Upload an image first</strong>
              <span>Previews will render automatically with the current template and selected sizes.</span>
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

      </div>

      <div className="floating-history">
        {isHistoryOpen ? (
          <aside className="panel history-popover">
            <div className="history-popover__header">
              <div className="section-title">
                <span>5</span>
                <h2>Recent History</h2>
              </div>
              <button type="button" className="button button--ghost" onClick={() => setIsHistoryOpen(false)}>
                Collapse
              </button>
            </div>
            {history.length === 0 ? (
              <p className="muted">Your latest 10 saved or downloaded generations will appear here.</p>
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
                        <strong>{template?.name ?? "Unknown template"}</strong>
                        {new Date(item.createdAt).toLocaleString("en-US")}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>
        ) : null}
        <button type="button" className="history-fab" onClick={() => setIsHistoryOpen((current) => !current)}>
          Recent History
          <span>{history.length}</span>
        </button>
      </div>
    </main>
  );
}
