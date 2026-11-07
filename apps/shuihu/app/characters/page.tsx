'use client';

import { useState } from 'react';
import { Face } from '@/components/Face';
import Link from '@/components/Link';
import { getGroup, getGroups, getPeople, type Person } from '@/lib/characters';
import { chapterLabel } from '@/lib/label';

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
            <p className="sub">一百单八将按天罡、地煞分开，另有晁盖和朝廷、对手里的几个人。点开看星号、绰号，以及书里第一次、最后一次写到这个名字的那一回。</p>
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
                <Face name={person.name} image={person.image} color={camp?.color} />
                <span>
                  <span className="name">{person.name}</span>
                  <span className="role">{person.star ? `${person.star} · ${person.role}` : `${person.role} · ${camp?.name}`}</span>
                  <span className="span">{chapterLabel(person.firstCh)} – {chapterLabel(person.lastCh)}</span>
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
              {open.image ? <Face name={open.name} image={open.image} className="modal-portrait" /> : null}
              <div>
                <div className="num">
                  {open.seat ? `第 ${open.seat} 位 · ` : ''}
                  {open.star ? `${open.star} · ` : ''}
                  {getGroup(open.group)?.name}
                  {open.star ? '' : ` · ${open.role}`}
                </div>
                <h2>{open.name}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setOpen(null)} aria-label="关闭">×</button>
            </header>
            <p>{open.nick && open.nick !== open.role ? `绰号${open.nick}。` : ''}{open.bio}</p>
            <div className="modal-links">
              <Link href={`/read/${open.firstCh}/`}>最初写到 · {chapterLabel(open.firstCh)}</Link>
              <Link href={`/read/${open.lastCh}/`}>最后写到 · {chapterLabel(open.lastCh)}</Link>
            </div>
          </article>
        </div>
      ) : null}
    </div>
  );
}
