'use client';

import { useEffect, useMemo } from 'react';
import Link from '@/components/Link';
import { getTwelveDetail, type TwelveDetail } from '@/lib/twelve-detail';
import { asset } from '@classic/ui';

export function TwelveDetailModal({
  detail,
  onClose,
  siblings,
  onNavigate,
}: {
  detail: TwelveDetail | null;
  onClose: () => void;
  /** 当前册内按展示顺序的 id 列表，用于左右键切换 */
  siblings?: string[];
  onNavigate?: (id: string) => void;
}) {
  const nav = useMemo(() => {
    if (!detail || !siblings?.length || !onNavigate) return null;
    const i = siblings.indexOf(detail.id);
    if (i < 0) return null;
    const prevId = siblings[(i - 1 + siblings.length) % siblings.length];
    const nextId = siblings[(i + 1) % siblings.length];
    return {
      index: i,
      total: siblings.length,
      prevId,
      nextId,
      prev: getTwelveDetail(prevId),
      next: getTwelveDetail(nextId),
    };
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
        onNavigate(nav.prevId);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        onNavigate(nav.nextId);
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

  return (
    <div className="modal-wrap open" onClick={onClose}>
      <div className="modal detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-hero">
          <img
            className="detail-hero-img"
            src={asset(detail.image)}
            alt={detail.name}
            width={960}
            height={540}
          />
          <div className="detail-hero-shade">
            <div className="detail-kicker">
              {detail.register === 'zheng' ? '正册' : detail.register === 'fu' ? '副册' : '又副册'} · {detail.role}
              {nav ? ` · ${nav.index + 1}/${nav.total}` : ''}
            </div>
            <h2>{detail.name}</h2>
            <div className="detail-alias">{detail.aliases.join(' · ')}</div>
          </div>
          {nav ? (
            <>
              <button
                type="button"
                className="icon-btn detail-nav prev"
                onClick={() => onNavigate?.(nav.prevId)}
                title={`上一位：${nav.prev?.name || ''}`}
              >
                ‹
              </button>
              <button
                type="button"
                className="icon-btn detail-nav next"
                onClick={() => onNavigate?.(nav.nextId)}
                title={`下一位：${nav.next?.name || ''}`}
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
            <span className="pill gold">{detail.symbol}</span>
            <span className="pill">{detail.house}</span>
            <span className="pill">出身：{detail.parents}</span>
            <span className="pill accent">结局：{detail.fate}</span>
          </div>

          <section>
            <h3>判词 / 册页</h3>
            <div className="detail-verse">{detail.verse}</div>
            {detail.verseShared ? <p className="muted">{detail.verseShared}</p> : null}
            {detail.song ? (
              <div className="detail-song">{detail.song}</div>
            ) : null}
          </section>

          <section>
            <h3>性格</h3>
            <p>{detail.personality}</p>
          </section>

          <section>
            <h3>小传</h3>
            {detail.bio.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>

          {detail.symbols?.length ? (
            <section>
              <h3>意象解读</h3>
              <div className="detail-grid">
                {detail.symbols.map((s) => (
                  <article key={s.title} className="detail-card">
                    <strong>{s.title}</strong>
                    <p>{s.body}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {detail.episodes?.length ? (
            <section>
              <h3>关键情节</h3>
              <ul className="detail-list">
                {detail.episodes.map((e) => (
                  <li key={e.title}>
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

          {detail.poems?.length ? (
            <section>
              <h3>代表诗作</h3>
              {detail.poems.map((p) => (
                <div key={p.title} className="detail-poem">
                  <strong>{p.title}</strong>
                  <div>{p.lines.join('\n')}</div>
                  {p.note ? <p className="muted">{p.note}</p> : null}
                </div>
              ))}
            </section>
          ) : null}

          {detail.relations?.length ? (
            <section>
              <h3>人物关系</h3>
              <div className="meta-row">
                {detail.relations.map((r) => (
                  <span key={r.name + r.label} className="pill">
                    {r.name}
                    <span style={{ opacity: 0.65 }}>·{r.label}</span>
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {detail.quotes?.length ? (
            <section>
              <h3>名句</h3>
              <ul className="detail-quotes">
                {detail.quotes.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {detail.timeline?.length ? (
            <section>
              <h3>年表</h3>
              <ul className="detail-list compact">
                {detail.timeline.map((t) => (
                  <li key={t.ch + t.event}>
                    <Link href={`/read/${t.ch}/`}>
                      <span className="ch">第{t.ch}回</span>
                      <span>{t.event}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="meta-row" style={{ marginTop: 8 }}>
            <Link className="btn accent sm" href={`/read/${detail.chRef}/`}>
              阅读相关回目
            </Link>
            <Link className="btn ghost sm" href={`/search/?q=${encodeURIComponent(detail.name)}`}>
              检索「{detail.name}」
            </Link>
            <Link className="btn ghost sm" href="/characters/">
              人物百科
            </Link>
          </div>
          {nav ? (
            <p className="muted detail-nav-hint">↑↓←→ 切换同册人物 · Esc 关闭</p>
          ) : (
            <p className="muted detail-nav-hint">Esc 关闭</p>
          )}
        </div>
      </div>
    </div>
  );
}
