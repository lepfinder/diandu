'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** 关系可视化已统一到三维星图 */
export default function GraphRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/star/');
  }, [router]);
  return null;
}
