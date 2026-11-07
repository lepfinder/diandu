'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

const ZanghuaField = dynamic(() => import('@/components/three/ZanghuaField'), {
  ssr: false,
  loading: () => (
    <div className="scene-loading" style={{ height: '100vh', background: '#0e0a0c' }}>
      <div className="scene-loading-ring" />
      <p>花谢花飞…</p>
    </div>
  ),
});

export default function ZanghuaPage() {
  useEffect(() => {
    document.body.setAttribute('data-route', 'zanghua');
    return () => document.body.removeAttribute('data-route');
  }, []);

  return (
    <div className="zanghua-page">
      <ZanghuaField />
    </div>
  );
}
