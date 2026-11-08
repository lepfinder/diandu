import type { Book, Chapter, CorpusKind } from './types';
import { CORPUS_LABEL } from './types';
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
    kind: c.kind,
  }));
}

export function getChaptersByKind(kind: CorpusKind): Chapter[] {
  return book.chapters.filter((c) => c.kind === kind);
}

export function findChapterByTitle(title: string): Chapter | null {
  return book.chapters.find((c) => c.t1 === title || c.title === title) ?? null;
}

export function kindLabel(kind: CorpusKind): string {
  return CORPUS_LABEL[kind];
}

export const CORPUS_ORDER: CorpusKind[] = ['benji', 'biao', 'shu', 'shijia', 'liezhuan'];
