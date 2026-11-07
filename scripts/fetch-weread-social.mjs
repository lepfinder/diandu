#!/usr/bin/env node
/**
 * 拉取微信读书热门划线 + 精选书评，对齐本站底本后写入
 * apps/<book>/data/weread-social.json（并同步 public/data）。
 *
 * 用法：
 *   WEREAD_API_KEY=wrk-xxx node scripts/fetch-weread-social.mjs
 *   WEREAD_API_KEY=wrk-xxx node scripts/fetch-weread-social.mjs sanguo shuihu
 *   WEREAD_API_KEY=wrk-xxx node scripts/fetch-weread-social.mjs --all
 *
 * 默认拉取除 honglou 外的全部书目；--all 含红楼。
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SKILL = '1.0.5';
const API = 'https://i.weread.qq.com/api/agent/gateway';
const KEY = process.env.WEREAD_API_KEY;
const REVIEW_TARGET = 20;
/** 全书热门划线条数（接口支持 count，默认仅 20） */
const HIGHLIGHT_COUNT = 100;

/** @type {Record<string, { wereadBookId: string, title: string, readerLink: string }>} */
const BOOKS = {
  honglou: {
    wereadBookId: '34615967',
    title: '红楼梦（人民文学版）',
    readerLink: 'https://weread.qq.com/web/reader/0da329707210329f0da4d39',
  },
  sanguo: {
    wereadBookId: '29855984',
    title: '三国演义（人民文学版）',
    readerLink: 'https://weread.qq.com/web/reader/c1a32c7071c7a0bc1a6d9f4',
  },
  shuihu: {
    wereadBookId: '29855986',
    title: '水浒传（人民文学版）',
    readerLink: 'https://weread.qq.com/web/reader/c1c32c9071c7a0ec1c9d9f6',
  },
  xiyouji: {
    wereadBookId: '34631845',
    title: '西游记（人民文学版）',
    readerLink: 'https://weread.qq.com/web/reader/0db32990721032a10db4d3b',
  },
  jinpingmei: {
    wereadBookId: '3300133241',
    title: '金瓶梅（崇祯本原版）',
    readerLink: 'https://weread.qq.com/web/reader/10832fd0813ab9a09g010889',
  },
  liaozhai: {
    wereadBookId: '26078994',
    title: '聊斋志异',
    readerLink: 'https://weread.qq.com/web/reader/18e325c0718e1f218e4d9b2',
  },
};

if (!KEY) {
  console.error('缺少 WEREAD_API_KEY，请先 export WEREAD_API_KEY=wrk-xxx');
  process.exit(1);
}

