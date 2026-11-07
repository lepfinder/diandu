#!/usr/bin/env node
/**
 * 拉取《红楼梦》微信读书热门划线 + 精选书评，对齐到本站底本后写入
 * apps/honglou/data/weread-social.json（并同步 public/data）。
 *
 * 用法：WEREAD_API_KEY=wrk-xxx node scripts/fetch-weread-honglou.mjs
 */
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BOOK_ID = '34615967';
const SKILL = '1.0.5';
const API = 'https://i.weread.qq.com/api/agent/gateway';
const KEY = process.env.WEREAD_API_KEY;

if (!KEY) {
  console.error('缺少 WEREAD_API_KEY，请先 export WEREAD_API_KEY=wrk-xxx');
  process.exit(1);
}

const VARIANT = {
  馀: '余', 袴: '绔', 帳: '账', 帐: '账', 著: '着', 卻: '却', 爲: '为',
  裏: '里', 麼: '么', 於: '于', 後: '后', 纔: '才', 祇: '只', 只: '只',
  牀: '床', 嚮: '向', 恆: '恒', 繋: '系', 係: '系', 菸: '烟', 煙: '烟',
  塞: '塞', 纂: '纂', 棍: '棍', 根: '根', 谁: '谁', 誰: '谁',
};

async function weread(api_name, params = {}) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ api_name, skill_version: SKILL, ...params }),
  });
  const data = await res.json();
  if (data.upgrade_info) {
    console.warn('[weread] skill 需升级:', data.upgrade_info.message);
  }
  if (data.errcode && data.errcode !== 0) {
    throw new Error(`weread ${api_name} err ${data.errcode}: ${JSON.stringify(data)}`);
  }
  return data;
}

