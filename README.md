# TemplatePic

A local-first image template generator built with React, Next.js App Router, and TypeScript.

## Features

- Upload PNG, JPG, or WebP images locally.
- Choose from 5 built-in templates.
- Edit title, subtitle, badge, CTA, price, theme color, and image fit mode.
- Preview multiple output sizes with Canvas.
- Download single PNGs or all selected sizes.
- Save and restore the latest 10 generation records from localStorage.
- Static export friendly for a Chrome Extension popup.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The static extension-ready output is generated in `out/`.
