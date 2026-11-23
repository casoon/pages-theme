import { url } from '@casoon/pages-theme/url';
import type { UseCase } from '@casoon/pages-theme/use-cases';

// Sample content for the fictional runemark: replace with the project's own jobs.
export const lead =
  'Four jobs runemark gets hired for. Each one names what you need and where to start.';

export const useCases: UseCase[] = [
  {
    slug: 'ci-logs',
    eyebrow: 'CI · GitHub Actions',
    title: 'Publish a CI log as a readable page',
    body: 'The coloured log of a job is gone once the run page is closed. Rendered, it is a static page anyone can open, search and link to.',
    tags: ['CI', 'GitHub Actions'],
    steps: [
      "Write the job's output to a file, colours included.",
      'Render it; a colour pair below 4.5:1 fails the step.',
      'Upload the page with the rest of your site.',
    ],
    code: {
      title: '.github/workflows/report.yml',
      label: 'YAML',
      lang: 'yaml',
      code: `- name: Run the checks
  run: [YOUR COMMAND] > report.ansi

- name: Render the log
  run: >
    runemark render
    --strict-contrast

- name: Publish
  uses: actions/upload-pages-artifact`,
      marks: [
        { line: 1, n: 1 },
        { line: 4, n: 2 },
        { line: 9, n: 3 },
      ],
    },
    links: [
      { label: 'Quickstart', href: url('docs/getting-started/quickstart/') },
      { label: 'Example: test report', href: url('showcase/test-report/') },
    ],
  },
  {
    slug: 'docs-output',
    eyebrow: 'Docs · Build time',
    title: 'Show real command output in your docs',
    body: 'Capture the command once, commit the file, render it in the build. The page shows what the tool printed, not a screenshot of it.',
    tags: ['Docs', 'Build time'],
    specs: [
      { term: 'Input', value: 'ANSI text from a file, a pipe or a string' },
      { term: 'Runs', value: 'Once, in your build' },
      { term: 'Ships', value: 'Static HTML, one stylesheet, 0 scripts' },
    ],
    links: [{ label: 'Quickstart', href: url('docs/getting-started/quickstart/') }],
  },
  {
    slug: 'regressions',
    eyebrow: 'Testing · CI',
    title: 'Catch rendering regressions',
    body: 'Identical input produces identical bytes. Commit the rendered fixtures and let CI diff them on every build.',
    tags: ['Testing', 'CI'],
    specs: [
      { term: 'Fixtures', value: 'Shared with the test suite' },
      { term: 'Compared', value: 'Byte for byte' },
      { term: 'Bindings', value: 'Rust and Node run the same set' },
    ],
    links: [{ label: 'The fixtures as examples', href: url('showcase/') }],
  },
  {
    slug: 'screen-readers',
    eyebrow: 'Accessibility',
    title: 'Reports a screen reader can read',
    body: 'Terminal output is read as plain text. A report with columns is a table, not aligned spaces.',
    tags: ['Accessibility'],
    specs: [
      { term: 'Markup', value: '`<pre>`, `<table>`' },
      { term: 'Contrast', value: 'Every colour pair checked against 4.5:1' },
      { term: 'Flag', value: '`--strict-contrast`' },
    ],
    links: [{ label: 'Contrast rules', href: url('docs/') }],
  },
];

export const tradeoffs = {
  eyebrow: 'The price',
  title: 'What it is not for',
  lead: 'This design has a price, and it is better read here than found later.',
  items: [
    'It is not a terminal: no alternate screen, no mouse reporting.',
    'The page shows a frame, not a live session.',
    'Wide glyphs are measured by a table that is updated with Unicode.',
  ],
};
