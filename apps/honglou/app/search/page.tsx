'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from '@/components/Link';
import { useSearchParams } from 'next/navigation';
import { searchInChapters } from '@/lib/cn';
import type { Chapter } from '@/lib/types';

type BookPayload = { chapters: Chapter[] };

declare global {
  interface Window {
    __BOOK__?: BookPayload;
  }
}

function SearchInner() {
  const params = useSearchParams();
  const initial = params.get('q') || '';
  const [q, setQ] = useState(initial);
  const [query, setQuery] = useState(initial);
  const [book, setBook] = useState<BookPayload | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.__BOOK__) {
      setBook(window.__BOOK__);
      setReady(true);
      return;
    }
    const s = document.createElement('script');
    s.src = '/data/book.js';
    s.onload = () => {
      setBook(window.__BOOK__ || null);
      setReady(true);
    };
    s.onerror = () => setReady(true);
    document.body.appendChild(s);
    return () => {
      s.onload = null;
      s.onerror = null;
    };
  }, []);

  const results = useMemo(() => {
    if (!query || !book) return [];
    return searchInChapters(book.chapters, query);
  }, [query, book]);

  return (
    <div className="page-scroll">
      <div className="page">
        <div className="section-head">
          <div>
            <h1>全文检索</h1>
            <p className="sub">搜人物、诗句、对白。按 Enter 检索；点击结果跳到对应回目。</p>
          </div>
        </div>
        <div className="search-box">
          <input
            placeholder="例如：葬花 / 贾母 / 冷月葬花魂 / 刘姥姥"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setQuery(q.trim());
            }}
            autoFocus
          />
          <button className="btn accent" onClick={() => setQuery(q.trim())} disabled={!ready}>
            {ready ? '检索' : '加载中…'}
          </button>
        </div>
        {!ready ? (
          <div className="empty">正在加载全文索引…</div>
        ) : !query ? (
          <div className="empty">
            输入关键词开始检索
            <br />
            <span style={{ fontSize: 13, opacity: 0.7 }}>支持人名、回目、诗句片段</span>
          </div>
        ) : results.length === 0 ? (
          <div className="empty">未找到「{query}」</div>
        ) : (
          <>
            <div className="search-meta">共 {results.length} 处</div>
            <div className="result-list">
              {results.map((r, i) => (
                <Link key={i} className="result" href={`/read/${r.n}/`}>
                  <div className="head">
                    <strong>
                      {r.label}　{r.title}
                    </strong>
                    <span>第 {r.n} 回</span>
                  </div>
                  <div className="snip" dangerouslySetInnerHTML={{ __html: r.snip }} />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="empty">加载中…</div>}>
      <SearchInner />
    </Suspense>
  );
}
