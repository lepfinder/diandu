'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { CharacterDetailModal } from '@/components/CharacterDetailModal';
import { getCharacters, getGroups, getRelationsFor } from '@/lib/content';
import { getTwelveDetail, type TwelveDetail } from '@/lib/twelve-detail';
import { getTV87Role } from '@/lib/tv87';
import { TwelveDetailModal } from '@/components/TwelveDetailModal';
import { toCN } from '@/lib/cn';
import type { Character } from '@/lib/types';
import Link from '@/components/Link';
import { asset } from '@classic/ui';

export default function CharactersPage() {
  const groups = useMemo(() => [{ id: 'all', name: '全部', color: '' }, ...getGroups()], []);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState<Character | null>(null);
  const [twelveDetail, setTwelveDetail] = useState<TwelveDetail | null>(null);
  const [failedArt, setFailedArt] = useState<Record<string, boolean>>({});
  const list = useMemo(() => getCharacters(filter), [filter]);

  function openChar(c: Character) {
    setModal(c);
    setTwelveDetail(null);
  }

  return (
    <div className="page-scroll">
      <div className="page">
        <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', height: 220, marginBottom: 28, border: '1px solid var(--line)' }}>
          <Image src={asset("/images/characters.webp")} alt="红楼群芳" fill style={{ objectFit: 'cover' }} priority />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(20,14,10,.1), rgba(20,14,10,.62))', display: 'flex', alignItems: 'flex-end', padding: 24 }}>
            <div>
              <div style={{ color: '#e8c9a8', fontSize: 12, letterSpacing: '0.16em', marginBottom: 8 }}>金陵十二钗 · 贾史王薛</div>
              <h1 style={{ margin: 0, color: '#f7efe4', fontFamily: 'var(--serif)', fontSize: 32, letterSpacing: '0.12em' }}>人物百科</h1>
            </div>
          </div>
        </div>
        <div className="section-head">
          <div>
            <p className="sub" style={{ marginTop: 0 }}>点击卡片查看身世、命运与相关回目。阅读正文时，人名也可点开。</p>
          </div>
          <Link className="btn ghost sm" href="/star/">打开人物关系</Link>
        </div>
        <div className="filters">
          {groups.map((g) => (
            <button key={g.id} className={`chip ${filter === g.id ? 'active' : ''}`} onClick={() => setFilter(g.id)}>
              {g.name}
            </button>
          ))}
        </div>
        <div className="char-grid">
          {list.map((c) => {
            const g = getGroups().find((x) => x.id === c.group);
            const art = !failedArt[c.id] ? (c.image || getTwelveDetail(c.id)?.image) : undefined;
            return (
              <button key={c.id} className={`char-card ${art ? 'has-art' : ''}`} onClick={() => openChar(c)}>
                {art ? (
                  <div className="char-card-art">
                    <img
                      src={asset(art)}
                      alt={c.name}
                      width={900}
                      height={506}
                      loading="lazy"
                      decoding="async"
                      onError={() => setFailedArt((m) => ({ ...m, [c.id]: true }))}
                    />
                  </div>
                ) : null}
                <div className="top">
                  {!art ? (
                    <div className="avatar" style={{ background: c.color || 'var(--accent)' }}>{c.name[c.name.length - 1]}</div>
                  ) : null}
                  <div>
                    <div className="name">{c.name}</div>
                    <div className="role">{c.role}{g ? ` · ${g.name}` : ''}</div>
                    {getTV87Role(c.id) ? (
                      <div className="tv87-line">87版 · {getTV87Role(c.id)!.actor} 饰</div>
                    ) : null}
                  </div>
                </div>
                <div className="bio">{c.bio}</div>
                <div className="meta-row">
                  {c.tag ? <span className="pill gold">{c.tag}</span> : null}
                  {c.fate ? <span className="pill accent">{c.fate}</span> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {modal && (
        <CharacterDetailModal
          detail={modal as any}
          onClose={() => setModal(null)}
          siblings={list as any}
          onNavigate={(c) => setModal(c)}
        />
      )}

    </div>
  );
}
