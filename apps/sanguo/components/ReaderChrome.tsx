'use client';

import { ReaderChrome as ClassicReader } from '@classic/reader';
import Link from '@/components/Link';
import { ReadRelated } from '@/components/ReadRelated';
import { getSanguoSocialLayer } from '@/lib/weread-social';
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
  const social = getSanguoSocialLayer();

  return (
    <ClassicReader
      storagePrefix="sg"
      bookTitle="三国笔记"
      chapter={chapter}
      toc={toc}
      tocUrl={tocUrl}
      prev={prev}
      next={next}
      linkComponent={Link}
      features={{ notes: true }}
      social={social}
      headerExtra={<ReadRelated chapterN={chapter.n} mode="header" />}
      footer={<ReadRelated chapterN={chapter.n} mode="footer" />}
    />
  );
}
