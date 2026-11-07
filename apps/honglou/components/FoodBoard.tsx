'use client';

import { useMemo, useState } from 'react';
import Link from '@/components/Link';
import { asset } from '@classic/ui';

export type FoodItem = {
  id: string;
  category: 'dish' | 'soup' | 'tea' | 'fruit';
  term: string;
  brief: string;
  detail: string;
  scene: string;
  chars?: string[];
  chRef: number;
  image?: string;
};

const CAT_NAME: Record<string, string> = {
  dish: '菜肴',
  soup: '汤羹粥点',
  tea: '茶酒饮子',
  fruit: '果子零食',
};

export function FoodBoard({ items, intro }: { items: FoodItem[]; intro: string }) {
  const [cat, setCat] = useState<'all' | FoodItem['category']>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<FoodItem | null>(null);

  const list = useMemo(() => {
    const kw = q.trim();
    return items.filter((it) => {
      if (cat !== 'all' && it.category !== cat) return false;
      if (!kw) return true;
      const hay = [it.term, it.brief, it.detail, it.scene, ...(it.chars || [])].join(' ');
      return hay.includes(kw);
    });
  }, [items, cat, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
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
        {(['all', 'dish', 'soup', 'tea', 'fruit'] as const).map((k) => (
          <button key={k} className={`chip ${cat === k ? 'active' : ''}`} onClick={() => setCat(k)}>
            {k === 'all' ? '全部' : CAT_NAME[k]} · {counts[k] || 0}
          </button>
        ))}
      </div>

      <div className="search-box" style={{ marginBottom: 22 }}>
        <input
          placeholder="搜吃食、场景、人物… 例如：茄鲞 / 螃蟹 / 燕窝 / 刘姥姥"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="place-grid">
        {list.map((it) => (
          <button key={it.id} type="button" className="glossary-card food-card" onClick={() => setOpen(it)}>
            <div className="food-img" data-label={it.term}>
              {it.image ? (
                <img src={asset(it.image)} alt={it.term} width={640} height={360} loading="eager" decoding="async" />
              ) : null}
            </div>
            <div className="food-body">
              <div className="g-cat">{CAT_NAME[it.category]}</div>
              <h3>{it.term}</h3>
              <p>{it.brief}</p>
            </div>
          </button>
        ))}
      </div>
      {!list.length ? <div className="empty">无匹配条目</div> : null}

      {open ? (
        <div className="modal-wrap open" onClick={() => setOpen(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-hero" style={{ height: 200 }}>
              {open.image ? (
                <img
                  src={asset(open.image)}
                  alt={open.term}
                  width={960}
                  height={360}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 35%' }}
                />
              ) : null}
              <div className="detail-hero-shade" style={{ zIndex: 1 }}>
                <div className="detail-kicker">{CAT_NAME[open.category]} · {open.scene}</div>
                <h2>{open.term}</h2>
              </div>
              <button className="icon-btn detail-close" style={{ zIndex: 2 }} onClick={() => setOpen(null)}>
                ×
              </button>
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
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
