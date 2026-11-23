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
    group: 'Reports and diffs',
    description: 'Status lines with colour-coded markers and non-ASCII glyphs.',
    notes: [
      { term: '\\e[32m', text: 'Green foreground', result: 'class ansi-fg-2' },
      { term: '\\e[0m', text: 'Reset to the default colours', result: 'span closed' },
      { term: '✓ ✗', text: 'Non-ASCII glyphs kept as text', result: 'one column each' },
    ],
  },
  {
    slug: 'unified-diff',
    title: 'Unified diff',
    file: 'diff.ansi',
    tags: ['diff', 'wrap'],
    group: 'Reports and diffs',
    description: 'Bold headers and red/green change lines, as `git diff` prints them.',
    steps: [
      {
        title: 'Capture',
        body: "Write the command's output to a file, escape sequences included.",
        code: 'git diff --color=always > diff.ansi',
      },
      {
        title: 'Render',
        body: 'Pass the stream to the renderer; it returns one HTML fragment.',
        code: 'Renderer::new(opts).render(&ansi)?',
      },
      {
        title: 'Embed',
        body: 'Drop the fragment into your page and ship the stylesheet.',
      },
    ],
  },
  {
    slug: 'progress-frames',
    title: 'Progress frames',
    file: 'progress.ansi',
    tags: ['cursor', 'carriage-return'],
    group: 'Cursor movement',
    description: 'Carriage returns overwrite the line; only the final frame remains.',
  },
];

export const examples: ShowcaseExample[] = examples_.map(({ file, ...meta }) => {
  const source = files[`../../examples/${file}`];
  return {
    ...meta,
    file: `examples/${file}`,
    input: { code: escapeAnsi(source) },
    output: { html: render(source), kind: 'terminal', source: render(source) },
  };
});
