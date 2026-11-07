'use client';

import { useMemo } from 'react';
import { ReadRelated as ClassicReadRelated } from '@classic/reader';
import Link from '@/components/Link';
import { getPeople } from '@/lib/characters';
import { actForChapter, getTopics } from '@/lib/topics';
import { asset } from '@classic/ui';

export function ReadRelated({
  chapterN,
  mode = 'all',
}: {
  chapterN: number;
  mode?: 'header' | 'footer' | 'all';
}) {
  const act = actForChapter(chapterN);
  const topics = getTopics();
  const eventsHere = useMemo(
    () => topics.events.filter((item) => item.chapter === chapterN),
    [chapterN, topics.events],
  );
  const scenesHere = useMemo(
    () => topics.scenes.filter((scene) => scene.chapter === chapterN),
    [chapterN, topics.scenes],
  );
  const relicsHere = useMemo(
    () => topics.relics.filter((relic) => relic.chapter === chapterN),
    [chapterN, topics.relics],
  );
  const debuts = useMemo(
    () => getPeople().filter((person) => person.firstCh === chapterN).slice(0, 12),
    [chapterN],
  );

  return (
    <ClassicReadRelated
      mode={mode}
      linkComponent={Link}
      header={{
        href: '/topics/events/',
        label: act.title,
        badge: eventsHere.length > 0 ? '本回大事' : undefined,
      }}
      blocks={[
        {
          type: 'cards',
          label: '大事',
          items: eventsHere.map((item) => ({
            id: item.id,
            href: '/topics/events/',
            title: item.title,
            text: item.blurb,
          })),
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
          label: '兵器坐骑',
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
            name: person.name,
            href: '/characters/',
          })),
        },
      ]}
    />
  );
}
