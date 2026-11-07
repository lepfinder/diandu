'use client';

import { useMemo } from 'react';
import { ReadRelated as ClassicReadRelated } from '@classic/reader';
import Link from '@/components/Link';
import { actForChapter, getCharacters } from '@/lib/content';

export function ReadRelated({
  chapterN,
  mode = 'all',
}: {
  chapterN: number;
  mode?: 'header' | 'footer' | 'all';
}) {
  const act = actForChapter(chapterN);
  const debuts = useMemo(
    () => getCharacters().filter((person) => person.firstCh === chapterN).slice(0, 12),
    [chapterN],
  );

  return (
    <ClassicReadRelated
      mode={mode}
      linkComponent={Link}
      header={{
        href: '/topics/background/',
        label: act.title,
        badge: debuts.length > 0 ? '本回新人' : undefined,
      }}
      blocks={[
        {
          type: 'people',
          label: '本回新写到',
          items: debuts.map((person) => ({
            id: person.id,
            name: person.name,
            href: '/characters/',
          })),
        },
      ]}
    />
  );
}
