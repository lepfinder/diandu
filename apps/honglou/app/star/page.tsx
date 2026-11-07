'use client';

import dynamic from 'next/dynamic';
import Link from '@/components/Link';

const StarMap = dynamic(() => import('@/components/three/StarMap'), {
  ssr: false,
  loading: () => (
    <div className="scene-loading">
      <div className="scene-loading-ring" />
      <p>正在展开星图…</p>
    </div>
  ),
});

export default function StarPage() {
  return (
    <div className="scene-page">
      <header className="scene-head">
        <div>
          <div className="scene-kicker">人物 · 关系星图</div>
          <h1>人物关系</h1>
          <p className="sub">
            拖拽旋转，滚轮缩放。一百三十余位人物全数点亮；血缘、姻亲、情缘、主仆、冲突、师友一图看清；拖动回目轴，看群星如何随贾府兴衰明灭。
          </p>
        </div>
        <div className="scene-head-actions">
          <Link className="btn ghost sm" href="/characters/">
            人物百科
          </Link>
          <Link className="btn ghost sm" href="/garden/">
            三维园林
          </Link>
        </div>
      </header>
      <div className="scene-stage">
        <StarMap />
      </div>
    </div>
  );
}
