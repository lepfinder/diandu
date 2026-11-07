'use client';

import dynamic from 'next/dynamic';
import Link from '@/components/Link';

const GardenMap = dynamic(() => import('@/components/three/GardenMap'), {
  ssr: false,
  loading: () => (
    <div className="scene-loading">
      <div className="scene-loading-ring" />
      <p>正在铺开大观园…</p>
    </div>
  ),
});

export default function GardenPage() {
  return (
    <div className="scene-page">
      <header className="scene-head">
        <div>
          <div className="scene-kicker">大观园 · 微缩沙盘</div>
          <h1>大观园三维漫游</h1>
          <p className="sub">
            沁芳溪斜贯全园，怡红近门、潇湘多竹、蘅芜冷香、稻香田园。切换五幕气候，看这座青春乌托邦从盛景走向白茫茫。
          </p>
        </div>
        <div className="scene-head-actions">
          <Link className="btn ghost sm" href="/topics/places/">
            二维图鉴
          </Link>
          <Link className="btn ghost sm" href="/star/">
            三维星图
          </Link>
        </div>
      </header>
      <div className="scene-stage">
        <GardenMap />
      </div>
    </div>
  );
}
