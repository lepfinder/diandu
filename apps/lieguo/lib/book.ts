import type { Book, Chapter } from './types';
import bookJson from '@/data/book.json';

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
    volume: c.volume,
  }));
}

export function findChapterByTitle(title: string): Chapter | null {
  return book.chapters.find((c) => c.t1 === title || c.title === title) ?? null;
}
