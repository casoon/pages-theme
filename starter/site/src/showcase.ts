import { ansiToHtml, escapeAnsi } from '@casoon/pages-theme/ansi';
import type { ShowcaseExample } from '@casoon/pages-theme/showcase';

// Same fixtures the test suite uses. Rendered here at build time.
const files = import.meta.glob<string>('../../examples/*.ansi', {
  query: '?raw',
  import: 'default',
  eager: true,
});

// Replace ansiToHtml with the project's own renderer (dogfooding),
// e.g. `import { render } from '@casoon/runemark'`.
const render = ansiToHtml;

const examples_ = [
  {
    slug: 'test-report',
    title: 'Test report',
    file: 'report.ansi',
    tags: ['sgr', 'unicode', 'colour'],
    description: 'Status lines with colour-coded markers and non-ASCII glyphs.',
  },
  {
    slug: 'unified-diff',
    title: 'Unified diff',
    file: 'diff.ansi',
    tags: ['diff', 'wrap'],
    description: 'Bold headers and red/green change lines, as `git diff` prints them.',
  },
  {
    slug: 'progress-frames',
    title: 'Progress frames',
    file: 'progress.ansi',
    tags: ['cursor', 'carriage-return'],
    description: 'Carriage returns overwrite the line; only the final frame remains.',
  },
];

export const examples: ShowcaseExample[] = examples_.map(({ file, ...meta }) => {
  const source = files[`../../examples/${file}`];
  return {
    ...meta,
    file: `examples/${file}`,
    input: { code: escapeAnsi(source) },
    output: { html: render(source), kind: 'terminal' },
  };
});
