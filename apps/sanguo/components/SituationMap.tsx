'use client';

import { useMemo, useState } from 'react';
import Link from '@/components/Link';
import basemap from '@/data/basemap.json';
import { atlasSlice } from '@/lib/atlas';
import { getFaction, getTopics, holdAt, holdsFor, type City } from '@/lib/topics';
import type { TocItem } from '@/lib/types';

export function SituationMap({ toc }: { toc: TocItem[] }) {
  const { cities } = getTopics();
  const [chapter, setChapter] = useState(1);
  const [selectedId, setSelectedId] = useState(cities[0]?.id ?? 'luoyang');
  const current = toc.find((c) => c.n === chapter);

  const rows = useMemo(
    () =>
      cities.map((city) => {
        const hold = holdAt(city.id, chapter);
        return { city, hold, faction: getFaction(hold.faction) };
      }),
    [cities, chapter],
  );

  const changes = rows.filter((row) => row.hold.from === chapter);
  const selected = rows.find((row) => row.city.id === selectedId) ?? rows[0];
  const slice = atlasSlice(chapter);

  return (
    <div className="map-layout">
      <div>
        <div className="map-board">
          <svg
            className="atlas"
            viewBox={`0 0 ${basemap.w} ${basemap.h}`}
            role="img"
            aria-label={`形势图，公元${slice.year}年，${slice.label}`}
          >
            <defs>
              <clipPath id="atlas-land">
                <path d={basemap.land} />
              </clipPath>
            </defs>
            <rect width={basemap.w} height={basemap.h} fill="#d5e0dc" />
            <path d={basemap.land} fill="#f3e6cb" />
            <g clipPath="url(#atlas-land)" style={{ isolation: 'isolate' }}>
              <image
                href="/map/relief.webp"
                x={0}
                y={0}
                width={basemap.w}
                height={basemap.h}
                preserveAspectRatio="none"
              />
              {basemap.cells.map((cell) => {
                const row = rows.find((item) => item.city.id === cell.city);
                const faction = row?.faction;
                if (!faction || faction.id === 'none') return null;
                const opacity = faction.id === 'ruin' ? 0.18 : 0.3;
                return (
                  <path
                    key={cell.city}
                    d={cell.d}
                    fill={faction.color}
                    fillOpacity={opacity}
                    stroke={faction.color}
                    strokeOpacity={opacity}
                    strokeWidth={4}
                    strokeLinejoin="round"
                    style={{ mixBlendMode: 'multiply' }}
                  />
                );
              })}
            </g>
            {basemap.lakes.map((d, index) => (
              <path key={`lake-${index}`} d={d} fill="#a9c4cc" stroke="#7f9aa3" strokeWidth={0.35} />
            ))}
            {basemap.rivers.map((river, index) => (
              <path
                key={`river-${index}`}
                d={river.d}
                fill="none"
                stroke={river.w > 1.5 ? '#3e6a78' : '#6d8e99'}
                strokeWidth={river.w}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            <path d={basemap.land} fill="none" stroke="#a89478" strokeWidth={0.8} />
            {basemap.minors.map((place) => (
              <text key={place.name} className="atlas-minor" x={place.x + place.dx} y={place.y + place.dy} textAnchor="middle">
                {place.name}
              </text>
            ))}
            {basemap.cities.map((place) => {
              const on = place.id === selected?.city.id;
              const row = rows.find((item) => item.city.id === place.id);
              return (
                <g
                  key={place.id}
                  className={on ? 'atlas-city on' : 'atlas-city'}
                  onClick={() => setSelectedId(place.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedId(place.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <circle
                    cx={place.x}
                    cy={place.y}
                    r={on ? 5.2 : 3.3}
                    fill={row && row.faction.id !== 'none' ? row.faction.color : '#1c1814'}
                    stroke="#f3e6cb"
                    strokeWidth={1.3}
                  />
                  <text x={place.x + place.dx} y={place.y + place.dy} textAnchor="middle">
                    {place.name}
                  </text>
                </g>
              );
            })}
            <g className="atlas-card">
              <text className="atlas-year" x={42} y={52}>
                公元{slice.year}年
              </text>
              <text className="atlas-slice" x={42} y={74}>
                {slice.label}
              </text>
            </g>
            <rect x={11} y={11} width={basemap.w - 22} height={basemap.h - 22} fill="none" stroke="#8c7b62" strokeWidth={1.15} />
            <rect x={15} y={15} width={basemap.w - 30} height={basemap.h - 30} fill="none" stroke="#8c7b62" strokeWidth={0.4} />
          </svg>
        </div>
        <label className="map-slider">
          <span>
            读到 {current?.label ?? `第 ${chapter} 回`}
            {current ? `　${current.t1}` : ''}
          </span>
          <input
            type="range"
            min={1}
            max={120}
            value={chapter}
            onChange={(e) => setChapter(Number(e.target.value))}
          />
        </label>
        <p className="map-note">
          {slice.from === slice.to
            ? `这一回是公元 ${slice.year} 年，${slice.label}。`
            : `这一段是公元 ${slice.year} 年前后，${slice.label}，第 ${slice.from}–${slice.to} 回。`}
          色块按这一回的城池归属，薄薄地叠在地势上。岸线、河网取自 Natural Earth，晕渲用公有领域高程。
        </p>
      </div>
      <aside className="map-side">
        <div className="map-card">
          <div className="kicker">这一回</div>
          <h2>{current ? `${current.label}　${current.t1}` : `第 ${chapter} 回`}</h2>
          {current ? <Link href={`/read/${chapter}/`}>打开正文 →</Link> : null}
          <ul className="hold-list city-now">
            {rows.map(({ city, faction }) => (
              <li key={city.id} className={city.id === selected?.city.id ? 'on' : ''}>
                <button type="button" onClick={() => setSelectedId(city.id)}>
                  <i style={{ background: faction.id === 'none' ? 'transparent' : faction.color }} />
                  <span>
                    {city.name}
                    <b>{faction.name}</b>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {changes.length > 0 ? (
            <ul className="change-list">
              {changes.map(({ city, faction }) => (
                <li key={city.id}>
                  <b>{city.name}</b> 归入 {faction.name}
                </li>
              ))}
            </ul>
          ) : (
            <p>这一回没有城池易手。</p>
          )}
        </div>
        {selected ? <CityTimeline city={selected.city} chapter={chapter} /> : null}
        <ul className="faction-legend">
          {legendIds.map((id) => {
            const faction = getFaction(id);
            return (
              <li key={id}>
                <i style={{ background: faction.color }} />
                {faction.short}
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}

const legendIds = ['wei', 'shu', 'wu', 'jin', 'yuan', 'lv', 'biao', 'dong'];

function CityTimeline({ city, chapter }: { city: City; chapter: number }) {
  const holds = holdsFor(city.id);
  return (
    <div className="map-card">
      <div className="kicker">{city.name}</div>
      <p>{city.blurb}</p>
      <ol className="hold-list">
        {holds.map((hold) => {
          const faction = getFaction(hold.faction);
          const on = chapter >= hold.from && chapter <= hold.to;
          return (
            <li key={`${hold.from}-${hold.faction}`} className={on ? 'on' : ''}>
              <i style={{ background: faction.color }} />
              <span>
                第 {hold.from}–{hold.to} 回
                <b>{faction.name}</b>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
