'use client';

import { ReaderChrome as ClassicReader } from '@classic/reader';
import Link from '@/components/Link';
import type { Chapter, TocItem } from '@/lib/types';

export function ReaderChrome({
  chapter,
  prev,
  next,
  toc,
}: {
  chapter: Chapter;
  prev: { n: number; label: string; t1: string } | null;
  next: { n: number; label: string; t1: string } | null;
  toc: TocItem[];
}) {
  return (
    <ClassicReader
      storagePrefix="lz"
      bookTitle="聊斋笔记"
      chapter={chapter}
      toc={toc}
      prev={prev}
      next={next}
      linkComponent={Link}
      features={{ notes: true }}
    />
  );
}
