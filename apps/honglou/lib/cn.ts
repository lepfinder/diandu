import type { Chapter } from './types';

export function toCN(n: number): string {
  const d = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  if (n <= 0) return String(n);
  if (n <= 10) return n === 10 ? '十' : d[n];
  if (n < 20) return '十' + d[n % 10];
  if (n < 100) return d[Math.floor(n / 10)] + '十' + (n % 10 ? d[n % 10] : '');
  if (n === 100) return '一百';
  if (n < 110) return '一百零' + d[n % 10];
  if (n === 110) return '一百一十';
  if (n < 120) return '一百一十' + d[n % 10];
  return '一百二十';
}

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type TocItem = {
  n: number;
  label: string;
  title: string;
  t1: string;
  t2: string;
};

export function searchInChapters(chapters: Chapter[], q: string, limit = 80) {
  const query = q.trim();
  type Hit = {
    n: number;
    label: string;
    title: string;
    snip: string;
    kind: 'title' | 'body';
  };
  if (!query) return [] as Hit[];

  const results: Hit[] = [];

  for (const c of chapters) {
    if ((c.title + c.label + c.t1 + c.t2).includes(query)) {
      results.push({
        n: c.n,
        label: c.label,
        title: c.t1,
        snip: `<em>回目匹配</em>　${c.t1}　${c.t2}`,
        kind: 'title',
      });
    }
  }

  for (const c of chapters) {
    for (const p of c.paras) {
      if (!p.includes(query)) continue;
      const idx = p.indexOf(query);
      const start = Math.max(0, idx - 30);
      const end = Math.min(p.length, idx + query.length + 40);
      results.push({
        n: c.n,
        label: c.label,
        title: c.t1,
        snip:
          (start > 0 ? '…' : '') +
          escapeHtml(p.slice(start, idx)) +
          `<em>${escapeHtml(query)}</em>` +
          escapeHtml(p.slice(idx + query.length, end)) +
          (end < p.length ? '…' : ''),
        kind: 'body',
      });
      if (results.length >= limit * 2) break;
    }
    if (results.length >= limit * 2) break;
  }

  return results.slice(0, limit);
}
