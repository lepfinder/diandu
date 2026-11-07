'use client';

import { ReaderChrome as ClassicReader } from '@classic/reader';
import Link from '@/components/Link';
import { ContinueReading } from '@/components/ContinueReading';
import { useHonglouBodyClick } from '@/components/CharacterOverlays';
import { ReadRelated } from '@/components/ReadRelated';
import { decorateHonglouPlain } from '@/lib/char-marks';
import { getHonglouSocialLayer } from '@/lib/weread-social';
import type { Chapter } from '@/lib/types';
import type { TocItem } from '@/lib/cn';

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
  const { onBodyClick, overlays } = useHonglouBodyClick();
  const social = getHonglouSocialLayer();

  return (
    <ClassicReader
      storagePrefix="hl"
      bookTitle="红楼笔记"
      chapter={chapter}
      toc={toc}
      tocUrl={tocUrl}
      prev={prev}
      next={next}
      linkComponent={Link}
      features={{ notes: true }}
      social={social}
      decoratePlain={decorateHonglouPlain}
      onBodyClick={onBodyClick}
      tocLead={<ContinueReading currentN={chapter.n} />}
      overlays={overlays}
      headerExtra={<ReadRelated chapterN={chapter.n} mode="header" />}
      footer={<ReadRelated chapterN={chapter.n} mode="footer" />}
    />
  );
}
