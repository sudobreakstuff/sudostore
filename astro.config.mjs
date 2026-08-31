// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

// https://astro.build/config
// NOTE: `site` and `base` are injected automatically by the GitHub Pages
// deploy workflow (withastro/action reads actions/configure-pages). Leave
// them unset here so local dev and Cloudflare Pages (custom domain) need no
// base path.
export default defineConfig({
  integrations: [icon()],
  vite: {
    plugins: [tailwindcss()],
  },
});
