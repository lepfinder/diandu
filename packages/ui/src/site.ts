/** 正式站域名；构建时可被 NEXT_PUBLIC_SITE_URL 覆盖。 */
export const DEFAULT_SITE_URL = 'https://diandu.xiaonuan.me';

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  return raw.replace(/\/$/, '');
}

export function absoluteUrl(path = '/') {
  const base = getSiteUrl();
  if (!path || path === '/') return `${base}/`;
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}
