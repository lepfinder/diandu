'use client';

import { useState } from 'react';
import Link from '@/components/Link';
import CharacterImage from '@/components/CharacterImage';
import { getGroup, getGroups, getPeople, type Person } from '@/lib/characters';
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
            <p className="sub">十兄弟、府里上下，和清河院里市井。点开看登场、书里写到的那一回，和一段行迹。</p>
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
                  <span className="role">{person.role} · {camp?.name}</span>
                  <span className="span">第 {person.firstCh} 回 – 第 {person.lastCh} 回</span>
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
                <div className="num">{getGroup(open.group)?.name} · {open.role}</div>
                <h2>{open.name}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setOpen(null)} aria-label="关闭">×</button>
            </header>
            <CharacterImage key={open.id} person={open} variant="portrait" />
            <p>{open.bio}</p>
            <div className="modal-links">
              <Link href={`/read/${open.firstCh}/`}>登场 · 第 {open.firstCh} 回</Link>
              <Link href={`/read/${open.lastCh}/`}>写到 · 第 {open.lastCh} 回</Link>
            </div>
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
