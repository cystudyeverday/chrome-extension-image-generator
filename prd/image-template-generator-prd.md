# Standalone Chrome Extension Image Template Generator PRD

## 1. Background

This project is a standalone Chrome Extension image template generator. It should stay separate from `beatfear` / TreatBoss because the target users, workflows, store positioning, copy, and code structure are different.

The product is not an AI image generator. It is a local-first image composition tool: users upload an image, choose a template, edit copy once, generate several asset sizes, and download production-ready PNGs.

Existing Chrome Extension, local SVG/Canvas generation, and Chrome Web Store asset experience from `beatfear` may be used as reference only. TreatBoss business logic, branding, copy, icons, and game UI should not be reused.

## 2. Product Positioning

Chosen name: Chrome Store Image Generator.

One-line positioning:

> A browser-based local image template generator that turns one uploaded image and a few copy fields into multiple promotional assets.

Core value:

- No AI API is required, so generation is fast and low cost.
- Images are processed locally for better privacy.
- Templates replace complex design workflows for non-design users.
- Future AI background removal, background replacement, copy generation, and advanced editing can be layered on top.

## 3. Target Users

Primary users for the first version:

- Indie developers who need Chrome Web Store, Product Hunt, and social launch assets.
- Content creators who need fast social thumbnails and covers.
- Small merchants who need product or promotion images.
- Marketers who need batches of ad test creatives.

Out of scope for the first version:

- Users who need professional AI retouching, face swap, outfit swap, or scene blending.
- Enterprise design teams with strict print or brand-system requirements.
- Teams that need collaboration, approvals, or asset management.

## 4. Use Cases

### 4.1 Chrome Web Store Promotional Images

Users upload an extension screenshot, choose a Chrome Store template, enter a title, subtitle, and key benefit, then export 1280x800, 1400x560, and 440x280 assets.

### 4.2 Social Covers

Users upload an image, enter a title and supporting copy, choose a cover style, and export common social ratios such as 3:4, 1:1, and 16:9.

### 4.3 Product Promotion Images

Users upload a product image, choose a promotion template, enter pricing, discount, and benefit copy, then export listing, detail, and ad images.

### 4.4 Ad Creatives

Users upload a product screenshot or product image, choose an ad template, enter CTA and campaign copy, then generate sizes for different ad platforms.

## 5. MVP Scope

The first version focuses on local template composition. It does not call any AI generation API.

Must have:

- Upload PNG, JPG, or WebP images.
- Preview the uploaded image and generated assets.
- Provide built-in templates.
- Edit title, subtitle, badge, CTA, theme color, and image fit mode.
- Select multiple export sizes.
- Render locally with Canvas or SVG.
- Preview multiple sizes from the same content.
- Download one PNG or all selected PNGs.
- Save and restore the latest 10 generation records.
- Open from a Chrome Extension action.

Not included in MVP:

- AI image generation.
- AI background removal.
- Account system.
- Subscription or billing.
- Cloud asset library.
- Collaboration.
- Template marketplace.
- Batch upload of multiple source images.

## 6. Core Flow

```text
Open Chrome Extension
  ->
Open image generator panel
  ->
Upload image
  ->
Choose template
  ->
Edit title / subtitle / badge / CTA
  ->
Select preview cards in Live Preview
  ->
Preview all fixed Chrome sizes
  ->
Download one preview or selected previews
  ->
Save to history
```

## 7. Functional Requirements

### 7.1 Upload

- Users can click the upload area to choose a local image.
- Users can drag and drop an image.
- MVP should limit a single image to 10 MB.
- Images must stay local and must not be uploaded to a server.

Acceptance criteria:

- PNG, JPG, and WebP uploads preview correctly.
- Non-image files show an error.
- Oversized files ask the user to compress or choose another image.

### 7.2 Templates

Templates should be functions or configuration objects, not hardcoded UI branches.

Recommended template shape:

```ts
type TemplateField =
  | {
      id: "title" | "subtitle" | "badge" | "cta" | "feature";
      label: string;
      type: "text";
      maxLength: number;
      placeholder: string;
    }
  | {
      id: "themeColor";
      label: string;
      type: "color";
      defaultValue: string;
    }
  | {
      id: "imageFit";
      label: string;
      type: "select";
      options: Array<"center" | "fill" | "contain" | "crop">;
      defaultValue: "contain" | "crop";
    };

type Template = {
  id: string;
  name: string;
  category: "chrome-store" | "social" | "product" | "ads";
  description: string;
  fields: TemplateField[];
  sizes: ExportSize[];
  defaultValues: Record<string, string>;
  previewImage?: string;
  render: (args: TemplateRenderArgs) => void;
};
```

MVP template catalog:

