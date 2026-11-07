/** 静态资源路径：组装部署时补上 NEXT_PUBLIC_BASE_PATH。 */
export function asset(src: string): string {
  if (!src || /^(https?:|data:|blob:)/i.test(src)) return src;
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  if (!base || !src.startsWith('/')) return src;
  if (src === base || src.startsWith(`${base}/`)) return src;
  return `${base}${src}`;
}
