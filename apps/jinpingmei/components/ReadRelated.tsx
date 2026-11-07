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
  const timelineHere = useMemo(
    () => getTopics().timeline.filter((item) => item.chapter === chapterN),
    [chapterN],
  );
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
        href: '/topics/timeline/',
        label: act.title,
        badge: timelineHere.length > 0 ? '本回节点' : undefined,
      }}
      blocks={[
        {
          type: 'cards',
          label: '年表',
          items: timelineHere.map((item) => ({
            id: item.id,
            href: '/topics/timeline/',
            title: item.title,
            text: item.text,
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
