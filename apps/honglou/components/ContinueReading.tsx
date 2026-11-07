'use client';

import { useEffect, useState } from 'react';
import Link from '@/components/Link';

type Item = { n: number; label: string; t1: string };

const tocUrl = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/data/toc.json`;

/** 目录抽屉顶部：从 hl:lastN 恢复继续阅读 */
export function ContinueReading({ currentN }: { currentN: number }) {
  const [last, setLast] = useState<Item | null>(null);

  useEffect(() => {
    const lastN = Number(localStorage.getItem('hl:lastN') || 0);
    if (!lastN || lastN === currentN) {
      setLast(null);
      return;
    }
    let cancelled = false;
    fetch(tocUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Item[] | null) => {
        if (cancelled || !Array.isArray(data)) return;
        const item = data.find((c) => c.n === lastN);
        setLast(item ? { n: item.n, label: item.label, t1: item.t1 } : null);
      })
      .catch(() => {
        if (!cancelled) setLast(null);
      });
    return () => {
      cancelled = true;
    };
  }, [currentN]);

  if (!last) return null;
  return (
    <Link href={`/read/${last.n}/`} className="cr-toc-item" style={{ background: 'var(--paper-2, transparent)' }}>
      <span className="n">续</span>
      <span className="t">
        继续阅读 · {last.label}
        <br />
        <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>{last.t1}</span>
      </span>
    </Link>
  );
}
