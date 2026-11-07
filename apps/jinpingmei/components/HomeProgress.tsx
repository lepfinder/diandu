'use client';

import { useEffect, useState } from 'react';
import Link from '@/components/Link';

const TOTAL = 100;

export function HomeProgress({
  author,
  edition,
  exported,
  charsWan,
}: {
  author: string;
  edition: string;
  exported: string;
  charsWan: number;
}) {
  const [chapter, setChapter] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('jp:chapter');
    if (stored == null) {
      setChapter(null);
      return;
    }
    const n = Number(stored);
    setChapter(Number.isFinite(n) && n > 0 ? Math.min(TOTAL, Math.floor(n)) : null);
  }, []);

  const pct = chapter == null ? 0 : Math.max(2, Math.round((chapter / TOTAL) * 100));
  const progressLabel =
    chapter == null ? '尚未开卷' : `已读至第 ${chapter} 回 · ${pct}%`;

  return (
    <div className="progress-card">
      <div className="label">
        <strong>全书概览</strong>
        <span>一百回 · 约 {charsWan} 万字</span>
      </div>
      <div className="bar"><i style={{ width: `${pct}%` }} /></div>
      <p className="meta-note">
        {author}
        <br />
        {edition}
        <br />
        导出于 {exported}
        <br />
        原文照录，含直白的情欲描写。
      </p>
      <div className="progress-foot">
        <span>{progressLabel}</span>
        {chapter == null ? (
          <Link href="/read/1/">从第一回读起 →</Link>
        ) : (
          <Link href={`/read/${chapter}/`}>继续阅读 →</Link>
        )}
      </div>
    </div>
  );
}