| Template | Category | Main use | Required fields | Default sizes |
| --- | --- | --- | --- | --- |
| Chrome Hero | Chrome Store | Extension hero screenshot with large title and benefit text | title, subtitle, badge, themeColor, imageFit | 1280x800, 1400x560, 440x280 |
| Feature Spotlight | Chrome Store | Emphasize one core extension feature beside a screenshot | title, feature, cta, themeColor, imageFit | 1280x800, 1400x560, 440x280 |
| Browser Frame | Chrome Store | Show the uploaded screenshot inside a browser-like frame | title, subtitle, themeColor, imageFit | 1280x800, 1400x560, 440x280 |
| Dark Tech | Chrome Store | High-contrast technical style for developer and productivity extensions | title, subtitle, badge, themeColor, imageFit | 1280x800, 1400x560, 440x280 |
| Minimal White | Chrome Store | Clean light style for professional extension listings | title, subtitle, themeColor, imageFit | 1280x800, 1400x560, 440x280 |

MVP export sizes are fixed to Chrome publishing assets:

- 1280x800 Chrome Store large promotional image.
- 1400x560 Chrome Store marquee promotional image.
- 440x280 Chrome Store small promotional image.
- Social, product, and ad platform sizes are future extensions, not MVP defaults.

Template rendering rules:

- Each template should use named layout regions such as background, image frame, copy block, badge, CTA, and decorative elements.
- Layout should be recalculated per export size. Do not render one fixed canvas and stretch it to another ratio.
- Text should have max width, line height, max lines, and fallback scaling rules.
- User images should be clipped inside a defined image frame with predictable fit behavior.
- Template colors should derive from `themeColor` plus generated tints and shadows instead of unrelated hardcoded palettes.
- `themeColor` is a global setting that applies to every template and should not reset when switching templates.
- Templates may change layout and typography, but they should not ship with independent default brand colors.
- Decorative shapes must not overlap critical copy or the primary image.
- Every template should provide sensible default copy so the first preview never looks empty.

Visual quality baseline:

- Use strong contrast between text and background.
- Keep title text readable at the smallest supported size.
- Prefer one clear visual hierarchy: badge, title, supporting copy, CTA.
- Keep safe padding around edges so assets are usable in stores and social feeds.
- Avoid tiny decorative details that disappear in 440x280 exports.
- The uploaded image should feel intentionally placed, not pasted on top of the background.

Acceptance criteria:

- Switching templates updates previews immediately.
- Each template defines editable fields and supported export sizes.
- A template render failure does not crash the entire page.
- Each MVP template renders correctly across all of its default sizes.
- Each template has default values, so users can preview it before editing copy.
- Template-specific fields are shown only when the selected template uses them.

### 7.3 Copy Editing

Editable fields:

- Title.
- Subtitle.
- Badge.
- CTA or feature point.
- Theme color.
- Image fit mode: center, fill, contain, or crop.

Acceptance criteria:

- Preview updates as the user types.
- Long copy wraps, truncates, or scales without overflowing the canvas.
- Empty fields do not cause render errors.

### 7.4 Preview

- The main preview area displays selected output sizes.
- Each preview card shows size name, width, height, and use case.
- The preview aspect ratio matches the export size.
- Preview rendering may use a lower scale than final export.

Acceptance criteria:

- Template, copy, preview-card selection, and image changes refresh previews.
- Preview and final export have the same visual layout.

### 7.5 Multi-size Generation

- MVP uses fixed Chrome publishing sizes: 1280x800, 1400x560, and 440x280.
- Users can select one or more fixed Chrome output sizes directly from the Live Preview cards.
- The left control panel should not contain a separate export-size selector.
- One image, copy set, and theme color should adapt across canvas ratios.
- Template functions should adjust layout per size instead of stretching one design.
- MVP can use a single image crop strategy for all sizes.
- Non-Chrome sizes such as social covers, product images, and ad creatives are not included in the MVP export set.

Acceptance criteria:

- A single action can generate the three fixed Chrome publishing sizes.
- All fixed Chrome sizes remain visible in Live Preview even when only some are selected for batch download.
- Different sizes use basic layout adaptation.
- Long titles do not overflow the canvas.
- Unselected preview cards are still rendered, but they are not included in selected batch downloads.

### 7.6 Export

- Use `canvas.toBlob()` to generate PNG files.
- Download through browser download links or `chrome.downloads.download()` if needed.
- Default filenames should include template name, size, and timestamp.
- Support downloading one preview card and all selected preview cards.
- MVP can trigger multiple PNG downloads individually; ZIP export can come later.

Acceptance criteria:

- Downloaded files are valid PNGs.
- Exported image dimensions match the selected size.
- Download-all filenames include size identifiers.
- Exports are not blocked by cross-origin canvas tainting.

### 7.7 History

- Save the latest 10 generation records.
- Store template ID, copy fields, selected preview card sizes, source image if possible, and thumbnail.
- Use `chrome.storage.local` or `localStorage`.

Acceptance criteria:

- History persists after closing and reopening the extension.
- Clicking a history item restores the editing configuration.
- More than 10 records automatically removes the oldest entries.

## 8. Non-functional Requirements

