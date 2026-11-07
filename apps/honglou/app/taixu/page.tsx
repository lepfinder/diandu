'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from '@/components/Link';

const TaixuJourney = dynamic(() => import('@/components/three/TaixuJourney'), {
  ssr: false,
  loading: () => (
    <div className="scene-loading" style={{ height: '100vh', background: '#0a0c12' }}>
      <div className="scene-loading-ring" />
      <p>太虚幻境…</p>
    </div>
  ),
});

export default function TaixuPage() {
  useEffect(() => {
    document.body.setAttribute('data-route', 'taixu');
    return () => document.body.removeAttribute('data-route');
  }, []);

  return (
    <div className="taixu-page">
      {/* 顶部悬浮导航 */}
      <header className="taixu-top">
        <Link href="/" className="taixu-brand">
          梦
        </Link>
        <nav className="taixu-top-nav">
          <Link href="/read/5/">第五回</Link>
          <Link href="/topics/twelve/">十二钗</Link>
          <Link href="/star/">星图</Link>
          <Link href="/garden/">园林</Link>
          <Link href="/">精读站</Link>
        </nav>
      </header>

      <TaixuJourney />
    </div>
  );
}
