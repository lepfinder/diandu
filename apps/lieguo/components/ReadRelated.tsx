'use client';

import { useMemo } from 'react';
import { ReadRelated as ClassicReadRelated } from '@classic/reader';
import Link from '@/components/Link';
import { MapLink } from '@/components/MapLink';
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
  const topics = useMemo(() => getTopics(), []);
  const scenesHere = useMemo(
    () => topics.scenes.filter((scene) => scene.chapter === chapterN),
    [topics, chapterN],
  );
  const idiomsHere = useMemo(
    () => topics.idioms.filter((item) => item.chapter === chapterN),
    [topics, chapterN],
  );
  const placesHere = useMemo(
    () => topics.places.filter((item) => item.chapter === chapterN),
    [topics, chapterN],
  );
  const debuts = useMemo(
    () => getPeople().filter((person) => person.firstCh === chapterN).slice(0, 12),
    [chapterN],
  );

  const header =
    scenesHere[0]
      ? {
          href: '/topics/scenes/',
          label: `名篇 · ${scenesHere[0].title}`,
          badge: '本回名篇',
        }
      : idiomsHere[0]
        ? {
            href: '/topics/idioms/',
            label: `成语 · ${idiomsHere[0].idiom}`,
            badge: '本回成语',
          }
        : placesHere[0]
          ? {
              href: '/topics/places/',
              label: `地名 · ${placesHere[0].ancient}`,
              badge: '本回地名',
            }
          : {
              href: '/topics/eras/',
              label: '时代',
            };

  const mapAnchor = scenesHere[0]?.map ?? idiomsHere[0]?.map ?? placesHere[0]?.map;

  return (
    <>
      {(mode === 'header' || mode === 'all') && mapAnchor ? <MapLink anchor={mapAnchor} /> : null}
      <ClassicReadRelated
        mode={mode}
        linkComponent={Link}
        header={header}
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
            type: 'cards',
            label: '成语',
            items: idiomsHere.map((item) => ({
              id: item.id,
              title: item.idiom,
              text: item.gloss,
              href: '/topics/idioms/',
            })),
          },
          {
            type: 'cards',
            label: '地名',
            items: placesHere.map((item) => ({
              id: item.id,
              title: item.ancient,
              text: `今 · ${item.modern}`,
              href: '/topics/places/',
            })),
          },
          {
            type: 'people',
            label: '本回人物',
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
