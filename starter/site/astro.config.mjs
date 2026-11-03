// @ts-check
import casoonPages from '@casoon/pages-theme';
import { defineConfig } from 'astro/config';

// Project page: https://casoon.github.io/<repo>/ — `base` is the GitHub Pages path.
export default defineConfig({
  site: 'https://casoon.github.io/runemark',
  base: '/runemark/',
  integrations: [
    casoonPages({
      name: 'runemark',
      description: 'Renders ANSI terminal output as accessible, script-free HTML. Rust and Node.',
      tagline: 'ANSI output as accessible HTML',
      // website: 'https://runemark.casoon.de', // the project's landing page, if it has one
      repo: 'casoon/runemark',
      version: '0.4.2',
      license: 'MIT',
      packages: [
        { label: 'crates.io', href: 'https://crates.io/crates/runemark' },
        { label: 'npm', href: 'https://www.npmjs.com/package/@casoon/runemark' },
        { label: 'docs.rs', href: 'https://docs.rs/runemark' },
      ],
      docsGroups: {
        'getting-started': 'Getting started',
        reference: 'Reference',
      },
    }),
  ],
});
