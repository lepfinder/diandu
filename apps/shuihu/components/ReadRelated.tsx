'use client';

import { useMemo } from 'react';
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

  const header = (
    <div className="read-context">
      <Link href="/topics/path/">聚义 · {station.name}</Link>
      {stationHere ? <span>本回起站</span> : null}
    </div>
  );

  const footer = (debuts.length > 0 || scenesHere.length > 0 || stationHere) ? (
    <section className="read-related">
      <div className="related-head">读到这里</div>
      {stationHere ? (
        <div className="related-block">
          <div className="related-label">聚义</div>
          <Link className="related-card" href="/topics/path/">
            <strong>{station.name}</strong>
            <span>{station.blurb}</span>
          </Link>
        </div>
      ) : null}
      {scenesHere.length > 0 ? (
        <div className="related-block">
          <div className="related-label">名场面</div>
          <div className="related-scenes">
            {scenesHere.map((scene) => (
              <article key={scene.id} className="related-scene">
                {scene.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset(scene.image)} alt="" />
                ) : (
                  <div className="related-scene-plate" aria-hidden="true">{scene.plate}</div>
                )}
                <div>
                  <strong>{scene.title}</strong>
                  <p>{scene.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
      {debuts.length > 0 ? (
        <div className="related-block">
          <div className="related-label">本回新写到</div>
          <div className="related-chips">
            {debuts.map((person) => (
              <Link key={person.id} href="/characters/">
                {person.name}
                {person.nick ? ` · ${person.nick}` : ''}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  ) : null;

  if (mode === 'header') return header;
  if (mode === 'footer') return footer;
  return (
    <>
      {header}
      {footer}
    </>
  );
}
