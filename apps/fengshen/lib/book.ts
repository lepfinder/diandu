import type { Book, Chapter } from './types';
import bookJson from '@/data/book.json';
import { phaseLabel } from './phases';

const book = bookJson as Book;

function withPhase(chapter: Chapter): Chapter {
  const t2 = chapter.t2?.trim() ? chapter.t2 : phaseLabel(chapter.n);
  return { ...chapter, t2 };
}

export function getBook(): Book {
  return book;
}

export function getChapter(n: number): Chapter | null {
  const chapter = book.chapters.find((c) => c.n === n);
  return chapter ? withPhase(chapter) : null;
}

export function getChapterList() {
  return book.chapters.map((c) => {
    const chapter = withPhase(c);
    return {
      n: chapter.n,
      label: chapter.label,
      title: chapter.title,
      t1: chapter.t1,
      t2: chapter.t2,
    };
  });
}
