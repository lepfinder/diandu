import type { Book, Chapter } from './types';
import bookJson from '@/data/book.json';
import { escapeHtml } from './cn';

export { toCN, escapeHtml } from './cn';

const book = bookJson as Book;

export function getBook(): Book {
  return book;
}

export function getChapter(n: number): Chapter | null {
  return book.chapters.find((c) => c.n === n) ?? null;
}

export function getChapterList() {
  return book.chapters.map((c) => ({
    n: c.n,
    label: c.label,
    title: c.title,
    t1: c.t1,
    t2: c.t2,
  }));
}

export function searchBook(q: string, limit = 80) {
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

  for (const c of book.chapters) {
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

  for (const c of book.chapters) {
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
