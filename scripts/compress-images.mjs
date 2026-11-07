#!/usr/bin/env node
/**
 * 批量压缩 apps/<name>/public 图片：
 * 1. 原图备份到 .image-backups/（gitignore，不进 Git / 不进 deploy）
 * 2. jpg/png → webp；过大的 webp 再压
 * 3. 更新源码引用并删除 public 内原 jpg/png
 */
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BACKUP = join(ROOT, '.image-backups');
const MAX_EDGE = 1280;
const WEBP_QUALITY = 78;
const RECOMPRESS_WEBP_IF_GT = 280 * 1024;

const IMAGE_RE = /\.(jpe?g|png|webp)$/i;
const TEXT_EXTS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.css',
  '.html',
  '.md',
  '.txt',
]);

function which(bin) {
  const r = spawnSync('which', [bin], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : '';
}

const MAGICK = which('magick') || which('convert');
if (!MAGICK) {
  console.error('需要 ImageMagick（magick/convert）');
  process.exit(1);
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name === '.next-dev' || name === 'out') {
      continue;
    }
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

function backupOnce(absFile) {
  const rel = relative(ROOT, absFile);
  const dest = join(BACKUP, rel);
  if (!existsSync(dest)) {
    ensureDir(dirname(dest));
    copyFileSync(absFile, dest);
  }
  return dest;
}

function toWebpPath(file) {
  return file.slice(0, -extname(file).length) + '.webp';
}

function publicUrl(absFile) {
  const idx = absFile.lastIndexOf('/public/');
  if (idx === -1) return null;
  return '/' + absFile.slice(idx + '/public/'.length).split('\\').join('/');
}

function compressToWebp(src, dest) {
  const args = [
    src,
    '-auto-orient',
    '-resize',
    `${MAX_EDGE}x${MAX_EDGE}>`,
    '-strip',
    '-quality',
    String(WEBP_QUALITY),
    dest,
  ];
  const r = spawnSync(MAGICK, args, { encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error((r.stderr || r.stdout || `compress failed: ${src}`).trim());
  }
}

const appsRoot = join(ROOT, 'apps');
const publicImages = [];
for (const app of readdirSync(appsRoot)) {
  const pub = join(appsRoot, app, 'public');
  if (!existsSync(pub)) continue;
  for (const f of walk(pub)) {
    if (IMAGE_RE.test(f)) publicImages.push(f);
  }
}

console.log(`found ${publicImages.length} images under apps/*/public`);
ensureDir(BACKUP);

/** @type {Map<string, string>} urlFrom -> urlTo */
const urlRewrites = new Map();
let savedBytes = 0;
let converted = 0;
let recompressed = 0;
let skipped = 0;

for (const src of publicImages) {
  const ext = extname(src).toLowerCase();
  const before = statSync(src).size;
  backupOnce(src);

  if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
    const dest = toWebpPath(src);
    const tmp = `${dest}.tmp.webp`;
    compressToWebp(src, tmp);
    if (existsSync(dest)) {
      const oldSize = statSync(dest).size;
      const neu = statSync(tmp).size;
      if (neu < oldSize) renameSync(tmp, dest);
      else unlinkSync(tmp);
    } else {
      renameSync(tmp, dest);
    }
    const after = statSync(dest).size;
    savedBytes += Math.max(0, before - after);
    const fromUrl = publicUrl(src);
    const toUrl = publicUrl(dest);
    if (fromUrl && toUrl) urlRewrites.set(fromUrl, toUrl);
    unlinkSync(src);
    converted++;
    if (converted % 80 === 0) console.log(`  … converted ${converted}`);
    continue;
  }

  if (before > RECOMPRESS_WEBP_IF_GT) {
    const tmp = `${src}.tmp.webp`;
    compressToWebp(src, tmp);
    const after = statSync(tmp).size;
    if (after < before * 0.95) {
      renameSync(tmp, src);
      savedBytes += before - after;
      recompressed++;
    } else {
      unlinkSync(tmp);
      skipped++;
    }
  } else {
    skipped++;
  }
}

const pairs = [...urlRewrites.entries()].sort((a, b) => b[0].length - a[0].length);

function patchText(text) {
  let next = text;
  for (const [from, to] of pairs) {
    if (next.includes(from)) next = next.split(from).join(to);
  }
  // 常见硬编码：`/portraits/${id}.jpg`
  next = next.replace(/(\/portraits\/\$\{[^}]+\})\.jpg/g, '$1.webp');
  next = next.replace(/(\/characters\/\$\{[^}]+\})\.jpg/g, '$1.webp');
  next = next.replace(/(\/images\/characters\/\$\{[^}]+\})\.jpg/g, '$1.webp');
  return next;
}

let filesUpdated = 0;
for (const app of readdirSync(appsRoot)) {
  const appDir = join(appsRoot, app);
  for (const f of walk(appDir)) {
    if (f.includes('/public/')) continue;
    if (!TEXT_EXTS.has(extname(f).toLowerCase())) continue;
    const before = readFileSync(f, 'utf8');
    const after = patchText(before);
    if (after !== before) {
      writeFileSync(f, after);
      filesUpdated++;
    }
  }
}

console.log('\nDone');
console.log(`  converted jpg/png → webp: ${converted}`);
console.log(`  recompressed webp: ${recompressed}`);
console.log(`  skipped: ${skipped}`);
console.log(`  saved ≈ ${(savedBytes / 1024 / 1024).toFixed(1)} MB`);
console.log(`  text files updated: ${filesUpdated}`);
console.log(`  backups → ${relative(ROOT, BACKUP)}/  (not in git / deploy)`);
