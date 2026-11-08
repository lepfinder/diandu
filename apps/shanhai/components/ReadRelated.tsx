'use client';

import { useMemo } from 'react';
import { ReadRelated as ClassicReadRelated } from '@classic/reader';
import Link from '@/components/Link';
import { getPeople } from '@/lib/characters';
import { getTopics, regionAt } from '@/lib/topics';

export function ReadRelated({
  chapterN,
  mode = 'all',
}: {
  chapterN: number;
  mode?: 'header' | 'footer' | 'all';
}) {
  const region = regionAt(chapterN);
  const regionHere = region.chapter === chapterN;
  const topics = getTopics();
  const debuts = useMemo(
    () => getPeople().filter((person) => person.firstCh === chapterN).slice(0, 12),
    [chapterN],
  );
  const scenesHere = useMemo(
    () => topics.scenes.filter((scene) => scene.chapter === chapterN),
    [chapterN, topics.scenes],
  );

  return (
    <ClassicReadRelated
      mode={mode}
      linkComponent={Link}
      header={{
        href: '/topics/regions/',
        label: `方位 · ${region.name}`,
        badge: regionHere ? '本篇' : undefined,
      }}
      blocks={[
        {
          type: 'cards',
          label: '方位',
          items: regionHere
            ? [
                {
                  id: region.id,
                  href: '/topics/regions/',
                  title: region.name,
                  text: region.blurb,
                },
              ]
            : [],
        },
        {
          type: 'scenes',
          label: '名物',
          items: scenesHere.map((scene) => ({
            id: scene.id,
            title: scene.title,
            summary: scene.summary,
            plate: scene.plate,
          })),
        },
        {
          type: 'people',
          label: '本篇新写到',
          items: debuts.map((person) => ({
            id: person.id,
            href: '/characters/',
            name: person.name,
            role: person.role,
          })),
        },
      ]}
    />
  );
}
