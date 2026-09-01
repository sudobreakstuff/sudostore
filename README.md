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

- **Cloudflare Pages (production):** `.github/workflows/deploy-cloudflare.yml`
  builds and deploys to `sudostore.pages.dev` / `sudostore.co.za` on every push
  to `main`, using the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
  repo secrets.
- **GitHub Pages (preview):** `.github/workflows/deploy.yml` also builds on
  every push to `main`. The base path is set automatically, so the preview
  lives at `sudobreakstuff.github.io/sudostore/`.

Both builds inject `SITE_URL=https://sudostore.co.za` and `BASE_PATH=/`. For
local previews, GitHub Pages uses its own base path via the workflow.
