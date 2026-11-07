'use client';

import { useMemo, useState } from 'react';
import Link from '@/components/Link';
import { toCN } from '@/lib/cn';
import { POEM_IMAGES } from '@/lib/content';
import { getTV87SongByPoem, tv87ListenUrl, TV87_META } from '@/lib/tv87';
import type { PoemItem, PoemFullItem } from '@/lib/types';

const TYPE_ORDER = ['诗', '词', '曲', '歌行', '辞赋', '判词', '灯谜', '对联', '偈语'];

type Mode = 'featured' | 'all';

export function PoemsBoard({
  featured,
  full,
  intro,
}: {
  featured: PoemItem[];
  full: PoemFullItem[];
  intro: string;
}) {
  const [mode, setMode] = useState<Mode>('featured');
  const [type, setType] = useState<string>('all');
  const [ch, setCh] = useState<string>('all');

  const types = useMemo(() => {
    const set = new Map<string, number>();
    for (const p of full) set.set(p.type, (set.get(p.type) || 0) + 1);
    return TYPE_ORDER.filter((t) => set.has(t)).map((t) => ({ id: t, n: set.get(t)! }));
  }, [full]);

  const chapters = useMemo(() => {
    const set = new Map<number, number>();
    for (const p of full) set.set(p.ch, (set.get(p.ch) || 0) + 1);
    return [...set.entries()].sort((a, b) => a[0] - b[0]);
  }, [full]);

  const filtered = useMemo(() => {
    return full.filter((p) => {
      if (type !== 'all' && p.type !== type) return false;
      if (ch !== 'all' && p.ch !== Number(ch)) return false;
      return true;
    });
  }, [full, type, ch]);

  return (
    <>
      <p className="sub" style={{ margin: '-10px 0 18px', color: 'var(--ink-3)', fontSize: 14, lineHeight: 1.8 }}>
        {intro}{' '}
        <span style={{ opacity: 0.9 }}>
          {TV87_META.year} 版央视《红楼梦》（{TV87_META.director}）由王立平作曲，对应曲目已挂靠篇目。
        </span>
      </p>

      <div className="filters poem-mode-tabs" style={{ marginBottom: 14 }}>
        <button type="button" className={`chip ${mode === 'featured' ? 'active' : ''}`} onClick={() => setMode('featured')}>
          精选 {featured.length}
        </button>
        <button type="button" className={`chip ${mode === 'all' ? 'active' : ''}`} onClick={() => setMode('all')}>
          全收录 {full.length}
        </button>
      </div>

      {mode === 'featured' ? (
        <div className="poem-list">
          {featured.map((p) => (
            <article key={p.id} className="poem-card has-img">
              <div className="poem-img" data-label={p.title}>
                {POEM_IMAGES[p.id] ? (
                  <img src={POEM_IMAGES[p.id]} alt={p.title} width={1024} height={1024} loading="eager" decoding="async" />
                ) : null}
              </div>
              <div className="poem-body">
                <header className="poem-head">
                  <h3>{p.title}</h3>
                  <div className="who">
                    <span className="author">{p.author}</span>
                    <span className="dot" aria-hidden>·</span>
                    <Link className="ch-link" href={`/read/${p.ch}/`}>
                      第{toCN(p.ch)}回
                    </Link>
                  </div>
                </header>
                <div className="lines">
                  {p.lines.map((line, i) => {
                    const isPart = /^(其[一二三四五]|引子|收尾|（.+）)$/.test(line.trim());
                    return (
                      <p key={i} className={isPart ? 'part' : 'line'}>
                        {line}
                      </p>
                    );
                  })}
                </div>
                {p.note ? (
                  <aside className="note">
                    <span className="note-label">赏析</span>
                    <p>{p.note}</p>
                  </aside>
                ) : null}
                {(() => {
                  const song = getTV87SongByPoem(p.id);
                  if (!song) return null;
                  return (
                    <aside className="tv87-song">
                      <span className="note-label">87原声</span>
                      <div>
                        <strong>《{song.title}》</strong>
                        <span className="meta">{song.role} · 曲 {song.composer} · 唱 {song.singer}</span>
                        <a href={tv87ListenUrl(song)} target="_blank" rel="noreferrer">去听 →</a>
                      </div>
                    </aside>
                  );
                })()}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <>
          <div className="filters" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className={`chip ${type === 'all' ? 'active' : ''}`} onClick={() => setType('all')}>
              全部体裁
            </button>
            {types.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`chip ${type === t.id ? 'active' : ''}`}
                onClick={() => setType(t.id)}
              >
                {t.id} {t.n}
              </button>
            ))}
          </div>
          <div className="filters" style={{ marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className={`chip ${ch === 'all' ? 'active' : ''}`} onClick={() => setCh('all')}>
              全部回目
            </button>
            {chapters.map(([n, count]) => (
              <button
                key={n}
                type="button"
                className={`chip ${ch === String(n) ? 'active' : ''}`}
                onClick={() => setCh(String(n))}
              >
                第{toCN(n)}回 · {count}
              </button>
            ))}
          </div>

          <div className="poem-full-list">
            <div className="poem-full-count">{filtered.length} 篇</div>
            {filtered.map((p) => (
              <article key={p.id} className="poem-full-item">
                <header>
                  <span className="type-pill">{p.type}</span>
                  <h3>{p.title}</h3>
                  <div className="who">
                    {p.author ? `${p.author} · ` : ''}
                    <Link href={`/read/${p.ch}/`} style={{ color: 'var(--accent)' }}>
                      第{toCN(p.ch)}回
                    </Link>
                  </div>
                </header>
                <div className="lines">{p.lines.join('\n')}</div>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}
