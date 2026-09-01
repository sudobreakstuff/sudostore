import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const products = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/products" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      tagline: z.string(),
      description: z.string(),
      image: image().optional(),
      price: z.number().optional(),
      priceNote: z.string().optional(),
      category: z.enum([
        "handhelds",
        "card-readers",
        "input-devices",
        "3d-printing",
        "software-services",
      ]),
      status: z.enum(["in-stock", "made-to-order", "pre-order", "sold-out"]).default("in-stock"),
      featured: z.boolean().default(false),
      specs: z.array(z.string()).default([]),
      tags: z.array(z.string()).default([]),
    }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tech: z.array(z.string()).default([]),
    repo: z.string().url(),
    demo: z.string().url().optional(),
    featured: z.boolean().default(false),
  }),
});

const learn = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/learn" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.coerce.date(),
    level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { products, projects, learn };
