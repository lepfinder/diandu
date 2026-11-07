/**
 * next/image custom loader：unoptimized 静态导出不会自动加 basePath。
 * @param {{ src: string, width?: number, quality?: number }} params
 */
export default function classicImageLoader({ src }) {
  if (!src || /^(https?:|data:|blob:)/i.test(src)) return src;
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  if (!base || !src.startsWith('/')) return src;
  if (src === base || src.startsWith(`${base}/`)) return src;
  return `${base}${src}`;
}
