import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';

export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  integrations: [mdx()],
  markdown: { processor: satteri({ features: { smartPunctuation: false } }) },
});
