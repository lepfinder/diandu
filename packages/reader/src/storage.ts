import type { ReaderNote } from './types';

export function key(prefix: string, name: string) {
  return `${prefix}:${name}`;
}

export function readNumber(prefix: string, name: string, fallback: number) {
  if (typeof window === 'undefined') return fallback;
  // getItem 缺失时返回 null；Number(null) === 0，不能当成有效值
  const item = localStorage.getItem(key(prefix, name));
  if (item == null || item === '') return fallback;
  const raw = Number(item);
  return Number.isFinite(raw) ? raw : fallback;
}

/** 读取并限制在区间内；用于字号/行宽等，避免历史脏数据（含 0）把版面压扁 */
export function readClampedNumber(
  prefix: string,
  name: string,
  fallback: number,
  min: number,
  max: number,
) {
  const raw = readNumber(prefix, name, fallback);
  if (raw < min || raw > max) return fallback;
  return raw;
}

export function readString(prefix: string, name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(key(prefix, name)) || fallback;
}

export function write(prefix: string, name: string, value: string | number) {
  localStorage.setItem(key(prefix, name), String(value));
}

export function loadNotes(prefix: string): ReaderNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(key(prefix, 'notes')) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (item): item is ReaderNote =>
        item
        && (item.type === 'note' || item.type === 'mark')
        && typeof item.id === 'string'
        && typeof item.ch === 'number'
        && typeof item.quote === 'string',
    );
  } catch {
    return [];
  }
}

export function saveNotes(prefix: string, notes: ReaderNote[]) {
  localStorage.setItem(key(prefix, 'notes'), JSON.stringify(notes));
}
