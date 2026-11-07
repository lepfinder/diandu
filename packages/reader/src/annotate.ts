import type { ReaderNote } from './types';

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 把本回划线/批注嵌进段落；只标第一次命中，重叠时取先出现的长片段 */
export function annotateParagraph(text: string, notes: ReaderNote[]) {
  type Span = { start: number; end: number; note: ReaderNote };
  const spans: Span[] = [];
  for (const note of notes) {
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
    if (i < span.start) out += escapeHtml(text.slice(i, span.start));
    const cls = span.note.type === 'note' ? 'cr-note-wave' : 'cr-hl';
    out += `<span class="${cls}" data-note-id="${escapeHtml(span.note.id)}">${escapeHtml(text.slice(span.start, span.end))}</span>`;
    i = span.end;
  }
  if (i < text.length) out += escapeHtml(text.slice(i));
  return out;
}
