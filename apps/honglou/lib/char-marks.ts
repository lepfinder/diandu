import { getAllCharacters } from '@/lib/content';

type MarkName = { nm: string; id: string };

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let cached: Map<string, MarkName[]> | null = null;

function buildMarks(): Map<string, MarkName[]> {
  if (cached) return cached;
  const buckets = new Map<string, MarkName[]>();
  for (const c of getAllCharacters()) {
    const names = [c.name, ...(c.aliases || [])].filter((n) => n && n.length >= 2);
    for (const nm of names) {
      const k = nm[0];
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k)!.push({ nm, id: c.id });
    }
  }
  buckets.forEach((arr) => arr.sort((a, b) => b.nm.length - a.nm.length));
  cached = buckets;
  return buckets;
}

/** 给阅读壳 decoratePlain：在纯文本片段上挂人名链（自行 escape） */
export function decorateHonglouPlain(text: string): string {
  const marks = buildMarks();
  let out = '';
  let i = 0;
  while (i < text.length) {
    const bucket = marks.get(text[i]);
    let hit: MarkName | null = null;
    if (bucket) {
      for (const m of bucket) {
        if (text.startsWith(m.nm, i)) {
          hit = m;
          break;
        }
      }
    }
    if (hit) {
      out += `<span class="mark" data-char="${escapeHtml(hit.id)}" title="${escapeHtml(hit.nm)}">${escapeHtml(hit.nm)}</span>`;
      i += hit.nm.length;
    } else {
      out += escapeHtml(text[i]);
      i += 1;
    }
  }
  return out;
}
