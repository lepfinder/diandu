'use client';

import { useMemo } from 'react';
import { ReadRelated as ClassicReadRelated } from '@classic/reader';
import Link from '@/components/Link';
import { getPeople } from '@/lib/characters';
import { getTopics, stationAt } from '@/lib/topics';
import { asset } from '@classic/ui';

export function ReadRelated({
  chapterN,
  mode = 'all',
}: {
  chapterN: number;
  mode?: 'header' | 'footer' | 'all';
}) {
  const station = stationAt(chapterN);
  const stationHere = station.chapter === chapterN;
  const debuts = useMemo(
    () => getPeople().filter((person) => person.firstCh === chapterN).slice(0, 12),
    [chapterN],
  );
  const scenesHere = useMemo(
    () => getTopics().scenes.filter((scene) => scene.chapter === chapterN),
    [chapterN],
  );

  return (
    <ClassicReadRelated
      mode={mode}
      linkComponent={Link}
      header={{
        href: '/topics/path/',
        label: `聚义 · ${station.name}`,
        badge: stationHere ? '本回起站' : undefined,
      }}
      blocks={[
        {
          type: 'cards',
          label: '聚义',
          items: stationHere
            ? [
                {
                  id: station.id,
                  href: '/topics/path/',
                  title: station.name,
                  text: station.blurb,
                },
              ]
            : [],
        },
        {
          type: 'scenes',
          label: '名场面',
          items: scenesHere.map((scene) => ({
            id: scene.id,
            title: scene.title,
            summary: scene.summary,
            imageSrc: scene.image ? asset(scene.image) : undefined,
            plate: scene.plate,
          })),
        },
        {
          type: 'people',
          label: '本回新写到',
          items: debuts.map((person) => ({
            id: person.id,
            name: person.name,
            href: '/characters/',
            note: person.nick || undefined,
          })),
        },
      ]}
    />
  );
}
