import { asset } from './asset';

export type BookPayload = {
  chapters: Array<{
    n: number;
    label: string;
    t1: string;
    t2?: string;
    title?: string;
    paras: string[];
  }>;
};

declare global {
  interface Window {
    __BOOK__?: BookPayload;
  }
}

/** 懒加载全文索引：优先复用 window.__BOOK__，否则拉 /data/book.js */
export function loadBookScript(): Promise<BookPayload | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.__BOOK__) return Promise.resolve(window.__BOOK__);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-classic-book]');
    if (existing) {
      const done = () => resolve(window.__BOOK__ || null);
      if (window.__BOOK__) {
        done();
        return;
      }
      existing.addEventListener('load', done, { once: true });
      existing.addEventListener('error', () => resolve(null), { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src = asset('/data/book.js');
    s.dataset.classicBook = '1';
    s.onload = () => resolve(window.__BOOK__ || null);
    s.onerror = () => resolve(null);
    document.body.appendChild(s);
  });
}
