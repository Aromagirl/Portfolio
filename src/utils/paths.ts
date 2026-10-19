/** Prefix local URLs with Astro's base; preserve external URLs and page anchors. */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (!path.startsWith('/') || path.startsWith('//') || !base || path === base || path.startsWith(`${base}/`)) return path;
  return `${base}${path}`;
}
