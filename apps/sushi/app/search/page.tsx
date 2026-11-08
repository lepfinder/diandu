'use client';

import Link from '@/components/Link';
import { useMemo, useState } from 'react';
import { getWorks } from '@/lib/data';

type Hit = {
  id: string;
  title: string;
  meta: string;
  snip: string;
};

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlight(text: string, q: string) {
  if (!q) return text;
  const re = new RegExp(`(${escapeRegExp(q)})`, 'gi');
  return text.split(re).map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? <em key={i}>{part}</em> : part,
  );
}

export default function SearchPage() {
  const [q, setQ] = useState('');
  const works = useMemo(() => getWorks(), []);

  const hits = useMemo(() => {
    const query = q.trim();
    if (!query) return [] as Hit[];
    const out: Hit[] = [];
    for (const w of works) {
      const hay = [
        w.title,
        w.blurb,
        w.place,
        w.note || '',
        w.background || '',
        w.why || '',
        ...(w.glosses || []),
        ...w.lines,
      ].join('\n');
      const idx = hay.indexOf(query);
      if (idx < 0) continue;
      const start = Math.max(0, idx - 18);
      const end = Math.min(hay.length, idx + query.length + 28);
      const snip = `${start > 0 ? '…' : ''}${hay.slice(start, end).replace(/\n/g, ' ')}${
        end < hay.length ? '…' : ''
      }`;
      out.push({
        id: w.id,
        title: w.title,
        meta: `${w.genreLabel} · ${w.yearLabel} · ${w.place}`,
        snip,
      });
    }
    return out;
  }, [q, works]);

  return (
    <div className="page-scroll">
      <div className="page">
        <header className="section-head">
          <div>
            <h1>检索</h1>
            <p className="sub">在已收录的苏轼作品与导读里搜索。</p>
          </div>
        </header>

        <div className="search-box">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="试搜：赤壁、烟雨、子由…"
            autoFocus
          />
        </div>

        {q.trim() ? (
          <div className="search-meta">
            {hits.length} 条结果 · 「{q.trim()}」
          </div>
        ) : (
          <div className="search-meta">输入关键词开始</div>
        )}

        <div className="result-list">
          {hits.map((hit) => (
            <Link key={hit.id} className="result" href={`/works/${hit.id}/`}>
              <div className="head">
                <strong>{hit.title}</strong>
                <span>{hit.meta}</span>
              </div>
              <div className="snip">{highlight(hit.snip, q.trim())}</div>
            </Link>
          ))}
        </div>

        {q.trim() && hits.length === 0 ? <div className="empty">没有找到相关句子。</div> : null}
      </div>
    </div>
  );
}
