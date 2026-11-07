import type { ReaderAnnotateOptions, ReaderNote, ReaderSocialHighlight } from './types';

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type Anno = {
  id: string;
  type: 'note' | 'mark' | 'social';
  quote: string;
};

function toAnnos(
  notes: ReaderNote[],
  social: ReaderSocialHighlight[] = [],
): Anno[] {
  return [
    ...notes.map((n) => ({ id: n.id, type: n.type, quote: n.quote })),
    ...social.map((h) => ({ id: h.id, type: 'social' as const, quote: h.quote })),
  ];
}

function classFor(type: Anno['type']) {
  if (type === 'note') return 'cr-note-wave';
  if (type === 'social') return 'cr-hl-social';
  return 'cr-hl';
}

/** 把本回划线/批注/社群热门嵌进段落；只标第一次命中，重叠时取先出现的长片段 */
export function annotateParagraph(
  text: string,
  notes: ReaderNote[],
  options?: ReaderAnnotateOptions & { social?: ReaderSocialHighlight[] },
) {
  const decoratePlain = options?.decoratePlain;
  const wrapPlain = (plain: string) =>
    decoratePlain ? decoratePlain(plain) : escapeHtml(plain);

  type Span = { start: number; end: number; note: Anno };
  const spans: Span[] = [];
  for (const note of toAnnos(notes, options?.social)) {
    if (!note.quote || note.quote.length < 2) continue;
    const idx = text.indexOf(note.quote);
    if (idx >= 0) spans.push({ start: idx, end: idx + note.quote.length, note });
  }
  spans.sort((a, b) => a.start - b.start || b.end - a.start - (a.end - b.start));
  const kept: Span[] = [];
  for (const span of spans) {
    if (kept.some((item) => span.start < item.end && item.start < span.end)) continue;
    kept.push(span);
  }
  let out = '';
  let i = 0;
  for (const span of kept) {
    if (i < span.start) out += wrapPlain(text.slice(i, span.start));
    out += `<span class="${classFor(span.note.type)}" data-note-id="${escapeHtml(span.note.id)}">${wrapPlain(text.slice(span.start, span.end))}</span>`;
    i = span.end;
  }
  if (i < text.length) out += wrapPlain(text.slice(i));
  return out;
}

export function formatSocialCount(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, '')}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}千`;
  return String(n);
}
