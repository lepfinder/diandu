'use client';

import { useEffect, useMemo } from 'react';
import Link from '@/components/Link';
import { getTV87Role } from '@/lib/tv87';
import { getTwelveDetail } from '@/lib/twelve-detail';
import type { Character } from '@/lib/types';
import { asset } from '@classic/ui';

export type CharacterDetail = Character & {
  personality?: string;
  house?: string;
  symbols?: { title: string; body: string }[];
  episodes?: { title: string; ch: number; desc: string }[];
  quotes?: string[];
  timeline?: { ch: number; desc: string; event?: string }[];
  relations?: { name: string; label: string }[];
};

export function CharacterDetailModal({
  detail,
  onClose,
  siblings,
  onNavigate,
}: {
  detail: CharacterDetail | null;
  onClose: () => void;
  siblings?: CharacterDetail[];
  onNavigate?: (c: CharacterDetail) => void;
}) {
  const nav = useMemo(() => {
    if (!detail || !siblings?.length || !onNavigate) return null;
    const i = siblings.findIndex((c) => c.id === detail.id);
    if (i < 0) return null;
    const prev = siblings[(i - 1 + siblings.length) % siblings.length];
    const next = siblings[(i + 1) % siblings.length];
    return { index: i, total: siblings.length, prev, next };
  }, [detail, siblings, onNavigate]);

  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (!nav || !onNavigate) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        onNavigate(nav.prev);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        onNavigate(nav.next);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail, onClose, nav, onNavigate]);

  useEffect(() => {
    if (!detail) return;
    const body = document.querySelector('.modal.detail-modal .detail-body');
    if (body) body.scrollTop = 0;
  }, [detail?.id]);

  if (!detail) return null;
  const tl = (detail.timeline || []).map((t: any) => ({ ch: t.ch, text: t.desc || t.event || '' }));
  const tv87 = getTV87Role(detail.id);
  const heroImage = detail.image || getTwelveDetail(detail.id)?.image;

  return (
    <div className="modal-wrap open" onClick={onClose}>
      <div className="modal detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-hero">
          {heroImage ? (
            <img
              className="detail-hero-img"
              src={asset(heroImage)}
              alt={detail.name}
              width={960}
              height={540}
            />
          ) : (
            <div className="detail-hero-fallback" style={{ color: detail.color || 'var(--accent)' }}>
              {detail.name.slice(0, 1)}
            </div>
          )}
          <div className="detail-hero-shade">
            <div className="detail-kicker">
              {detail.role}
              {nav ? ` · ${nav.index + 1}/${nav.total}` : ''}
            </div>
            <h2>{detail.name}</h2>
            <div className="detail-alias">{(detail.aliases || []).join(' · ')}</div>
          </div>
          {nav ? (
            <>
              <button
                type="button"
                className="icon-btn detail-nav prev"
                onClick={() => onNavigate?.(nav.prev)}
                title={`上一位：${nav.prev.name}`}
              >
                ‹
              </button>
              <button
                type="button"
                className="icon-btn detail-nav next"
                onClick={() => onNavigate?.(nav.next)}
                title={`下一位：${nav.next.name}`}
              >
                ›
              </button>
            </>
          ) : null}
          <button className="icon-btn detail-close" onClick={onClose} title="关闭（Esc）">
            ×
          </button>
        </div>

        <div className="modal-body detail-body">
          <div className="meta-row">
            {detail.tag ? <span className="pill gold">{detail.tag}</span> : null}
            {detail.house ? <span className="pill">{detail.house}</span> : null}
            <span className="pill">{detail.gender}</span>
            {tv87 ? (
              <span className="pill gold">87版 · {tv87.actor} 饰{tv87.note ? `（${tv87.note}）` : ''}</span>
            ) : null}
            {detail.fate ? <span className="pill accent">结局：{detail.fate}</span> : null}
          </div>

          {detail.personality ? (
            <section>
              <h3>性格</h3>
              <p>{detail.personality}</p>
            </section>
          ) : null}

          <section>
            <h3>小传</h3>
            <p>{Array.isArray(detail.bio) ? detail.bio.join(String.fromCharCode(10, 10)) : detail.bio}</p>
          </section>

          {(detail.symbols || []).length ? (
            <section>
              <h3>意象</h3>
              <div className="detail-grid">
                {(detail.symbols || []).map((s) => (
                  <article key={s.title} className="detail-card">
                    <strong>{s.title}</strong>
                    <p>{s.body}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {(detail.episodes || []).length ? (
            <section>
              <h3>关键情节</h3>
              <ul className="detail-list">
                {(detail.episodes || []).map((e) => (
                  <li key={e.title + e.ch}>
                    <Link href={`/read/${e.ch}/`}>
                      <span className="ch">第{e.ch}回</span>
                      <strong>{e.title}</strong>
                      <p>{e.desc}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {(detail.poems || []).length ? (
            <section>
              <h3>相关诗文</h3>
              <div className="meta-row">
                {(detail.poems || []).map((p) => (
                  <span key={p} className="pill gold">
                    {p}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {(detail.relations || []).length ? (
            <section>
              <h3>人物关系</h3>
              <div className="meta-row">
                {(detail.relations || []).map((r) => (
                  <span key={r.name + r.label} className="pill">
                    {r.name}
                    <span style={{ opacity: 0.65 }}>·{r.label}</span>
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {(detail.quotes || []).length ? (
            <section>
              <h3>名句</h3>
              <ul className="detail-quotes">
                {(detail.quotes || []).map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {tl.length ? (
            <section>
              <h3>年表</h3>
              <ul className="detail-list compact">
                {tl.map((t) => (
                  <li key={t.ch + t.text}>
                    <Link href={`/read/${t.ch}/`}>
                      <span className="ch">第{t.ch}回</span>
                      <span>{t.text}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="meta-row">
            <Link className="btn accent sm" href={`/read/${detail.firstCh}/`}>
              第 {detail.firstCh} 回初现
            </Link>
            <Link className="btn ghost sm" href={`/search/?q=${encodeURIComponent(detail.name)}`}>
              检索「{detail.name}」
            </Link>
            <Link className="btn ghost sm" href="/star/">
              人物关系
            </Link>
          </div>
          {nav ? (
            <p className="muted detail-nav-hint">↑↓←→ 切换人物 · Esc 关闭</p>
          ) : (
            <p className="muted detail-nav-hint">Esc 关闭</p>
          )}
        </div>
      </div>
    </div>
  );
}
