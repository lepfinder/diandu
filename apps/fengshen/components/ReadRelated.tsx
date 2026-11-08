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
  const topics = getTopics();
  const debuts = useMemo(
    () => getPeople().filter((person) => person.firstCh === chapterN).slice(0, 12),
    [chapterN],
  );
  const scenesHere = useMemo(
    () => topics.scenes.filter((scene) => scene.chapter === chapterN),
    [chapterN, topics.scenes],
  );
  const relicsHere = useMemo(
    () => topics.relics.filter((relic) => relic.chapter === chapterN),
    [chapterN, topics.relics],
  );

  return (
    <ClassicReadRelated
      mode={mode}
      linkComponent={Link}
      header={{
        href: '/topics/route/',
        label: `征途 · ${station.name}`,
        badge: stationHere ? '本回到站' : undefined,
      }}
      blocks={[
        {
          type: 'cards',
          label: '征途',
          items: stationHere
            ? [
                {
                  id: station.id,
                  href: '/topics/route/',
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
          type: 'cards',
          label: '法宝',
          items: relicsHere.map((relic) => ({
            id: relic.id,
            href: '/topics/relics/',
            title: relic.name,
            text: `${relic.kind} · ${relic.owner}。${relic.blurb}`,
          })),
        },
        {
          type: 'people',
          label: '本回新写到',
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
