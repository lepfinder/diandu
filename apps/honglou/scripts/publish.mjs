import { cpSync, existsSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const root = process.cwd();
const out = join(root, 'out');

if (!existsSync(out)) {
  console.error('out/ not found — run next build first');
  process.exit(1);
}

// Do not clobber Next.js source trees
const skip = new Set([
  'app',
  'components',
  'lib',
  'data',
  'public',
  'scripts',
  'node_modules',
  'out',
  '.next',
  '.git',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'next.config.mjs',
  'next-env.d.ts',
  'README.md',
]);

for (const name of readdirSync(out)) {
  if (skip.has(name)) continue;
  const src = join(out, name);
  const dest = join(root, name);
  if (statSync(src).isDirectory()) {
    rmSync(dest, { recursive: true, force: true });
  } else if (existsSync(dest) && skip.has(basename(dest))) {
    continue;
  }
  cpSync(src, dest, { recursive: true });
  console.log('published', name);
}

console.log('done: open index.html');

// merge runtime data (book.js/json) into source data/ without wiping originals
const outData = join(out, 'data');
if (existsSync(outData)) {
  const rootData = join(root, 'data');
  cpSync(outData, rootData, { recursive: true });
  console.log('merged data/ from export');
}
