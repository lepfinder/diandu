import type { Chapter } from './types';

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function searchInChapters(chapters: Chapter[], q: string, limit = 80) {
  const query = q.trim();
  type Hit = {
    n: number;
    label: string;
    title: string;
    snip: string;
    kind: 'title' | 'body';
    para?: number;
  };
  if (!query) return [] as Hit[];

  const results: Hit[] = [];

  for (const c of chapters) {
    if ((c.title + c.label + c.t1 + c.t2).includes(query)) {
      results.push({
        n: c.n,
        label: c.label,
        title: c.t1,
        snip: `<em>回目匹配</em>　${escapeHtml(c.t1)}　${escapeHtml(c.t2)}`,
        kind: 'title',
      });
    }
  }

  for (const c of chapters) {
    c.paras.forEach((p, para) => {
      if (!p.includes(query)) return;
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
        para,
      });
    });
    if (results.length >= limit * 2) break;
  }

  return results.slice(0, limit);
}
