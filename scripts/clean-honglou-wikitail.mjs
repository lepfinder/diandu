#!/usr/bin/env node
/**
 * 剃掉红楼各回正文末尾的维基文库尾巴：
 * 「注释」校记、导航、「公有领域」、About this digital edition、贡献者署名等。
 *
 * 用法：node scripts/clean-honglou-wikitail.mjs
 * 可选：--dry 只统计不写回
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BOOK_PATH = join(ROOT, 'apps/honglou/data/book.json');
const dry = process.argv.includes('--dry');

function isHardJunk(s) {
  if (!s) return true;
  if (s === '注释') return true;
  if (s === '* * *' || s === '***') return true;
  if (/公有领域/.test(s)) return true;
  if (/回目录/.test(s) && s.length < 40) return true;
  if (/^上一回/.test(s) && s.length < 40) return true;
  if (s === '下一回') return true;
  if (/^About this digital edition$/i.test(s)) return true;
  if (/^The following users contributed/i.test(s)) return true;
  if (/^This e-book comes from/i.test(s)) return true;
  if (/^We distribute our books/i.test(s)) return true;
  if (/Wikisource is constantly/i.test(s)) return true;
  if (/online library Wikisource/i.test(s)) return true;
  return false;
}

function isVersionNote(s) {
  if (s.length >= 280) return false;
  // 必须是版本校记用语，避免「本府太爷」等正文误伤
  if (/庚辰本|己卯本|戚序本|王府本|列藏本|梦觉本|舒序本|程甲本|程乙本|杨藏本|甲戌本|蒙府本|脂砚|无回目/.test(s)) {
    return true;
  }
  if (/冯其庸|简化字|普通话读|非简化字|辨正/.test(s)) return true;
  return false;
}

function isClearWikiUser(s) {
  if (/zhwikisource|Vanished user|^~\d{4}-/i.test(s)) return true;
  // 拉丁用户名 / Bot
  if (/[A-Za-z]/.test(s) && /^[A-Za-z0-9][A-Za-z0-9._\- ~]*$/.test(s) && s.length <= 40) return true;
  return false;
}

function isSoftChineseUser(s) {
  return (
    s.length > 0
    && s.length <= 8
    && !/[。！？；：，、《》「」]/.test(s)
    && /^[\u4e00-\u9fffΠA-Za-z0-9~._\-]+$/.test(s)
  );
}

/** 从末尾连续剃掉维基尾巴，返回切除起点下标（= 保留长度） */
function findWikiTailStart(paras) {
  let cut = paras.length;
  let stripping = false;
  for (let i = paras.length - 1; i >= 0; i--) {
    const s = String(paras[i] ?? '').trim();
    const hard = isHardJunk(s);
    const user = isClearWikiUser(s);
    const edition = isVersionNote(s);
    const soft = s === '注释' || (stripping && isSoftChineseUser(s));
    // 校记可从末尾直接起剃；署名仅在已进入尾巴后继续剃，避免误伤短句正文
    if (hard || user || edition || soft) {
      stripping = true;
      cut = i;
      continue;
    }
    break;
  }
  return cut;
}

const raw = readFileSync(BOOK_PATH, 'utf8');
const book = JSON.parse(raw);

let touched = 0;
let removedParas = 0;
const report = [];

for (const ch of book.chapters) {
  const before = ch.paras.length;
  const cut = findWikiTailStart(ch.paras);
  if (cut < before) {
    const tail = ch.paras.slice(cut).map((p) => p.trim().slice(0, 48));
    ch.paras = ch.paras.slice(0, cut);
    touched += 1;
    removedParas += before - cut;
    report.push({ n: ch.n, removed: before - cut, lastKeep: ch.paras.at(-1)?.slice(0, 36), tail });
  }
}

console.log(`chapters cleaned: ${touched}/${book.chapters.length}, paras removed: ${removedParas}`);
for (const row of report.slice(0, 6)) {
  console.log(`  ch${row.n}: -${row.removed} | keep「${row.lastKeep || ''}」`);
}
if (report.length > 6) console.log(`  … ${report.length - 6} more`);

if (dry) {
  console.log('[dry] not written');
  process.exit(0);
}

writeFileSync(BOOK_PATH, JSON.stringify(book));
console.log('wrote', BOOK_PATH);

const sync = spawnSync(process.execPath, [join(ROOT, 'scripts/sync-book-public.mjs'), 'honglou'], {
  cwd: ROOT,
  stdio: 'inherit',
});
if (sync.status !== 0) process.exit(sync.status ?? 1);
