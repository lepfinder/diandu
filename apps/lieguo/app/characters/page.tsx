'use client';

import { useState } from 'react';
import Link from '@/components/Link';
import CharacterImage from '@/components/CharacterImage';
import { MapLink } from '@/components/MapLink';
import { getGroup, getGroups, getPeople, type Person } from '@/lib/characters';
import { jiangshanUrl } from '@/lib/map';
import { useModalListNav } from '@classic/ui';

const filters = [{ id: 'all', name: '全部' }, ...getGroups()];

export default function CharactersPage() {
  const [group, setGroup] = useState('all');
  const [open, setOpen] = useState<Person | null>(null);
  const people = getPeople(group);
  const openIndex = useModalListNav(open, people, setOpen);

  return (
    <div className="page-scroll">
      <div className="page">
        <header className="section-head">
          <div>
            <h1>人物</h1>
            <p className="sub">按周齐晋楚秦与列国诸杰分列。点开可跳江山时序舆图。</p>
          </div>
        </header>
        <div className="filters">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip ${group === item.id ? 'active' : ''}`}
              onClick={() => {
                setGroup(item.id);
                setOpen(null);
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="char-grid">
          {people.map((person) => {
            const camp = getGroup(person.group);
            const active = open?.id === person.id;
            return (
              <button
                key={person.id}
                type="button"
                className={`char-card${active ? ' on' : ''}`}
                aria-current={active ? 'true' : undefined}
                onClick={() => setOpen(person)}
              >
                <CharacterImage person={person} variant="avatar" color={camp?.color} />
                <span>
                  <span className="name">{person.name}</span>
                  <span className="role">
                    {person.role} · {camp?.name}
                  </span>
                  <span className="span">第 {person.firstCh} 回</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {open ? (
        <div className="modal-wrap" onClick={() => setOpen(null)}>
          <article className="modal" onClick={(event) => event.stopPropagation()}>
            <header className="modal-head">
              <div>
                <div className="num">
                  {getGroup(open.group)?.name} · {open.role}
                </div>
                <h2>{open.name}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setOpen(null)} aria-label="关闭">
                ×
              </button>
            </header>
            <CharacterImage key={open.id} person={open} variant="portrait" />
            <p>{open.bio}</p>
            <div className="modal-links" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <Link href={`/read/${open.firstCh}/`}>阅读 · 第 {open.firstCh} 回</Link>
              <MapLink anchor={open.map} />
            </div>
            {open.anchors && open.anchors.length > 0 ? (
              <div style={{ marginTop: 16 }}>
                <div className="num" style={{ marginBottom: 8 }}>
                  行迹站点
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {open.anchors.map((anchor, i) => {
                    const href = jiangshanUrl(anchor);
                    if (!href) return null;
                    const label = [
                      anchor.year != null ? (anchor.year < 0 ? `前${-anchor.year}` : String(anchor.year)) : null,
                      anchor.place,
                    ]
                      .filter(Boolean)
                      .join(' · ');
                    return (
                      <a
                        key={`${open.id}-${i}`}
                        className="chip"
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {label} ↗
                      </a>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {people.length > 1 ? (
              <p className="modal-hint">
                ↑↓←→ 切换
                {openIndex >= 0 ? ` · ${openIndex + 1}/${people.length}` : ''}
              </p>
            ) : null}
          </article>
        </div>
      ) : null}
    </div>
  );
}
