'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from '@/components/Link';
import { useSearchParams } from 'next/navigation';
import { searchInChapters } from '@/lib/cn';
import book from '@/data/book.json';
import type { Chapter } from '@/lib/types';

function SearchInner() {
  const params = useSearchParams();
  const initial = params.get('q') || '';
  const [q, setQ] = useState(initial);
  const [query, setQuery] = useState(initial);
  const chapters = (book as { chapters: Chapter[] }).chapters;

  const results = useMemo(() => {
    if (!query) return [];
    return searchInChapters(chapters, query);
  }, [query, chapters]);

  return (
    <div className="page-scroll">
      <div className="page">
        <div className="section-head">
          <div>
            <h1>全文检索</h1>
            <p className="sub">搜一个人、一句回目、一段对白。按 Enter 检索，结果跳到对应回。</p>
          </div>
        </div>
        <form
          className="search-box"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(q.trim());
          }}
        >
          <input
            placeholder="例如：曹操 / 空城计 / 滚滚长江"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
          <button className="btn accent" type="submit">检索</button>
        </form>
        {!query ? (
          <div className="empty">输入关键词开始检索</div>
        ) : results.length === 0 ? (
          <div className="empty">未找到「{query}」</div>
        ) : (
          <>
            <div className="search-meta">共 {results.length} 处{results.length >= 80 ? '，已显示前 80 处' : ''}</div>
            <div className="result-list">
              {results.map((r, i) => (
                <Link key={`${r.n}-${i}`} className="result" href={`/read/${r.n}/`}>
                  <div className="head">
                    <strong>{r.label}　{r.title}</strong>
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
