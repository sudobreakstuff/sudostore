// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
//
// `site` and `base` default to GitHub Pages values (project site under
// `/sudostore/`). For Cloudflare Pages + custom domain, set these in the
// Cloudflare build environment:
//   SITE_URL  = https://sudostore.co.za
//   BASE_PATH = /
export default defineConfig({
  site: process.env.SITE_URL || 'https://sudobreakstuff.github.io',
  base: process.env.BASE_PATH ?? '/sudostore/',
  integrations: [icon(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
