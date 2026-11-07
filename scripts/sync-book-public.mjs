/**
 * 把 apps/<book>/data/book.json 同步为 public/data/book.js（window.__BOOK__=…）
 * 以及精简 toc.json，供检索懒加载 / 阅读目录按需拉取。
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BOOKS = JSON.parse(readFileSync(join(root, 'packages/catalog/books.json'), 'utf8'));
const only = process.argv[2]; // optional book id

for (const book of BOOKS) {
  if (only && book.id !== only) continue;
  const dataPath = join(root, `apps/${book.id}/data/book.json`);
  if (!existsSync(dataPath)) {
    console.warn(`skip ${book.id}: no data/book.json`);
    continue;
  }
  const raw = readFileSync(dataPath, 'utf8');
  const parsed = JSON.parse(raw);
  const outDir = join(root, `apps/${book.id}/public/data`);
  mkdirSync(outDir, { recursive: true });

  writeFileSync(join(outDir, 'book.js'), `window.__BOOK__=${raw}`);
  writeFileSync(join(outDir, 'book.json'), raw);

  const toc = (parsed.chapters || []).map((c) => ({
    n: c.n,
    label: c.label,
    title: c.title || c.t1,
    t1: c.t1,
    t2: c.t2,
  }));
  writeFileSync(join(outDir, 'toc.json'), JSON.stringify(toc));
  console.log(`synced ${book.id}/public/data (book.js + toc.json, ${toc.length} ch)`);
}
