import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const deploy = join(root, 'deploy');
const BOOKS = JSON.parse(readFileSync(join(root, 'packages/catalog/books.json'), 'utf8'));
const TEXT_EXT = new Set(['.html', '.js', '.css', '.json', '.txt', '.svg', '.xml', '.webmanifest']);
const ASSET_EXT = /\.(webp|png|jpe?g|gif|svg|avif|ico|mp3|mp4|woff2?|js|json)$/i;

rmSync(deploy, { recursive: true, force: true });
mkdirSync(deploy, { recursive: true });

const portalOut = join(root, 'apps/portal/out');
if (!existsSync(portalOut)) {
  console.error('缺少 apps/portal/out，请先执行各 app 的 build:cf');
  process.exit(1);
}

cpSync(portalOut, deploy, { recursive: true });

for (const book of BOOKS) {
  const outDir = join(root, `apps/${book.id}/out`);
  if (!existsSync(outDir)) {
    console.error(`缺少 ${outDir}，请先 build:cf`);
    process.exit(1);
  }
  const target = join(deploy, book.id);
  mkdirSync(target, { recursive: true });
  cpSync(outDir, target, { recursive: true });
  const rewritten = rewriteBookAssetPaths(target, book.id);
  console.log(`assembled ${book.basePath}/ (rewrote ${rewritten} asset refs)`);
}

writeFileSync(
  join(deploy, '_headers'),
  `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
`,
);

console.log(`\nDone → ${deploy}`);
console.log('Cloudflare Pages: 上传 deploy/ 目录即可。');

/** next/image unoptimized 不会带 basePath；组装时把绝对静态资源路径改成 /{book}/... */
function rewriteBookAssetPaths(bookDir, bookId) {
  const urls = collectAssetUrls(bookDir);
  if (urls.length === 0) return 0;

  let filesTouched = 0;
  walk(bookDir, (file) => {
    const ext = extname(file);
    if (!TEXT_EXT.has(ext)) return;
    if (file.includes(`${sep}_next${sep}`) && ext === '.js') {
      // JS chunk 也要改，客户端 hydration 会带着裸路径
    } else if (file.includes(`${sep}_next${sep}`) && ext !== '.js' && ext !== '.css') {
      return;
    }

    const original = readFileSync(file, 'utf8');
    let next = original;
    for (const url of urls) {
      const prefixed = `/${bookId}${url}`;
      if (!next.includes(url)) continue;
      next = next.split(prefixed).join('\0@\0');
      next = next.split(url).join(prefixed);
      next = next.split('\0@\0').join(prefixed);
    }
    if (next !== original) {
      writeFileSync(file, next);
      filesTouched += 1;
    }
  });
  return filesTouched;
}

function collectAssetUrls(bookDir) {
  const urls = [];
  walk(bookDir, (file) => {
    if (file.includes(`${sep}_next${sep}`)) return;
    if (!ASSET_EXT.test(file)) return;
    const rel = relative(bookDir, file).split(sep).join('/');
    urls.push(`/${rel}`);
  });
  urls.sort((a, b) => b.length - a.length);
  return urls;
}

function walk(dir, onFile) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, onFile);
    else onFile(full);
  }
}

function extname(file) {
  const i = file.lastIndexOf('.');
  return i >= 0 ? file.slice(i).toLowerCase() : '';
}
