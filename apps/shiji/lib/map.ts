import type { MapAnchor } from './types';

/** 官方江山时序主站；史书站只做 deep link，不镜像源码。 */
export const JIANGSHAN_BASE = 'https://deanchen.me/jiangshan-map/';

export function jiangshanUrl(anchor: MapAnchor & { lang?: 'en' | 'zh-tw' } = {}): string | null {
  const params = new URLSearchParams();
  if (anchor.year != null && Number.isFinite(anchor.year)) {
    params.set('year', String(Math.trunc(anchor.year)));
  }
  if (anchor.place?.trim()) params.set('place', anchor.place.trim());
  if (anchor.person?.trim()) params.set('person', anchor.person.trim());
  if (anchor.lang) params.set('lang', anchor.lang);
  if (![...params.keys()].some((k) => k === 'year' || k === 'place' || k === 'person')) {
    return null;
  }
  const q = params.toString();
  return q ? `${JIANGSHAN_BASE}?${q}` : JIANGSHAN_BASE;
}

export function jiangshanLabel(anchor: MapAnchor): string {
  const bits: string[] = [];
  if (anchor.year != null) {
    bits.push(anchor.year < 0 ? `前${-anchor.year}年` : `${anchor.year}年`);
  }
  if (anchor.place) bits.push(anchor.place);
  if (anchor.person) bits.push(anchor.person);
  return bits.length ? `江山舆图 · ${bits.join(' · ')}` : '江山舆图';
}
