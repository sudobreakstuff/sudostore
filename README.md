# sudostore

The storefront for [sudostore.co.za](https://sudostore.co.za) — cool tech, fair
prices, open source. Built with Astro + Tailwind, deployed on Cloudflare Pages
(via GitHub Pages until the domain is live).

## Stack

- **Astro** (static site)
- **Tailwind CSS v4**
- **Lucide icons** via `astro-icon` (no emojis)
- **Fonts:** Space Grotesk + JetBrains Mono (self-hosted via Fontsource)

## Run locally

```sh
npm install
npm run dev
```

Production build:

```sh
npm run build
npm run preview
```

## Adding content

Everything is plain Markdown. Edit the files and push — the site rebuilds
automatically.

- **Products:** `src/content/products/*.md` (see `src/content.config.ts` for fields)
- **Projects:** `src/content/projects/*.md`
- **Learn guides:** `src/content/learn/*.md`

Product frontmatter example:

```yaml
---
title: "SudoDeck"
tagline: "Wireless macro keyboard"
description: "..."
image: ./sudodeck.jpg       # put the photo in src/content/products/ next to this file
price: 1099
category: "input-devices"   # handhelds | card-readers | input-devices | 3d-printing | software-services
status: "in-stock"          # in-stock | made-to-order | pre-order | sold-out
featured: true
specs:
  - "ESP32 + touchscreen"
tags: ["macro-keyboard"]
---
```

**Adding a product photo:** drop the image file into `src/content/products/`
and reference it with `image: ./filename.jpg` in the product's frontmatter.
Images are auto-optimized to WebP at build time. Products without an image
show a clean category icon placeholder.

## Deploy

- **GitHub Pages:** `.github/workflows/deploy.yml` builds and deploys on every
  push to `main`. The base path is set automatically, so the site lives at
  `sudobreakstuff.github.io/sudostore/`.
- **Cloudflare Pages:** point a Pages project at this repo, set the build
  command to `npm run build` and output directory to `dist`. No base path
  needed for a custom domain.
