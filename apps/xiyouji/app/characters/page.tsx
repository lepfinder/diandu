'use client';

import { useState } from 'react';
import Link from '@/components/Link';
import { getGroup, getGroups, getPeople, portraitUrl, type Person } from '@/lib/characters';

const filters = [{ id: 'all', name: '全部' }, ...getGroups()];

export default function CharactersPage() {
  const [group, setGroup] = useState('all');
  const [open, setOpen] = useState<Person | null>(null);
  const people = getPeople(group);

  return (
    <div className="page-scroll">
      <div className="page">
        <header className="section-head">
          <div>
            <h1>人物</h1>
            <p className="sub">五十五人，分在取经、天庭、佛门、妖魔、人间。点开看登场、书里写到的那一回，和一段行迹。</p>
          </div>
        </header>
        <div className="filters">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip ${group === item.id ? 'active' : ''}`}
              onClick={() => setGroup(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="char-grid">
          {people.map((person) => {
            const camp = getGroup(person.group);
            return (
              <button key={person.id} type="button" className="char-card" onClick={() => setOpen(person)}>
                <img className="avatar" src={portraitUrl(person.id)} alt="" />
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
            <img className="char-portrait" src={portraitUrl(open.id)} alt={open.name} />
            <p>{open.bio}</p>
            <div className="modal-links">
              <Link href={`/read/${open.firstCh}/`}>登场 · 第 {open.firstCh} 回</Link>
              <Link href={`/read/${open.lastCh}/`}>写到 · 第 {open.lastCh} 回</Link>
            </div>
          </article>
        </div>
      ) : null}
    </div>
  );
}
