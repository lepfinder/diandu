'use client';

import { useState } from 'react';
import { Face } from '@/components/Face';
import Link from '@/components/Link';
import { getGroup, getHeroes, type Person } from '@/lib/characters';
import { chapterLabel } from '@/lib/label';
import type { TocItem } from '@/lib/types';

export function SeatHall({ toc }: { toc: TocItem[] }) {
  const heroes = getHeroes();
  const tian = heroes.filter((hero) => (hero.seat ?? 0) <= 36);
  const di = heroes.filter((hero) => (hero.seat ?? 0) > 36);
  const max = toc[toc.length - 1]?.n ?? 120;
  const [chapter, setChapter] = useState(71);
  const [selectedId, setSelectedId] = useState(heroes[0]?.id ?? '');
  const current = toc.find((item) => item.n === chapter);
  const selected = heroes.find((hero) => hero.id === selectedId) ?? heroes[0];
  const arrived = heroes.filter((hero) => hero.firstCh <= chapter).length;

  return (
    <div className="map-layout seat-layout">
      <div>
        <div className="seat-toolbar">
          <label className="map-slider seat-slider">
            <span>
              读到 {current?.label ?? chapterLabel(chapter)}
              {current?.t1 ? `　${current.t1}` : ''}
            </span>
            <input
              type="range"
              min={0}
              max={max}
              value={chapter}
              onChange={(event) => setChapter(Number(event.target.value))}
            />
          </label>
          <div className="seat-jumps" role="group" aria-label="快捷跳转">
            {[
              { n: 0, label: '引首' },
              { n: 71, label: '排座次' },
              { n: max, label: '终回' },
            ].map((jump) => (
              <button
                key={jump.n}
                type="button"
                className={`chip ${chapter === jump.n ? 'active' : ''}`}
                onClick={() => setChapter(jump.n)}
              >
                {jump.label}
              </button>
            ))}
          </div>
          <div className="seat-count">
            已写到 <b>{arrived}</b> / 108
          </div>
        </div>

        <div className="seat-board">
          <div className="seat-label">天罡 · 三十六</div>
          <SeatGrid heroes={tian} chapter={chapter} selectedId={selected?.id} onSelect={setSelectedId} />
          <div className="seat-label">地煞 · 七十二</div>
          <SeatGrid heroes={di} chapter={chapter} selectedId={selected?.id} onSelect={setSelectedId} />
        </div>
        <p className="map-note">
          座次按第七十一回石碣。人名从这一回往前第一次出现，格子就亮。第七十一回以前，亮的是已经写到的人，不是已经坐定的交椅。
        </p>
      </div>
      {selected ? <HeroCard hero={selected} chapter={chapter} /> : null}
    </div>
  );
}

function SeatGrid({
  heroes,
  chapter,
  selectedId,
  onSelect,
}: {
  heroes: Person[];
  chapter: number;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="seat-grid">
      {heroes.map((hero) => {
        const passed = hero.firstCh <= chapter;
        return (
          <button
            key={hero.id}
            type="button"
            className={`seat ${hero.group} ${passed ? 'passed' : ''} ${hero.id === selectedId ? 'on' : ''} ${hero.image ? 'has-face' : ''}`}
            onClick={() => onSelect(hero.id)}
          >
            {hero.image ? (
              <Face name={hero.name} image={hero.image} className="seat-face" />
            ) : null}
            <span className="seat-meta">
              <span className="no">{hero.seat}</span>
              <span className="who">{hero.name}</span>
              <span className="nick">{hero.nick}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function HeroCard({ hero, chapter }: { hero: Person; chapter: number }) {
  const seen = hero.firstCh <= chapter;
  const camp = getGroup(hero.group);
  return (
    <aside className="map-side seat-side">
      <div className="map-card seat-card">
        {hero.image ? (
          <Face name={hero.name} image={hero.image} className="side-portrait" />
        ) : (
          <Face name={hero.name} color={camp?.color} className="side-letter" />
        )}
        <div className="seat-card-body">
          <div className="kicker">
            第 {hero.seat} 位 · {hero.star}
            {seen ? null : <span className="seat-pending">尚未写到</span>}
          </div>
          <h2>{hero.name}</h2>
          <div className="seat-nick">绰号{hero.nick}</div>
          <p>{hero.bio}</p>
          {seen ? null : <p className="seat-hint">拖到第 {hero.firstCh} 回以后，这个名字才会亮。</p>}
          <div className="modal-links">
            <Link href={`/read/${hero.firstCh}/`}>最初写到 · {chapterLabel(hero.firstCh)}</Link>
            <Link href={`/read/${hero.lastCh}/`}>最后写到 · {chapterLabel(hero.lastCh)}</Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
