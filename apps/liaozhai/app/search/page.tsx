'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from '@/components/Link';
import { useSearchParams } from 'next/navigation';
import { loadBookScript, type BookPayload } from '@classic/ui';
import { searchInChapters } from '@/lib/cn';

function SearchInner() {
  const params = useSearchParams();
  const initial = params.get('q') || '';
  const [q, setQ] = useState(initial);
  const [query, setQuery] = useState(initial);
  const [book, setBook] = useState<BookPayload | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadBookScript().then((payload) => {
      if (cancelled) return;
      setBook(payload);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    if (!query || !book) return [];
    return searchInChapters(book.chapters as Parameters<typeof searchInChapters>[0], query);
  }, [query, book]);

  return (
    <div className="page-scroll">
      <div className="page">
        <div className="section-head">
          <div>
            <h1>全文检索</h1>
            <p className="sub">搜狐鬼花妖、篇名、异史氏曰。按 Enter 检索，结果跳到对应篇。</p>
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
            placeholder="例如：聂小倩 / 画皮 / 异史氏曰"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
          <button className="btn accent" type="submit" disabled={!ready}>
            {ready ? '检索' : '加载中…'}
          </button>
        </form>
        {!ready ? (
          <div className="empty">正在加载全文索引…</div>
        ) : !query ? (
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
                    <span>第 {r.n} 篇</span>
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
