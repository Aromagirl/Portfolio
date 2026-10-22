import { createReadStream } from 'node:fs';
import { cp, readdir, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Keep editable project images beside their Markdown and publish them at stable URLs.
export default function projectImages() {
  let projectsRoot;
  let base;
  return {
    name: 'project-images',
    hooks: {
      'astro:config:done': ({ config }) => {
        projectsRoot = fileURLToPath(new URL('src/content/projects/', config.root));
        base = config.base.replace(/\/$/, '');
      },
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(async (request, response, next) => {
          let pathname;
          try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
          catch { return next(); }
          if (base && pathname.startsWith(base + '/')) pathname = pathname.slice(base.length);
          const match = pathname.match(/^\/images\/projects\/([a-z0-9-]+)\/(.+)$/);
          if (!match || !['GET', 'HEAD'].includes(request.method)) return next();
          const imagesRoot = resolve(projectsRoot, match[1], 'images');
          const file = resolve(imagesRoot, match[2]);
          if (!file.startsWith(imagesRoot + sep)) return next();
          try {
            const info = await stat(file);
            if (!info.isFile()) return next();
            const mime = { '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.avif': 'image/avif' };
            response.setHeader('Content-Type', mime[extname(file).toLowerCase()] ?? 'application/octet-stream');
            response.setHeader('Content-Length', info.size);
            response.setHeader('Cache-Control', 'no-cache');
            if (request.method === 'HEAD') return response.end();
            createReadStream(file).on('error', error => response.destroy(error)).pipe(response);
          } catch (error) {
            if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return next();
            next(error);
          }
        });
      },
      'astro:build:done': async ({ dir }) => {
        for (const project of await readdir(projectsRoot, { withFileTypes: true })) {
          if (!project.isDirectory()) continue;
          const source = join(projectsRoot, project.name, 'images');
          try { await stat(source); }
          catch (error) { if (error.code === 'ENOENT') continue; throw error; }
          await cp(source, join(fileURLToPath(dir), 'images', 'projects', project.name), { recursive: true });
        }
      },
    },
  };
}
