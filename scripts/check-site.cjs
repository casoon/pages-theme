#!/usr/bin/env node
/**
 * Checks a built CASOON Pages site served locally (e.g. `pnpm preview` in site/):
 * crawls every internal page under the base path and reports, in light and dark theme,
 * axe violations (WCAG 2.2 AA), broken or out-of-base internal links, requests to other
 * origins, and scripts beyond the theme's two inline scripts. Non-HTML targets (PDF, images)
 * are only checked for status 200, not crawled.
 *
 * A `[data-demo]` stage (theme component `Demo`) is the one exception: it is excluded from
 * axe and may carry the demo's own scripts, because a live demo may deliberately exhibit
 * what the project reports on. The page around it is measured as usual.
 *
 * `--allow-script <path>` (repeatable, relative to the base path, e.g. `interactive/`) allows
 * one own script on that page: for a page that demonstrates a browser module of the project on
 * its regular content, which a `Demo` stage would withdraw from axe. Other origins stay forbidden.
 * A site lists such pages once in site/package.json: `"casoonPagesCheck": { "allowScript": [...] }`.
 *
 *   node scripts/check-site.cjs <project-repo>/site/dist        serves the build itself
 *   node scripts/check-site.cjs http://localhost:4321/<repo>/   a running preview
 *   [--allow-script <path>]...
 *
 * Uses @playwright/test and @axe-core/playwright from this repository (pnpm install; once:
 * pnpm exec playwright install chromium).
 */
const { readFileSync, existsSync, statSync } = require('node:fs');
const { createServer } = require('node:http');
const { join, dirname, extname, resolve } = require('node:path');

const { chromium } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const args = process.argv.slice(2);
const scriptPages = [];
for (let i = args.indexOf('--allow-script'); i !== -1; i = args.indexOf('--allow-script')) {
  scriptPages.push(args[i + 1]);
  args.splice(i, 2);
}
const target = args[0] ?? 'http://localhost:4321/';
const ALLOWED_SCRIPTS = 2; // theme init + toggle/copy; JSON-LD is not counted
let start;
let basePath;
let scriptPaths;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

/** Serves a build directory under the base path its canonical URL names, like GitHub Pages. */
function serve(dist) {
  const canonical = readFileSync(join(dist, 'index.html'), 'utf8').match(
    /<link rel="canonical" href="([^"]+)"/
  );
  const base = canonical ? new URL(canonical[1]).pathname : '/';
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.startsWith(base) ? join(dist, path.slice(base.length)) : null;
    if (file && existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!file || !existsSync(file)) {
      res.writeHead(404, { 'content-type': TYPES['.html'] });
      res.end(existsSync(join(dist, '404.html')) ? readFileSync(join(dist, '404.html')) : '');
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise((done) =>
    server.listen(0, '127.0.0.1', () =>
      done({ server, url: `http://127.0.0.1:${server.address().port}${base}` })
    )
  );
}

const normalize = (href) => {
  const u = new URL(href);
  return u.origin + u.pathname;
};

async function checkPage(page, pageUrl, externals) {
  externals.length = 0;
  const response = await page.goto(pageUrl);
  const findings = [];
  if (!response || response.status() !== 200) findings.push(`status ${response?.status()}`);

  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .exclude('[data-demo]')
    .analyze();
  for (const v of violations) {
    const targets = v.nodes.slice(0, 3).map((n) => n.target.join(' '));
    findings.push(`axe ${v.id}: ${v.help} → ${targets.join(', ')}`);
  }

  // Scripts inside a demo stage belong to the demo; everywhere else the theme's two are the limit.
  const scripts = await page
    .locator('script:not([type="application/ld+json"])')
    .evaluateAll((els) => els.filter((el) => !el.closest('[data-demo]')).length);
  const allowed = ALLOWED_SCRIPTS + (scriptPaths.has(new URL(pageUrl).pathname) ? 1 : 0);
  if (scripts !== allowed)
    findings.push(`${scripts} scripts outside demo stages (expected ${allowed})`);
  if (externals.length) findings.push(`external requests: ${[...new Set(externals)].join(', ')}`);

  const links = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.href));
  const internal = links.filter((href) => new URL(href).origin === start.origin);
  for (const href of internal) {
    if (!new URL(href).pathname.startsWith(basePath)) findings.push(`link outside base: ${href}`);
  }
  return { findings, internal: internal.map(normalize) };
}

(async () => {
  let server;
  if (/^https?:\/\//.test(target)) {
    start = new URL(target);
  } else {
    const dist = resolve(target);
    const pkg = join(dirname(dist), 'package.json');
    if (existsSync(pkg)) {
      scriptPages.push(...(JSON.parse(readFileSync(pkg, 'utf8')).casoonPagesCheck?.allowScript ?? []));
    }
    let url;
    ({ server, url } = await serve(dist));
    start = new URL(url);
  }
  basePath = start.pathname.endsWith('/') ? start.pathname : `${start.pathname}/`;
  scriptPaths = new Set(scriptPages.map((path) => `${basePath}${path.replace(/^\//, '')}`));

  const browser = await chromium.launch();
  const pages = new Set([normalize(start.href), `${start.origin}${basePath}404.html`]);
  const broken = new Set();
  const files = new Set(); // non-HTML targets (PDF, PNG): status checked, not crawled
  let failures = 0;

  for (const scheme of ['light', 'dark']) {
    const context = await browser.newContext({ colorScheme: scheme });
    const page = await context.newPage();
    const externals = [];
    page.on('request', (r) => {
      const origin = new URL(r.url()).origin;
      if (origin !== start.origin && !r.url().startsWith('data:')) externals.push(origin);
    });

    const queue = [...pages];
    const done = new Set();
    while (queue.length) {
      const pageUrl = queue.shift();
      if (done.has(pageUrl)) continue;
      done.add(pageUrl);
      const { findings, internal } = await checkPage(page, pageUrl, externals);
      for (const href of internal) {
        if (!new URL(href).pathname.startsWith(basePath) || pages.has(href) || files.has(href)) continue;
        const res = await page.request.get(href);
        const status = res.status();
        if (status !== 200) {
          broken.add(`${href} (${status}, linked from ${pageUrl})`);
          continue;
        }
        if (!(res.headers()['content-type'] ?? '').includes('text/html')) {
          files.add(href);
          continue;
        }
        pages.add(href);
        queue.push(href);
      }
      if (findings.length) failures++;
      console.log(`${findings.length ? 'FAIL' : 'OK  '} [${scheme}] ${pageUrl}`);
      for (const f of findings) console.log(`     ${f}`);
    }
    await context.close();
  }
  await browser.close();
  server?.close();

  for (const b of broken) console.log(`BROKEN ${b}`);
  const total = failures + broken.size;
  console.log(total ? `${total} finding(s) on ${pages.size} pages` : `all clean (${pages.size} pages, ${files.size} non-HTML files with status 200)`);
  process.exit(total ? 1 : 0);
})();
