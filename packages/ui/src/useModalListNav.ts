'use client';

import { useEffect } from 'react';

/** Esc 关闭；↑↓←→ 在当前列表中循环切换详情项。 */
export function useModalListNav<T extends { id: string }>(
  open: T | null,
  items: readonly T[],
  setOpen: (item: T | null) => void,
): number {
  const openIndex = open ? items.findIndex((item) => item.id === open.id) : -1;

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(null);
        return;
      }

      if (
        event.key !== 'ArrowUp' &&
        event.key !== 'ArrowDown' &&
        event.key !== 'ArrowLeft' &&
        event.key !== 'ArrowRight'
      ) {
        return;
      }
      if (items.length === 0) return;

      event.preventDefault();
      const current = items.findIndex((item) => item.id === open!.id);
      const from = current >= 0 ? current : 0;
      const goPrev = event.key === 'ArrowUp' || event.key === 'ArrowLeft';
      const next = goPrev
        ? (from - 1 + items.length) % items.length
        : (from + 1) % items.length;
      setOpen(items[next] ?? null);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, items, setOpen]);

  return openIndex;
}
