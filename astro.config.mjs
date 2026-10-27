import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import tailwindcss from '@tailwindcss/vite';
import projectImages from './src/integrations/project-images.mjs';

export default defineConfig({
  site: 'https://aromagirl.github.io',
  base: '/portfolio',
  output: 'static',
  trailingSlash: 'always',
  integrations: [mdx(), projectImages()],
  markdown: { processor: satteri({ features: { smartPunctuation: false } }) },
  vite: { plugins: [tailwindcss()] },
});
