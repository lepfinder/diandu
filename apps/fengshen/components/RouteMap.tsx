'use client';

import { useMemo, useState } from 'react';
import Link from '@/components/Link';
import { getTopics, stationAt } from '@/lib/topics';
import type { TocItem } from '@/lib/types';
import { asset } from '@classic/ui';

/** 叙事行程坐标：朝歌起、西岐守、东征收，不是地理投影。 */
const STATION_XY: Record<string, { x: number; y: number }> = {
  chaoge: { x: 78, y: 10 },
  chentang: { x: 62, y: 18 },
  kunlun: { x: 28, y: 24 },
  panxi: { x: 40, y: 34 },
  xiqi: { x: 34, y: 44 },
  wuguan: { x: 52, y: 52 },
  shijue: { x: 38, y: 60 },
  huanghe: { x: 48, y: 68 },
  juelong: { x: 58, y: 76 },
  jintai: { x: 36, y: 84 },
  jinjiling: { x: 50, y: 92 },
  zhuxian: { x: 42, y: 100 },
  wanxian: { x: 54, y: 108 },
  muye: { x: 68, y: 116 },
  fengshentai: { x: 60, y: 124 },
  fengguo: { x: 72, y: 132 },
};

const VIEW_W = 100;
const VIEW_H = 142;

export function RouteMap({ toc }: { toc: TocItem[] }) {
  const { stations } = getTopics();
  const [chapter, setChapter] = useState(1);
  const [selectedId, setSelectedId] = useState(stations[0].id);
  const current = toc.find((item) => item.n === chapter);
  const here = stationAt(chapter);
  const selected = stations.find((station) => station.id === selectedId) ?? here;
  const passedCount = stations.filter((station) => chapter >= station.chapter).length;
  const maxChapter = toc.length || 100;

  const pathD = useMemo(() => {
    const pts = stations.map((station) => STATION_XY[station.id]).filter(Boolean);
    if (!pts.length) return '';
    return pts.map((pt, index) => `${index === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
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
        <div className="route-canvas" role="img" aria-label="封神征途十六站">
          <img className="route-canvas-bg" src={asset('/topics/topic-route.webp')} alt="" />
          <div className="route-canvas-veil" aria-hidden="true" />
          <svg className="route-svg" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMin meet">
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
            <span>西</span>
            <b>东征</b>
            <span>东</span>
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
            max={maxChapter}
            value={chapter}
            onChange={(event) => onChapter(Number(event.target.value))}
          />
        </label>
        <p className="map-note">十六站按叙事顺序排在图上。拖到第几回，走过的路会亮。这是征途，不是商周地理投影。</p>
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
