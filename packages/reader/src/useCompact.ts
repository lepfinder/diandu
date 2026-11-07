'use client';

import { useEffect, useState } from 'react';

/** 窄屏或粗指针视为紧凑布局：底栏工具 / 底部抽屉 */
export function useCompact(breakpoint = 720) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const widthQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const coarseQuery = window.matchMedia('(pointer: coarse)');
    const update = () => setCompact(widthQuery.matches || coarseQuery.matches);
    update();
    widthQuery.addEventListener('change', update);
    coarseQuery.addEventListener('change', update);
    return () => {
      widthQuery.removeEventListener('change', update);
      coarseQuery.removeEventListener('change', update);
    };
  }, [breakpoint]);

  return compact;
}
