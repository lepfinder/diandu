'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { getPortalHref } from '@classic/ui';

const KEY = 'jp:age-ok';

export function AgeGate({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    setOk(localStorage.getItem(KEY) === '1');
  }, []);

  if (ok === null) {
    return <div className="age-gate age-gate-loading" aria-hidden />;
  }

  if (!ok) {
    return (
      <div className="age-gate">
        <div className="age-gate-card">
          <p className="age-gate-kicker">内容提示</p>
          <h1>金瓶梅 · 成年读者确认</h1>
          <p>
            本书原文含直白的情欲描写，按崇祯本照录，未作删改。
            请确认你已成年，并自愿阅读此类古典小说文本。
          </p>
          <div className="age-gate-actions">
            <button
              type="button"
              className="btn accent"
              onClick={() => {
                localStorage.setItem(KEY, '1');
                setOk(true);
              }}
            >
              我已成年，进入
            </button>
            <a className="btn ghost" href={getPortalHref()}>返回典读首页</a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
