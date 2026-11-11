#!/usr/bin/env node
// Builds the starter site with the `accent` option and checks the colour the page computes for
// --accent: light by default, dark under prefers-color-scheme: dark, and the toggle
// (data-theme) winning over the system setting either way.
//   node scripts/test-accent.mjs
// Needs Chromium for Playwright once per machine: pnpm exec playwright install chromium
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ACCENT = { light: '#123456', dark: '#abcdef' };
const site = fileURLToPath(new URL('../starter/site/', import.meta.url));
const config = join(site, 'astro.accent-test.config.mjs');
const dist = mkdtempSync(join(tmpdir(), 'pages-theme-accent-'));

// The starter site with a minimal theme configuration that sets `accent`.
writeFileSync(
  config,
  `import casoonPages from '@casoon/pages-theme';
export default {
  site: 'https://casoon.github.io/runemark',
  base: '/runemark/',
  integrations: [
    casoonPages({
      name: 'runemark',
      description: 'Accent test',
      repo: 'casoon/runemark',
      version: false,
      accent: ${JSON.stringify(ACCENT)},
    }),
  ],
};
`
);

const cases = [
  { scheme: 'light', theme: null, expected: ACCENT.light },
  { scheme: 'dark', theme: null, expected: ACCENT.dark },
  { scheme: 'light', theme: 'dark', expected: ACCENT.dark },
  { scheme: 'dark', theme: 'light', expected: ACCENT.light },
];

let failed = 0;
try {
  execFileSync(
    'pnpm',
    ['exec', 'astro', 'build', '--config', 'astro.accent-test.config.mjs', '--outDir', dist],
    {
      cwd: site,
      stdio: ['ignore', 'ignore', 'inherit'],
    }
  );
  const base = new URL(
    readFileSync(join(dist, 'index.html'), 'utf8').match(/<link rel="canonical" href="([^"]+)"/)[1]
  ).pathname;

  const browser = await chromium.launch();
  for (const { scheme, theme, expected } of cases) {
    const page = await browser.newPage({ colorScheme: scheme });
    // Serve the build under its base path straight from disk.
    await page.route('http://site.test/**', (route) => {
      let file = join(dist, new URL(route.request().url()).pathname.slice(base.length));
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
      if (!existsSync(file)) return route.fulfill({ status: 404 });
      const type = { '.css': 'text/css', '.js': 'text/javascript' }[extname(file)] ?? 'text/html';
      return route.fulfill({ status: 200, contentType: type, body: readFileSync(file) });
    });
    await page.goto(`http://site.test${base}`);
    const actual = await page.evaluate((theme) => {
      if (theme) document.documentElement.dataset.theme = theme;
      else delete document.documentElement.dataset.theme;
      return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    }, theme);
    const ok = actual.toLowerCase() === expected;
    if (!ok) failed++;
    console.log(
      `${ok ? 'OK  ' : 'FAIL'} scheme ${scheme}, data-theme ${theme ?? '(none)'}: --accent ${actual}, expected ${expected}`
    );
    await page.close();
  }
  await browser.close();
} finally {
  rmSync(config, { force: true });
  rmSync(dist, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