const VARIANT = {
  馀: '余', 袴: '绔', 帳: '账', 帐: '账', 著: '着', 卻: '却', 爲: '为',
  裏: '里', 麼: '么', 於: '于', 後: '后', 纔: '才', 祇: '只', 只: '只',
  牀: '床', 嚮: '向', 恆: '恒', 繋: '系', 係: '系', 菸: '烟', 煙: '烟',
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

function buildNorm(text) {
  let norm = '';
  const map = [];
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

  let joined = '';
  const map = [];
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
  return {
    returned: items.length,
    matched: items.filter((h) => h.status === 'matched').length,
    miss: items.filter((h) => h.status === 'miss').length,
    non_body: items.filter((h) => h.status === 'non_body').length,
  };
}

async function fetchOne(appId) {
  const cfg = BOOKS[appId];
  if (!cfg) throw new Error(`未知书目: ${appId}`);
  const bookPath = join(ROOT, `apps/${appId}/data/book.json`);
  if (!existsSync(bookPath)) throw new Error(`缺少 ${bookPath}`);

  console.log(`\n==== ${appId} / ${cfg.title} (${cfg.wereadBookId}) ====`);
  const book = JSON.parse(readFileSync(bookPath, 'utf8'));
  const chByN = new Map(book.chapters.map((c) => [c.n, c]));

  const bm = await weread('/book/bestbookmarks', {
    bookId: cfg.wereadBookId,
    chapterUid: 0,
    count: HIGHLIGHT_COUNT,
  });
  const reviewsRaw = await weread('/review/list', {
    bookId: cfg.wereadBookId,
    reviewListType: 1,
    count: 40,
  });

  const uidMeta = new Map();
  for (const c of bm.chapters || []) {
    uidMeta.set(c.chapterUid, { n: cnChapterN(c.title), title: c.title });
  }

  const highlights = [];
  for (const it of bm.items || []) {
    const markText = String(it.markText || '').replace(/\[\d+\]/g, '').trim();
    const meta = uidMeta.get(it.chapterUid) || {};
    const wrTitle = meta.title || '';
    const wrN = meta.n;
    const base = {
      bookmarkId: it.bookmarkId,
      markText,
      totalCount: it.totalCount,
      wereadChapterUid: it.chapterUid,
      wereadChapterTitle: wrTitle,
      wereadChapterN: wrN,
    };

    if (/前言|出版说明|导读|作者简介|目录/.test(wrTitle)) {
      highlights.push({ ...base, status: 'non_body' });
      continue;
    }

    let hit = null;
    let chN = wrN;
    if (wrN != null && chByN.has(wrN)) {
      hit = findQuoteInParas(chByN.get(wrN).paras, markText);
    }
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
        ...base,
        status: wrN == null && !/第.+回/.test(wrTitle) ? 'non_body' : 'miss',
      });
      continue;
    }

    highlights.push({
      ...base,
      quote: hit.quote,
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
      content: content.length > 4000 ? `${content.slice(0, 4000)}…` : content,
      createTime: rev.createTime,
      authorName: rev.author?.name || '',
      isFinish: rev.isFinish,
    });
    if (reviews.length >= REVIEW_TARGET) break;
  }

  const out = {
    source: {
      provider: 'weread',
      bookId: cfg.wereadBookId,
      title: cfg.title,
      readerLink: cfg.readerLink,
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

  const dataPath = join(ROOT, `apps/${appId}/data/weread-social.json`);
  const pubPath = join(ROOT, `apps/${appId}/public/data/weread-social.json`);
  mkdirSync(dirname(dataPath), { recursive: true });
  mkdirSync(dirname(pubPath), { recursive: true });
  const json = JSON.stringify(out, null, 2);
  writeFileSync(dataPath, json);
  writeFileSync(pubPath, json);

  console.log('stats', out.stats, 'reviews', reviews.length);
  for (const h of highlights.slice(0, 6)) {
    const loc = h.status === 'matched' ? `ch${h.ch}/p${h.para}${h.fuzzy ? '~' : ''}` : '-';
    console.log(
      `  ${h.status.padEnd(10)} ${String(h.totalCount).padStart(6)} ${loc.padEnd(12)} ${h.markText.slice(0, 28).replace(/\n/g, ' ')}`,
    );
  }
  if (highlights.length > 6) console.log(`  … ${highlights.length - 6} more`);
  console.log('wrote', dataPath);
  return out.stats;
}

const args = process.argv.slice(2).filter((a) => a !== '--all');
const finalTargets = process.argv.includes('--all')
  ? Object.keys(BOOKS)
  : (args.length ? args : Object.keys(BOOKS).filter((id) => id !== 'honglou'));

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

for (let i = 0; i < finalTargets.length; i++) {
  const id = finalTargets[i];
  if (!BOOKS[id]) {
    console.error('未知书目', id, '可选:', Object.keys(BOOKS).join(', '));
    process.exit(1);
  }
  let attempt = 0;
  for (;;) {
    try {
      await fetchOne(id);
      break;
    } catch (e) {
      const msg = String(e?.message || e);
      if (!msg.includes('-2014') || attempt >= 4) throw e;
      attempt += 1;
      const wait = 3000 * attempt;
      console.warn(`  rate-limited, retry ${attempt} in ${wait}ms`);
      await sleep(wait);
    }
  }
  if (i < finalTargets.length - 1) await sleep(1500);
}

console.log('\ndone:', finalTargets.join(', '));
