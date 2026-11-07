/**
 * Rewrite Next.js static export for file:// and Desktop preview:
 * - inline CSS into each HTML (styles never depend on _next)
 * - also keep css/app.css as a normal stylesheet
 * - relative asset/route links + <base>
 * - fix webpack publicPath via document.baseURI
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';

const root = process.cwd();
const out = join(root, 'out');

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

function depthFromFile(file) {
  const rel = relative(out, file);
  const dir = dirname(rel);
  if (dir === '.' || dir === '') return 0;
  return dir.split(sep).filter(Boolean).length;
}

function prefixFor(depth) {
  return depth === 0 ? './' : '../'.repeat(depth);
}

function toRouteHref(url) {
  if (!url.startsWith('/')) return null;
  const qIndex = url.indexOf('?');
  const path = qIndex < 0 ? url : url.slice(0, qIndex);
  const query = qIndex < 0 ? '' : url.slice(qIndex);
  let p = path.replace(/^\//, '');
  if (p === '' || p === 'index.html') p = 'index.html';
  else if (p.endsWith('/')) p = p + 'index.html';
  else if (!/\.[a-z0-9]+$/i.test(p)) p = p + '/index.html';
  return p + query;
}

// Collect and merge CSS from Next export
const cssDir = join(out, '_next', 'static', 'css');
let cssBundle = '';
if (existsSync(cssDir)) {
  for (const name of readdirSync(cssDir)) {
    if (!name.endsWith('.css')) continue;
    cssBundle += readFileSync(join(cssDir, name), 'utf-8') + '\n';
  }
}
mkdirSync(join(root, 'css'), { recursive: true });
mkdirSync(join(out, 'css'), { recursive: true });
writeFileSync(join(root, 'css', 'app.css'), cssBundle);
writeFileSync(join(out, 'css', 'app.css'), cssBundle);
console.log('css/app.css bytes', cssBundle.length);

const htmlFiles = walk(out).filter((f) => f.endsWith('.html'));
console.log('html files', htmlFiles.length);

for (const file of htmlFiles) {
  const depth = depthFromFile(file);
  const prefix = prefixFor(depth);
  let html = readFileSync(file, 'utf-8');

  // base tag
  if (!html.includes('<base ')) {
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${prefix}">`);
  } else {
    html = html.replace(/<base href="[^"]*">/, `<base href="${prefix}">`);
  }

  // absolute asset / route refs
  html = html.replace(/(href|src|content)="\/(?!\/)([^"]*)"/g, (m, attr, rest) => {
    const url = '/' + rest;
    if (
      rest.startsWith('_next/') ||
      rest.startsWith('images/') ||
      rest.startsWith('data/') ||
      rest.startsWith('css/') ||
      rest.startsWith('js/') ||
      rest.startsWith('favicon') ||
      rest.startsWith('404')
    ) {
      return `${attr}="${rest}"`;
    }
    const routed = toRouteHref(url);
    if (routed) return `${attr}="${routed}"`;
    return `${attr}="${rest}"`;
  });

  // ./_next/... -> css/app.css for stylesheets; keep scripts
  html = html.replace(
    /<link rel="stylesheet" href="(?:\.\/)?_next\/static\/css\/[^"]+"[^>]*\/?>/,
    '<link rel="stylesheet" href="css/app.css"/>'
  );

  // srcset
  html = html.replace(/srcset="([^"]*)"/g, (m, val) => {
    const parts = val.split(',').map((s) => {
      const seg = s.trim();
      if (!seg) return seg;
      const sp = seg.split(/\s+/);
      if (sp[0].startsWith('/')) sp[0] = sp[0].slice(1);
      return sp.join(' ');
    });
    return `srcset="${parts.join(', ')}"`;
  });

  html = html.replace(/href="(?:\.\/)?_next\//g, 'href="_next/');
  html = html.replace(/src="(?:\.\/)?_next\//g, 'src="_next/');

  // Inline CSS so Desktop preview / file:// always has styles
  if (cssBundle && !html.includes('/*__APP_CSS__*/')) {
    html = html.replace(
      /<link rel="stylesheet" href="css\/app.css"\/>/,
      `<link rel="stylesheet" href="css/app.css"/><style>/*__APP_CSS__*/${cssBundle}</style>`
    );
  }

  // In static export, rewrite app-generated route links already handled.
  // Also convert any leftover absolute route hrefs in RSC-inlined HTML if present.

  // Ensure search script uses relative path for file://
  html = html.replace(/src="\/data\/book\.js"/g, 'src="data/book.js"');
  html = html.replace(/src="data\/book\.js"/g, 'src="data/book.js"');

  writeFileSync(file, html);
}

// webpack publicPath
const chunkDir = join(out, '_next', 'static', 'chunks');
if (existsSync(chunkDir)) {
  for (const name of readdirSync(chunkDir)) {
    if (!name.startsWith('webpack-') || !name.endsWith('.js')) continue;
    const p = join(chunkDir, name);
    let js = readFileSync(p, 'utf-8');
    const patched = js
      .replace(/"\/_next\/"/g, '(new URL("_next/", document.baseURI).href)')
      .replace(/'\/_next\/'/g, '(new URL("_next/", document.baseURI).href)')
      .replace(/"\.\/_next\/"/g, '(new URL("_next/", document.baseURI).href)');
    if (patched !== js) {
      writeFileSync(p, patched);
      console.log('patched webpack publicPath', name);
    }
  }
}

console.log('file:// / preview rewrite done');
