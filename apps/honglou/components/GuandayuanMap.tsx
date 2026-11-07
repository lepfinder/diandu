'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from '@/components/Link';
import type { TopicPlace } from '@/lib/types';

/** 大观园示意地图：点击院落看详情 */
const SPOTS: Record<string, { x: number; y: number; r?: number }> = {
  tuanYuan: { x: 320, y: 300 },
  yiHong: { x: 560, y: 180 },
  xiaoXiang: { x: 180, y: 180 },
  hengWu: { x: 760, y: 220 },
  qiuShuang: { x: 620, y: 360 },
  daoXiang: { x: 200, y: 420 },
  ouXiang: { x: 420, y: 430 },
  longCui: { x: 820, y: 400 },
  luXue: { x: 480, y: 120 },
  diCui: { x: 240, y: 320 },
  mangXiang: { x: 140, y: 280 },
  aoXiang: { x: 700, y: 480 },
  huaShu: { x: 880, y: 140 },
  ningGuo: { x: 920, y: 300 },
};

const PLACE_IMAGES: Record<string, string> = {
  yiHong: '/images/place-yihong.webp',
  xiaoXiang: '/images/place-xiaoxiang.webp',
  hengWu: '/images/place-hengwu.webp',
  qiuShuang: '/images/place-qiushuang.webp',
  daoXiang: '/images/place-daoxiang.webp',
  ouXiang: '/images/place-nuanxiang.webp',
  longCui: '/images/place-longcui.webp',
  luXue: '/images/place-luxue.webp',
  tuanYuan: '/images/place-qinfang.webp',
  diCui: '/images/place-dicui.webp',
  mangXiang: '/images/place-mangxiang.webp',
  aoXiang: '/images/place-aojing.webp',
  huaShu: '/images/place-lixang.webp',
  ningGuo: '/images/place-huifang.webp',
};

/** 院落 → 相关回目（示意） */
const PLACE_CH: Record<string, number[]> = {
  yiHong: [23, 31, 63, 78],
  xiaoXiang: [23, 27, 34, 45, 97],
  hengWu: [8, 23, 42, 70],
  qiuShuang: [37, 56, 74],
  daoXiang: [17, 37, 40],
  ouXiang: [50],
  longCui: [41, 63, 112],
  luXue: [49, 50],
  tuanYuan: [17, 23, 40],
  diCui: [27],
  mangXiang: [27],
  aoXiang: [76],
  huaShu: [36, 58],
  ningGuo: [5, 13, 63],
};

export function GuandayuanMap({ places }: { places: TopicPlace[] }) {
  const [active, setActive] = useState<TopicPlace | null>(null);

  return (
    <>
      <div className="garden-map-wrap">
        <svg viewBox="0 0 1040 560" className="garden-map">
          {/* 底图 */}
          <rect x="0" y="0" width="1040" height="560" fill="var(--paper-3)" rx="20" />
          <path d="M80 260 C 220 200, 360 340, 520 300 S 820 240, 980 320" fill="none" stroke="var(--jade)" strokeWidth="18" opacity="0.25" />
          <path d="M80 260 C 220 200, 360 340, 520 300 S 820 240, 980 320" fill="none" stroke="var(--paper)" strokeWidth="8" opacity="0.5" />
          <text x="520" y="40" textAnchor="middle" fill="var(--ink-4)" fontFamily="var(--serif)" fontSize="18" letterSpacing="8">
            大 观 园 示 意
          </text>
          <text x="520" y="300" textAnchor="middle" fill="var(--jade)" fontFamily="var(--serif)" fontSize="22" opacity="0.45">
            沁芳池
          </text>

          {places.map((p) => {
            const pos = SPOTS[p.id] || { x: 500, y: 280 };
            const on = active?.id === p.id;
            return (
              <g key={p.id} style={{ cursor: 'pointer' }} onClick={() => setActive(p)}>
                <circle cx={pos.x} cy={pos.y} r={on ? 18 : 13} fill={on ? 'var(--accent)' : 'var(--paper)'} stroke="var(--accent)" strokeWidth="2" />
                <circle cx={pos.x} cy={pos.y} r={on ? 26 : 20} fill="none" stroke="var(--accent)" strokeWidth="1" opacity={on ? 0.5 : 0.2} />
                <text x={pos.x} y={pos.y - 28} textAnchor="middle" fill="var(--ink-2)" fontFamily="var(--serif)" fontSize="13">
                  {p.name.replace(/ /g, '').split('·')[0]}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="graph-hint">点击院落查看 · 示意图，非精确平面</div>
      </div>

      {active ? (
        <div className="modal-wrap open" onClick={() => setActive(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-hero" style={{ height: 180 }}>
              {PLACE_IMAGES[active.id] ? (
                <Image src={PLACE_IMAGES[active.id]} alt={active.name} width={960} height={360} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
              ) : null}
              <div className="detail-hero-shade">
                <div className="detail-kicker">{active.host}</div>
                <h2>{active.name}</h2>
              </div>
              <button className="icon-btn detail-close" onClick={() => setActive(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontFamily: 'var(--serif)', lineHeight: 1.9 }}>{active.desc}</p>
              <div className="meta-row">
                {(active.tags || []).map((t) => (
                  <span key={t} className="pill">
                    {t}
                  </span>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: '0.08em', marginBottom: 8 }}>相关回目</div>
                <div className="meta-row">
                  {(PLACE_CH[active.id] || []).map((ch) => (
                    <Link key={ch} className="pill accent" href={`/read/${ch}/`}>
                      第{ch}回
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
