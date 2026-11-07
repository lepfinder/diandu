'use client';

import { useEffect, useRef, useState } from 'react';
import Link from '@/components/Link';
import { getTopics, stationAt } from '@/lib/topics';
import type { TocItem } from '@/lib/types';

export function RouteMap({ toc }: { toc: TocItem[] }) {
  const { stations } = getTopics();
  const [chapter, setChapter] = useState(1);
  const [selectedId, setSelectedId] = useState(stations[0].id);
  const hereRef = useRef<HTMLButtonElement>(null);
  const current = toc.find((item) => item.n === chapter);
  const here = stationAt(chapter);
  const selected = stations.find((station) => station.id === selectedId) ?? here;

  useEffect(() => {
    hereRef.current?.scrollIntoView({ block: 'nearest' });
  }, [chapter]);

  function onChapter(next: number) {
    setChapter(next);
    setSelectedId(stationAt(next).id);
  }

  return (
    <div className="map-layout">
      <div>
        <div className="route-board">
          <ol className="route-list">
            {stations.map((station) => {
              const passed = chapter >= station.chapter;
              const isHere = station.id === here.id;
              const on = station.id === selected.id;
              return (
                <li key={station.id}>
                  <button
                    type="button"
                    ref={isHere ? hereRef : undefined}
                    className={`route-stop ${passed ? 'passed' : ''} ${isHere ? 'here' : ''} ${on ? 'on' : ''}`}
                    onClick={() => setSelectedId(station.id)}
                  >
                    <span className="route-mark" aria-hidden="true"><i /></span>
                    <span className="name">{station.name}</span>
                    <span className="when">第 {station.chapter} 回</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <label className="map-slider">
          <span>
            读到 {current?.label ?? `第 ${chapter} 回`}
            {current ? `　${current.t1}` : ''}
          </span>
          <input
            type="range"
            min={1}
            max={100}
            value={chapter}
            onChange={(event) => onChapter(Number(event.target.value))}
          />
        </label>
        <p className="map-note">十八站按叙事顺序排列。拖到第几回，走到的站点就亮。这是行程，不是从长安到天竺的里程。</p>
      </div>
      <aside className="map-side">
        <div className="map-card">
          <div className="kicker">这一回</div>
          <h2>{current ? `${current.label}　${current.t1}` : `第 ${chapter} 回`}</h2>
          <p>走到{here.name}。</p>
          {current ? <Link href={`/read/${chapter}/`}>打开正文 →</Link> : null}
        </div>
        <div className="map-card">
          <div className="kicker">第 {selected.chapter} 回 · {selected.name}</div>
          <h2>{selected.name}</h2>
          <p>{selected.blurb}</p>
          {chapter < selected.chapter ? <p>这一回还没走到。</p> : null}
          <Link href={`/read/${selected.chapter}/`}>打开这一站 →</Link>
        </div>
      </aside>
    </div>
  );
}
