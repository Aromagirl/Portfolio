import { createReadStream } from 'node:fs';
import { copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const mime = { '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.avif': 'image/avif' };

// Company media lives beside index.md; project media beside projects/<slug>/<slug>.md.
// Public image URLs stay unchanged when the editable content folders move.
export default function projectImages() {
  let companiesRoot;
  let base;
  return {
    name: 'project-images',
    hooks: {
      'astro:config:done': ({ config }) => {
        companiesRoot = fileURLToPath(new URL('src/content/companies/', config.root));
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
          if (!mime[extname(match[2]).toLowerCase()]) return next();
          const companyRoot = resolve(companiesRoot, match[1]);
          const parts = match[2].split('/');
          const mediaRoot = parts.length > 1 ? join(companyRoot, 'projects') : companyRoot;
          const file = resolve(mediaRoot, ...parts);
          if (!file.startsWith(mediaRoot + sep)) return next();
          try {
            const info = await stat(file);
            if (!info.isFile()) return next();
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
        async function copyMedia(source, target, recursive = false) {
          for (const entry of await readdir(source, { withFileTypes: true })) {
            if (entry.isDirectory() && recursive) {
              await copyMedia(join(source, entry.name), join(target, entry.name), true);
            } else if (entry.isFile() && mime[extname(entry.name).toLowerCase()]) {
              await mkdir(target, { recursive: true });
              await copyFile(join(source, entry.name), join(target, entry.name));
            }
          }
        }
        for (const company of await readdir(companiesRoot, { withFileTypes: true })) {
          if (!company.isDirectory()) continue;
          const source = join(companiesRoot, company.name);
          const target = join(fileURLToPath(dir), 'images', 'projects', company.name);
          await copyMedia(source, target);
          const projects = join(source, 'projects');
          try { await stat(projects); }
          catch (error) { if (error.code === 'ENOENT') continue; throw error; }
          await copyMedia(projects, target, true);
        }
      },
    },
  };
}