function cnChapterN(title) {
  const m = String(title || '').match(/第([一二三四五六七八九十百〇零两\d]+)回/);
  if (!m) return null;
  const raw = m[1];
  if (/^\d+$/.test(raw)) return Number(raw);
  // 第一二〇回 → 120（逐字数字）
  if (/^[一二三四五六七八九〇零]+$/.test(raw) && !/[十百]/.test(raw)) {
    const dig = { 零: 0, 〇: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
    return Number(raw.split('').map((c) => dig[c]).join(''));
  }
  const CN = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  const parse = (t) => {
    if (!t) return 0;
    if (t === '十') return 10;
    if (t.startsWith('十')) return 10 + (CN[t.slice(1)] || 0);
    if (t.includes('百')) {
      const [a, b = ''] = t.split('百');
      return (CN[a] || 1) * 100 + parse(b.replace(/^[〇零]/, ''));
    }
    if (t.includes('十')) {
      const [a, b = ''] = t.split('十');
      return (CN[a] || 1) * 10 + (b ? CN[b] || 0 : 0);
    }
    return CN[t] || 0;
  };
  return parse(raw);
}

/** 归一化，并返回 norm → 原文下标映射 */
function buildNorm(text) {
  let norm = '';
  const map = []; // norm index → original index
  for (let i = 0; i < text.length; i++) {
    let ch = text[i];
    if (/\[\d+\]/.test(text.slice(i, i + 6))) {
      const m = text.slice(i).match(/^\[\d+\]/);
      if (m) {
        i += m[0].length - 1;
        continue;
      }
    }
    if (/\s/.test(ch) || ch === '\u3000') continue;
    if ('，。！？；：、,.!?;:·•「」『』“”‘’—–…（）()《》〈〉【】[]'.includes(ch)) continue;
    ch = VARIANT[ch] || ch;
    map.push(i);
    norm += ch;
  }
  return { norm, map };
}

function findQuoteInParas(paras, markText) {
  const needle = buildNorm(markText).norm;
  if (needle.length < 4) return null;

  // 跨段落拼接（诗词常被拆成多段）
  let joined = '';
  const map = []; // norm idx → { para, orig }
  for (let pi = 0; pi < paras.length; pi++) {
    const built = buildNorm(paras[pi]);
    for (let j = 0; j < built.norm.length; j++) {
      map.push({ para: pi, orig: built.map[j] });
      joined += built.norm[j];
    }
  }

  const locate = (n) => {
    const idx = joined.indexOf(n);
    if (idx < 0) return null;
    const start = map[idx];
    const end = map[Math.min(idx + n.length - 1, map.length - 1)];
    // quote 取起始段内可见原文；跨段时用起始段从命中处到段末
    const paraText = paras[start.para];
    let quoteEnd = paraText.length;
    if (end.para === start.para) quoteEnd = end.orig + 1;
    const quote = paraText.slice(start.orig, quoteEnd);
    if (quote.length < 4) return null;
    return { para: start.para, quote, matchLen: n.length };
  };

  let hit = locate(needle);
  if (hit) return hit;

  for (const cut of [2, 4, 6, 8, 10, 12, 16, 20]) {
    if (needle.length - cut * 2 < 10) break;
    hit = locate(needle.slice(cut, needle.length - cut));
    if (hit) return { ...hit, fuzzy: true };
  }

  // 按标点切开的短语再试（应对「堪怜/谁怜」等异文）
  const phrases = markText
    .split(/[，。！？；：\s]+/)
    .map((s) => buildNorm(s).norm)
    .filter((s) => s.length >= 6)
    .sort((a, b) => b.length - a.length);
  for (const p of phrases) {
    hit = locate(p);
    if (hit) return { ...hit, fuzzy: true, phrase: true };
  }

  const win = 12;
  for (let i = 0; i <= needle.length - win; i += 3) {
    hit = locate(needle.slice(i, i + win));
    if (hit) return { ...hit, fuzzy: true, window: true };
  }
  return null;
}

function mainStats(items) {
  const matched = items.filter((h) => h.status === 'matched').length;
  return {
    returned: items.length,
    matched,
    miss: items.filter((h) => h.status === 'miss').length,
    non_body: items.filter((h) => h.status === 'non_body').length,
  };
}

const bm = await weread('/book/bestbookmarks', { bookId: BOOK_ID, chapterUid: 0 });
const reviewsRaw = await weread('/review/list', {
  bookId: BOOK_ID,
  reviewListType: 1,
  count: 40,
});

const book = JSON.parse(readFileSync(join(ROOT, 'apps/honglou/data/book.json'), 'utf8'));
const chByN = new Map(book.chapters.map((c) => [c.n, c]));

const uidMeta = new Map();
for (const c of bm.chapters || []) {
  uidMeta.set(c.chapterUid, {
    n: cnChapterN(c.title),
    title: c.title,
  });
}

const highlights = [];
for (const it of bm.items || []) {
  const markText = String(it.markText || '').replace(/\[\d+\]/g, '').trim();
  const meta = uidMeta.get(it.chapterUid) || {};
  const wrTitle = meta.title || '';
  let wrN = meta.n;

  if (wrTitle.includes('前言') || wrN == null) {
    highlights.push({
      bookmarkId: it.bookmarkId,
      markText,
      totalCount: it.totalCount,
      wereadChapterUid: it.chapterUid,
      wereadChapterTitle: wrTitle,
      wereadChapterN: wrN,
      status: 'non_body',
    });
    continue;
  }

  // 优先按微信回目对齐；失败则全书扫
  let hit = null;
  let chN = wrN;
  const prefer = chByN.get(wrN);
  if (prefer) hit = findQuoteInParas(prefer.paras, markText);

  if (!hit) {
    for (const ch of book.chapters) {
      const h = findQuoteInParas(ch.paras, markText);
      if (h) {
        hit = h;
        chN = ch.n;
        break;
      }
    }
  }

  if (!hit) {
    highlights.push({
      bookmarkId: it.bookmarkId,
      markText,
      totalCount: it.totalCount,
      wereadChapterUid: it.chapterUid,
      wereadChapterTitle: wrTitle,
      wereadChapterN: wrN,
      status: 'miss',
    });
    continue;
  }

  highlights.push({
    bookmarkId: it.bookmarkId,
    markText,
    quote: hit.quote,
    totalCount: it.totalCount,
    wereadChapterUid: it.chapterUid,
    wereadChapterTitle: wrTitle,
    wereadChapterN: wrN,
    ch: chN,
    para: hit.para,
    fuzzy: Boolean(hit.fuzzy),
    status: 'matched',
  });
}

const reviews = [];
for (const row of reviewsRaw.reviews || []) {
  const rev = row?.review?.review || {};
  const content = String(rev.content || '').trim();
  if (content.length < 80) continue;
  if (content.includes('世人都晓明星好')) continue;
  reviews.push({
    reviewId: rev.reviewId,
    star: rev.star,
    // 保留全文；过长时截到 4000，避免单条撑爆 JSON
    content: content.length > 4000 ? `${content.slice(0, 4000)}…` : content,
    createTime: rev.createTime,
    authorName: rev.author?.name || '',
    isFinish: rev.isFinish,
  });
  if (reviews.length >= 20) break;
}

const out = {
  source: {
    provider: 'weread',
    bookId: BOOK_ID,
    title: '红楼梦（人民文学版）',
    readerLink: 'https://weread.qq.com/web/reader/0da329707210329f0da4d39',
    fetchedAt: new Date().toISOString().slice(0, 10),
    note: '热门划线取自微信读书公开 Popular Highlights；quote 已对齐本站底本。仅作精读参考。',
    skillVersion: SKILL,
  },
  stats: {
    totalPopular: bm.totalCount,
    ...mainStats(highlights),
  },
  highlights,
  reviews,
};

const dataPath = join(ROOT, 'apps/honglou/data/weread-social.json');
const pubPath = join(ROOT, 'apps/honglou/public/data/weread-social.json');
mkdirSync(dirname(dataPath), { recursive: true });
mkdirSync(dirname(pubPath), { recursive: true });
const json = JSON.stringify(out, null, 2);
writeFileSync(dataPath, json);
writeFileSync(pubPath, json);

console.log('stats', out.stats);
for (const h of highlights) {
  const loc = h.status === 'matched' ? `ch${h.ch}/p${h.para}${h.fuzzy ? '~' : ''}` : '-';
  console.log(
    `${h.status.padEnd(10)} ${String(h.totalCount).padStart(6)} ${loc.padEnd(12)} ${h.markText.slice(0, 36).replace(/\n/g, ' ')}`,
  );
}
console.log('reviews', reviews.length);
console.log('wrote', dataPath);
