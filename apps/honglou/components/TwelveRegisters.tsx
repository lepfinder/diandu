'use client';

import { useState } from 'react';
import type { TwelveItem } from '@/lib/types';
import { getTwelveDetail, type TwelveDetail } from '@/lib/twelve-detail';
import { TwelveDetailModal } from './TwelveDetailModal';

function Card({
  t,
  onOpen,
}: {
  t: TwelveItem & { image?: string; verseFocus?: string; verseShared?: string };
  onOpen: (id: string) => void;
}) {
  return (
    <button type="button" className="twelve-card" onClick={() => onOpen(t.id)}>
      <div className="twelve-img" data-label={t.name}>
        {t.image ? (
          <img src={t.image} alt={t.name} width={640} height={360} loading="eager" decoding="async" />
        ) : null}
      </div>
      <div className="twelve-body">
        <div className="sym">{t.symbol}</div>
        <h3>{t.name}</h3>
        <div className="v">{t.verseFocus || t.verse}</div>
        {t.verseShared && t.verseShared.includes('合一') ? (
          <div className="v-note">钗黛合一 / 共用正册判词</div>
        ) : null}
        {t.verseShared && t.verseShared.includes('未存') ? (
          <div className="v-note">无传世判词 · 点击看详情</div>
        ) : null}
      </div>
    </button>
  );
}

export function TwelveRegisters({
  zheng,
  fu,
  youFu,
  intro,
  fuIntro,
  youFuIntro,
}: {
  zheng: TwelveItem[];
  fu: TwelveItem[];
  youFu: TwelveItem[];
  intro: string;
  fuIntro: string;
  youFuIntro: string;
}) {
  const [tab, setTab] = useState<'zheng' | 'fu' | 'youfu'>('zheng');
  const [detail, setDetail] = useState<TwelveDetail | null>(null);
  const list = tab === 'zheng' ? zheng : tab === 'fu' ? fu : youFu;

  return (
    <>
      <div className="filters" style={{ marginBottom: 18 }}>
        <button className={`chip ${tab === 'zheng' ? 'active' : ''}`} onClick={() => setTab('zheng')}>
          正册 · 十二钗
        </button>
        <button className={`chip ${tab === 'fu' ? 'active' : ''}`} onClick={() => setTab('fu')}>
          副册 · 十二人
        </button>
        <button className={`chip ${tab === 'youfu' ? 'active' : ''}`} onClick={() => setTab('youfu')}>
          又副册 · 十二人
        </button>
      </div>
      <p className="sub" style={{ margin: '0 0 22px', maxWidth: '64ch', color: 'var(--ink-3)', fontSize: 14, lineHeight: 1.8 }}>
        {tab === 'zheng' ? intro : tab === 'fu' ? fuIntro : youFuIntro}
        {'　'}点击卡片查看小传、判词、情节与诗作。
      </p>
      <div className="twelve-grid">
        {list.map((t) => (
          <Card key={t.id} t={t as any} onOpen={(id) => setDetail(getTwelveDetail(id))} />
        ))}
      </div>

      <TwelveDetailModal detail={detail} onClose={() => setDetail(null)} />
    </>
  );
}
