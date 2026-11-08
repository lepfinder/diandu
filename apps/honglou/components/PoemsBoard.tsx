'use client';

import { useMemo, useState } from 'react';
import Link from '@/components/Link';
import { toCN } from '@/lib/cn';
import { POEM_IMAGES } from '@/lib/content';
import { getTV87SongByPoem, tv87ListenUrl, TV87_META } from '@/lib/tv87';
import type { PoemItem, PoemFullItem } from '@/lib/types';
import { asset } from '@classic/ui';

const TYPE_ORDER = ['诗', '词', '曲', '歌行', '辞赋', '判词', '灯谜', '对联', '偈语'];

type Mode = 'featured' | 'all';

function shortTitle(title: string) {
  return title.replace(/（.*?）/g, '').replace(/\s*·\s*/g, ' · ').trim();
}

function jumpToPoem(id: string) {
  const el = document.getElementById(`poem-${id}`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

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
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

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
    const key = q.trim();
    return full.filter((p) => {
      if (type !== 'all' && p.type !== type) return false;
      if (ch !== 'all' && p.ch !== Number(ch)) return false;
      if (key && !`${p.title}${p.author || ''}`.includes(key)) return false;
      return true;
    });
  }, [full, type, ch, q]);

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
        <div className="poem-featured-layout">
          <nav className="poem-toc poem-toc-side" aria-label="精选目录">
            <div className="poem-toc-head">
              <strong>篇目</strong>
              <span>{featured.length} 首</span>
            </div>
            <ol className="poem-toc-list">
              {featured.map((p, i) => (
                <li key={p.id}>
                  <button type="button" onClick={() => jumpToPoem(p.id)}>
                    <span className="n">{i + 1}</span>
                    <span className="t">{shortTitle(p.title)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <div className="poem-list">
            {featured.map((p) => {
              const textLen = p.lines.reduce((n, line) => n + line.length, 0);
              const isLong = textLen >= 280 || p.lines.length >= 12;
              return (
                <article
                  key={p.id}
                  id={`poem-${p.id}`}
                  className={`poem-card has-img${isLong ? ' is-long' : ''}`}
                >
                  <div className="poem-img" data-label={p.title}>
                    {POEM_IMAGES[p.id] ? (
                      <img
                        src={asset(POEM_IMAGES[p.id])}
                        alt={p.title}
                        width={isLong ? 1280 : 1024}
                        height={isLong ? 720 : 1024}
                        loading="eager"
                        decoding="async"
                      />
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
              );
            })}
          </div>
        </div>
      ) : (
        <div className="poem-full-layout">
          <aside className="poem-full-side">
            <div className="poem-full-side-block">
              <div className="poem-full-side-label">体裁</div>
              <div className="poem-full-side-list">
                <button type="button" className={type === 'all' ? 'on' : ''} onClick={() => setType('all')}>
                  全部 <em>{full.length}</em>
                </button>
                {types.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={type === t.id ? 'on' : ''}
                    onClick={() => setType(t.id)}
                  >
                    {t.id} <em>{t.n}</em>
                  </button>
                ))}
              </div>
            </div>
            <div className="poem-full-side-block">
              <div className="poem-full-side-label">回目</div>
              <div className="poem-full-side-list poem-full-ch-list">
                <button type="button" className={ch === 'all' ? 'on' : ''} onClick={() => setCh('all')}>
                  全部
                </button>
                {chapters.map(([n, count]) => (
                  <button
                    key={n}
                    type="button"
                    className={ch === String(n) ? 'on' : ''}
                    onClick={() => setCh(String(n))}
                    title={`第${toCN(n)}回 · ${count} 篇`}
                  >
                    {n === 0 ? '引' : n}
                    <em>{count}</em>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="poem-full-main">
            <div className="poem-full-toolbar">
              <div className="poem-full-count">
                {filtered.length} 篇
                {type !== 'all' ? ` · ${type}` : ''}
                {ch !== 'all' ? ` · 第${toCN(Number(ch))}回` : ''}
              </div>
              <input
                className="poem-full-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜题名、作者"
                aria-label="搜索诗词"
              />
            </div>
            <div className="poem-full-list">
              {filtered.map((p) => {
                const opened = openId === p.id;
                const preview = p.lines.slice(0, 3).join('\n');
                const canFold = p.lines.length > 3;
                return (
                  <article key={p.id} className={`poem-full-item${opened ? ' open' : ''}`}>
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
                    <div className="lines">{opened || !canFold ? p.lines.join('\n') : preview}</div>
                    {canFold ? (
                      <button
                        type="button"
                        className="poem-full-more"
                        onClick={() => setOpenId(opened ? null : p.id)}
                      >
                        {opened ? '收起' : `展开全文 · ${p.lines.length} 行`}
                      </button>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
