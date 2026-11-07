'use client';

import { ReaderChrome as ClassicReader } from '@classic/reader';
import Link from '@/components/Link';
import type { Chapter, TocItem } from '@/lib/types';

const tocUrl = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/data/toc.json`;

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
      storagePrefix="jp"
      bookTitle="金瓶笔记"
      chapter={chapter}
      toc={toc}
      tocUrl={tocUrl}
      prev={prev}
      next={next}
      linkComponent={Link}
      features={{ notes: true }}
    />
  );
}
