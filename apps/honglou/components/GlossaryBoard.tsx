'use client';

import { useMemo, useState } from 'react';
import Link from '@/components/Link';
import { useModalListNav } from '@classic/ui';

export type GlossaryItem = {
  id: string;
  category: 'address' | 'dress' | 'office' | 'object';
  term: string;
  aliases?: string[];
  brief: string;
  detail: string;
  chars?: string[];
  chRef: number;
};

const CAT_NAME: Record<string, string> = {
  address: '称谓',
  dress: '服制',
  office: '官职',
  object: '器物',
};

export function GlossaryBoard({
  items,
  intro,
}: {
  items: GlossaryItem[];
  intro: string;
}) {
  const [cat, setCat] = useState<'all' | GlossaryItem['category']>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<GlossaryItem | null>(null);

  const list = useMemo(() => {
    const kw = q.trim();
    return items.filter((it) => {
      if (cat !== 'all' && it.category !== cat) return false;
      if (!kw) return true;
      const hay = [it.term, it.brief, it.detail, ...(it.aliases || []), ...(it.chars || [])].join(' ');
      return hay.includes(kw);
    });
  }, [items, cat, q]);

  const openIndex = useModalListNav(open, list, setOpen);

  const counts = useMemo(() => {
    const c = { all: items.length, address: 0, dress: 0, office: 0, object: 0 } as Record<string, number>;
    items.forEach((i) => {
      c[i.category] = (c[i.category] || 0) + 1;
    });
    return c;
  }, [items]);

  return (
    <>
      <p className="sub" style={{ margin: '-10px 0 18px', maxWidth: '68ch', color: 'var(--ink-3)', fontSize: 14, lineHeight: 1.8 }}>
        {intro}
      </p>

      <div className="filters" style={{ marginBottom: 12 }}>
        {(['all', 'address', 'dress', 'office', 'object'] as const).map((k) => (
          <button key={k} className={`chip ${cat === k ? 'active' : ''}`} onClick={() => setCat(k)}>
            {k === 'all' ? '全部' : CAT_NAME[k]} · {counts[k] || 0}
          </button>
        ))}
      </div>

      <div className="search-box" style={{ marginBottom: 22 }}>
        <input
          placeholder="搜术语、别称、人物… 例如：雀金裘 / 姨娘 / 龙禁尉"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="glossary-grid">
        {list.map((it) => (
          <button key={it.id} type="button" className="glossary-card" onClick={() => setOpen(it)}>
            <div className="g-cat">{CAT_NAME[it.category]}</div>
            <h3>{it.term}</h3>
            {it.aliases?.length ? <div className="g-alias">{it.aliases.slice(0, 3).join(' · ')}</div> : null}
            <p>{it.brief}</p>
          </button>
        ))}
      </div>
      {!list.length ? <div className="empty">无匹配术语</div> : null}

      {open ? (
        <div className="modal-wrap open" onClick={() => setOpen(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="pill gold" style={{ marginBottom: 8 }}>{CAT_NAME[open.category]}</div>
                <h2>{open.term}</h2>
                {open.aliases?.length ? (
                  <div style={{ color: 'var(--ink-3)', marginTop: 6, fontSize: 13 }}>又称：{open.aliases.join(' · ')}</div>
                ) : null}
              </div>
              <button className="icon-btn" onClick={() => setOpen(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--accent)', fontFamily: 'var(--serif)' }}>{open.brief}</p>
              <p>{open.detail}</p>
              {open.chars?.length ? (
                <div className="meta-row">
                  {open.chars.map((c) => (
                    <Link key={c} className="pill" href={`/search/?q=${encodeURIComponent(c)}`}>{c}</Link>
                  ))}
                </div>
              ) : null}
              <div className="meta-row">
                <Link className="pill accent" href={`/read/${open.chRef}/`}>见第{open.chRef}回</Link>
                <Link className="pill" href={`/search/?q=${encodeURIComponent(open.term)}`}>全文检索</Link>
              </div>
              {list.length > 1 ? (
                <p className="muted detail-nav-hint" style={{ marginTop: 14 }}>
                  ↑↓←→ 切换{openIndex >= 0 ? ` · ${openIndex + 1}/${list.length}` : ''} · Esc 关闭
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
