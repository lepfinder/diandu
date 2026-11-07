'use client';

import { useEffect } from 'react';
import Link from '@/components/Link';
import type { TwelveDetail } from '@/lib/twelve-detail';
import { asset } from '@classic/ui';

export function TwelveDetailModal({ detail, onClose }: { detail: TwelveDetail | null; onClose: () => void }) {
  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail, onClose]);

  if (!detail) return null;

  return (
    <div className="modal-wrap open" onClick={onClose}>
      <div className="modal detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-hero">
          <img src={asset(detail.image)} alt={detail.name} width={960} height={540} />
          <div className="detail-hero-shade">
            <div className="detail-kicker">
              {detail.register === 'zheng' ? '正册' : detail.register === 'fu' ? '副册' : '又副册'} · {detail.role}
            </div>
            <h2>{detail.name}</h2>
            <div className="detail-alias">{detail.aliases.join(' · ')}</div>
          </div>
          <button className="icon-btn detail-close" onClick={onClose} title="关闭">
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
        </div>
      </div>
    </div>
  );
}
