'use client';

import { useMemo, useState } from 'react';
import Link from '@/components/Link';
import { getTopics, stationAt } from '@/lib/topics';
import type { TocItem } from '@/lib/types';
import { asset } from '@classic/ui';

/** 叙事行程坐标：东起西讫，折线西行，不是地理投影。 */
const STATION_XY: Record<string, { x: number; y: number }> = {
  huaguo: { x: 76, y: 8 },
  fangcun: { x: 58, y: 14 },
  tiangong: { x: 80, y: 21 },
  wuxing: { x: 55, y: 28 },
  changan: { x: 72, y: 35 },
  liangjie: { x: 48, y: 42 },
  yingchou: { x: 34, y: 48 },
  gaolao: { x: 54, y: 54 },
  liusha: { x: 32, y: 60 },
  baihu: { x: 48, y: 66 },
  pingding: { x: 30, y: 72 },
  huoyun: { x: 44, y: 78 },
  nvguo: { x: 28, y: 84 },
  huoyan: { x: 40, y: 90 },
  shituo: { x: 24, y: 96 },
  wudi: { x: 36, y: 102 },
  tianzhu: { x: 22, y: 109 },
  lingshan: { x: 34, y: 117 },
};

const VIEW_W = 100;
const VIEW_H = 128;

export function RouteMap({ toc }: { toc: TocItem[] }) {
  const { stations } = getTopics();
  const [chapter, setChapter] = useState(1);
  const [selectedId, setSelectedId] = useState(stations[0].id);
  const current = toc.find((item) => item.n === chapter);
  const here = stationAt(chapter);
  const selected = stations.find((station) => station.id === selectedId) ?? here;
  const passedCount = stations.filter((station) => chapter >= station.chapter).length;

  const pathD = useMemo(() => {
    const pts = stations
      .map((station) => STATION_XY[station.id])
      .filter(Boolean);
    if (!pts.length) return '';
    return pts
      .map((pt, index) => `${index === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
      .join(' ');
  }, [stations]);

  const progressLen = useMemo(() => {
    const hereIndex = stations.findIndex((station) => station.id === here.id);
    if (hereIndex <= 0) return 0;
    return hereIndex / (stations.length - 1);
  }, [here.id, stations]);

  function onChapter(next: number) {
    setChapter(next);
    setSelectedId(stationAt(next).id);
  }

  return (
    <div className="map-layout route-layout">
      <div>
        <div className="route-canvas" role="img" aria-label="西行十八站行程图">
          <img className="route-canvas-bg" src={asset('/topics/topic-route.webp')} alt="" />
          <div className="route-canvas-veil" aria-hidden="true" />
          <svg className="route-svg" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMin meet">
            <defs>
              <linearGradient id="route-ink" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8c4a1f" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#c4a35a" stopOpacity="0.55" />
              </linearGradient>
              <filter id="route-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="0.6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path className="route-path-base" d={pathD} fill="none" />
            <path
              className="route-path-ink"
              d={pathD}
              fill="none"
              pathLength={1}
              strokeDasharray={`${progressLen} ${1 - progressLen}`}
            />
          </svg>

          {stations.map((station) => {
            const xy = STATION_XY[station.id];
            if (!xy) return null;
            const passed = chapter >= station.chapter;
            const isHere = station.id === here.id;
            const on = station.id === selected.id;
            return (
              <button
                key={station.id}
                type="button"
                className={`route-pin ${xy.x > 55 ? 'label-left' : ''} ${passed ? 'passed' : ''} ${isHere ? 'here' : ''} ${on ? 'on' : ''}`}
                style={{ left: `${xy.x}%`, top: `${(xy.y / VIEW_H) * 100}%` }}
                onClick={() => setSelectedId(station.id)}
                aria-label={`${station.name}，第 ${station.chapter} 回`}
              >
                <span className="route-pin-ring" aria-hidden="true">
                  {station.image ? (
                    <img src={asset(station.image)} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <i />
                  )}
                </span>
                <span className="route-pin-label">
                  <strong>{station.name}</strong>
                  <em>第 {station.chapter} 回</em>
                </span>
              </button>
            );
          })}

          <div className="route-compass" aria-hidden="true">
            <span>东</span>
            <b>西行</b>
            <span>西</span>
          </div>
          <div className="route-count">
            已走 <b>{passedCount}</b> / {stations.length}
          </div>
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
        <p className="map-note">十八站按叙事顺序排在图上。拖到第几回，走过的路会亮。这是行程，不是从长安到天竺的里程。</p>
      </div>

      <aside className="map-side">
        <article className={`map-card station-card ${selected.image ? 'has-art' : ''}`}>
          {selected.image ? (
            <div className="station-art-wrap">
              <img className="station-art" src={asset(selected.image)} alt={selected.name} />
              <div className="station-art-meta">
                <span>第 {selected.chapter} 回</span>
                <strong>{selected.name}</strong>
              </div>
            </div>
          ) : null}
          <div className="station-body">
            {!selected.image ? (
              <div className="kicker">第 {selected.chapter} 回 · {selected.name}</div>
            ) : null}
            {!selected.image ? <h2>{selected.name}</h2> : null}
            <p>{selected.blurb}</p>
            {chapter < selected.chapter ? (
              <p className="station-wait">这一回还没走到。</p>
            ) : selected.id === here.id ? (
              <p className="station-here">当前读到这里。</p>
            ) : (
              <p className="station-here">已经走过这一站。</p>
            )}
            <div className="station-actions">
              <Link className="station-cta" href={`/read/${selected.chapter}/`}>打开这一站 →</Link>
              {current ? (
                <Link className="station-ghost" href={`/read/${chapter}/`}>这一回正文</Link>
              ) : null}
            </div>
          </div>
        </article>

        <div className="map-card route-now-card">
          <div className="kicker">这一回</div>
          <h2>{current ? `${current.label}　${current.t1}` : `第 ${chapter} 回`}</h2>
          <p>走到{here.name}。</p>
        </div>
      </aside>
    </div>
  );
}
