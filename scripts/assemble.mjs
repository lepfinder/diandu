import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const deploy = join(root, 'deploy');
const BOOKS = JSON.parse(readFileSync(join(root, 'packages/catalog/books.json'), 'utf8'));

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
  console.log(`assembled ${book.basePath}/`);
}

writeFileSync(
  join(deploy, '_routes.json'),
  JSON.stringify({ version: 1, include: ['/*'], exclude: [] }, null, 2),
);

console.log(`\nDone → ${deploy}`);
console.log('Cloudflare Pages: 上传 deploy/ 目录即可。');
