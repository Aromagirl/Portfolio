import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const schema = z.object({
  title: z.string(),
  summary: z.string(),
  sourceUrl: z.string().url(),
  status: z.enum(['published', 'archived', 'draft']),
  featured: z.boolean(),
  sortOrder: z.number(),
  category: z.string(),
  cover: z.string().nullable(),
});

export const collections = {
  projects: defineCollection({ loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }), schema }),
  home: defineCollection({ loader: glob({ pattern: '**/*.mdx', base: './src/content/home' }), schema }),
};