Performance:

- Typical generation should complete within 1 second.
- Large image rendering should avoid blocking the UI.
- Preview can render at low resolution; export should render at full size.

Privacy:

- MVP must not upload user images.
- MVP must not collect user copy.
- Privacy copy should clearly state that images are processed locally.

Compatibility:

- Support Chrome Manifest V3.
- Prioritize desktop Chrome.
- Mobile browser support is not required.

Security:

- Do not execute user-provided HTML.
- Render user copy through Canvas text APIs.
- Keep extension permissions minimal.

## 9. Technical Approach

Recommended project structure:

```text
image-batch-template-extension/
  manifest.json
  index.html
  src/
    app.js
    image-loader.js
    templates.js
    renderer.js
    download.js
    storage.js
  styles/
    main.css
  docs/
    prd.md
```

MVP should start as an extension popup or extension page. There is no need for a content script overlay until the product needs one-click generation from arbitrary web pages.

Data flow:

```text
File input
  ->
image-loader creates an image object
  ->
state stores image / template / fields / selectedSizes
  ->
renderer calls template.render() per size
  ->
Canvas previews all fixed Chrome sizes
  ->
download exports one or more PNGs
  ->
storage saves history
```

API needs:

- MVP does not need an API.
- Future AI features may require a server API, browser-side model, cost controls, and a paid plan.

Suggested product path:

```text
V1: Pure template composition
V2: Lightweight browser-side background removal
V3: Third-party AI API as a paid feature
V4: Template marketplace, batch generation, account sync
```

## 10. Business Model Ideas

MVP can launch free to validate demand and template direction.

Potential paid features:

- Premium template packs.
- High-resolution export.
- Batch generation.
- Watermark removal.
- AI background removal or replacement.
- Commercial asset packs.
- Channel-specific template bundles for Chrome Store, social, and ecommerce.

Early pricing options:

- Free: basic templates plus limited daily exports.
- Pro one-time purchase: more templates and HD export.
- Pro subscription: AI features, batch generation, and ongoing template updates.

## 11. MVP Milestones

Milestone 1: Core generation flow.

- Finish image upload.
- Implement one template.
- Render Canvas previews.
- Preview three Chrome Store sizes.
- Download one PNG.

Milestone 2: Template system.

- Abstract template configuration.
- Add multiple templates.
- Support editable copy fields.
- Support Live Preview card selection and batch preview.

Milestone 3: Export experience.

- Download current size.
- Download all selected preview cards.
- Name files by template and size.
- Improve multi-size rendering performance.

Milestone 4: Extension experience.

- Connect the Chrome Extension panel.
- Add history.
- Improve empty states, errors, and loading states.

Milestone 5: Store readiness.

- Prepare Chrome Store icons, promotional images, and listing copy.
- Write the privacy explanation.
- Package the extension.
- Test local installation.

## 12. Acceptance Checklist

- Users can open the generator from the extension action.
- Users can upload one image.
- Users can choose from multiple templates.
- Users can edit title, subtitle, badge, and CTA or feature copy.
- Users can select multiple preview cards from Live Preview.
- Users can see live multi-size previews.
- Each MVP template has default copy, default theme color, and a preview thumbnail.
- Each MVP template adapts layout for its supported aspect ratios.
- Text remains readable in the smallest supported export size.
- Template field controls change based on the selected template.
- Users can export a single PNG.
- Users can export all selected PNGs.
- Each exported image has the correct dimensions.
- History can save and restore records.
- The flow does not depend on external APIs.
- Extension permissions stay minimal.

## 13. Template QA Checklist

Before a template is considered production-ready:

- Test with a landscape screenshot, portrait image, square image, and transparent PNG.
- Test with empty copy, short copy, and maximum-length copy.
- Test all supported export sizes from the same template state.
- Confirm title, subtitle, badge, CTA, and uploaded image do not overlap.
- Confirm text contrast is readable on both light and dark theme colors.
- Confirm exported PNG dimensions match the selected export size exactly.
- Confirm the template still looks acceptable when previewed at small card size.
- Confirm history restore reproduces the same template, fields, sizes, and image fit mode.

## 14. Key Risks

- Template quality may feel too generic if visual polish is low.
- Local-only composition cannot solve advanced cutout or scene-blending needs.
- Long copy and varied image ratios make multi-size layout adaptation harder.
- The template system can become difficult to extend if each template introduces unique field logic.
- Poor text fitting rules can make generated assets look broken for real user copy.
- Chrome Web Store review requires clear privacy and purpose messaging.
- Future AI API features require new cost controls and monetization design.

## 15. Recommended Next Step

Build the narrowest MVP first: a Chrome Store multi-size promotional image generator.

The first version should support:

```text
Upload screenshot
Choose Chrome Store template
Enter title and subtitle
Generate 1280x800 / 1400x560 / 440x280
Download one PNG or all PNGs
```

After this flow works well, expand into social covers, product images, and ad creatives.
