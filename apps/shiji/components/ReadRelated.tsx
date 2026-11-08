'use client';

import { useMemo } from 'react';
import { ReadRelated as ClassicReadRelated } from '@classic/reader';
import Link from '@/components/Link';
import { MapLink } from '@/components/MapLink';
import { getChapter } from '@/lib/book';
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
  const chapter = getChapter(chapterN);
  const scenesHere = useMemo(
    () => getTopics().scenes.filter((scene) => scene.chapter === chapterN),
    [chapterN],
  );
  const debuts = useMemo(
    () => getPeople().filter((person) => person.firstCh === chapterN).slice(0, 12),
    [chapterN],
  );

  const mapExtra =
    mode === 'header' || mode === 'all' ? (
      <span style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <MapLink anchor={chapter?.map} />
        {scenesHere[0]?.map ? <MapLink anchor={scenesHere[0].map} className="btn ghost sm" /> : null}
      </span>
    ) : null;

  return (
    <>
      {mapExtra}
      <ClassicReadRelated
        mode={mode}
        linkComponent={Link}
        header={
          scenesHere[0]
            ? {
                href: '/topics/scenes/',
                label: `名篇 · ${scenesHere[0].title}`,
                badge: '本篇名篇',
              }
            : {
                href: '/topics/corpus/',
                label: '五体',
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
            label: '本篇人物',
            items: debuts.map((person) => ({
              id: person.id,
              name: person.name,
              href: '/characters/',
            })),
          },
        ]}
      />
    </>
  );
}
