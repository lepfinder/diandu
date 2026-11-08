#!/usr/bin/env node
/**
 * 统一各 app 的 next-env.d.ts：
 * - 不写死 .next 或 .next-dev 的 routes 路径（dev/build 会互相改写，弄脏 Git）
 * - 路由类型改由 tsconfig include 同时覆盖两套 distDir
 */
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appsDir = join(root, 'apps');

const STABLE = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// 路由类型见 tsconfig include：.next/types 与 .next-dev/types（dev / build 共用）。
// 勿手写单一 distDir 的 routes 引用；next 可能会改写本文件，请跑 pnpm sync:next-env 还原。
`;

let n = 0;
for (const name of readdirSync(appsDir)) {
  const appRoot = join(appsDir, name);
  if (!existsSync(join(appRoot, 'package.json'))) continue;
  writeFileSync(join(appRoot, 'next-env.d.ts'), STABLE);
  n += 1;
  console.log(`next-env ← ${name}`);
}
console.log(`synced ${n} apps/next-env.d.ts`);
