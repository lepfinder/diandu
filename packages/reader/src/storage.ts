import type { ReaderNote } from './types';

export function key(prefix: string, name: string) {
  return `${prefix}:${name}`;
}

export function readNumber(prefix: string, name: string, fallback: number) {
  if (typeof window === 'undefined') return fallback;
  const raw = Number(localStorage.getItem(key(prefix, name)));
  return Number.isFinite(raw) ? raw : fallback;
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
