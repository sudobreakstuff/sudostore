import type { APIRoute } from "astro";
import { BASE } from "../lib/site";

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL(`${BASE}sitemap-index.xml`, site).toString();
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
