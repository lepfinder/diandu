'use client';

import { useMemo } from 'react';
import { ReadRelated as ClassicReadRelated } from '@classic/reader';
import Link from '@/components/Link';
import { getPeople } from '@/lib/characters';
import { getTopics } from '@/lib/topics';
import { asset } from '@classic/ui';

export function ReadRelated({
  chapterN,
  mode = 'all',
}: {
  chapterN: number;
  mode?: 'header' | 'footer' | 'all';
}) {
  const scenesHere = useMemo(
    () => getTopics().scenes.filter((scene) => scene.chapter === chapterN),
    [chapterN],
  );
  const debuts = useMemo(
    () => getPeople().filter((person) => person.firstCh === chapterN).slice(0, 12),
    [chapterN],
  );

  return (
    <ClassicReadRelated
      mode={mode}
      linkComponent={Link}
      header={
        scenesHere[0]
          ? {
              href: '/topics/scenes/',
              label: `名篇 · ${scenesHere[0].title}`,
              badge: '本回名篇',
            }
          : {
              href: '/topics/kinds/',
              label: '品类',
            }
      }
      blocks={[
        {
          type: 'scenes',
          label: '名篇',
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
