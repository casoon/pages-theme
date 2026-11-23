# Product-site layer for `@casoon/pages-theme` — implementation brief

Status: design agreed on 2026-11-23, nothing implemented yet. This folder is not part of the npm
package (`files` in `package.json` does not list it).

The theme today renders one start page plus docs, showcase and changelog. The goal is a small
product site per project: a start page that presents the project, a use-case page, a docs entry
page and an examples explorer. The look stays the theme's own: tokens, fonts, header pill, buttons.

## Reference material

| File | What it is |
| --- | --- |
| `reference/Main.html`, `UseCases.html`, `Docs.html`, `Examples.html` | Static snapshots of the design at its default state. Inline styles carry the exact values. Open them from this folder: fonts and logo load from the repo. |
| `reference/*-1440.png`, `*-390.png` | Full-page renders, desktop and phone. |
| `reference/Main-1440-tour-2.png`, `-tour-3.png` | The tour's second and third state. |
| `reference/Examples-1440-source.png`, `-howto.png` | The explorer's other two tabs. |
| Canvas | https://claude.ai/artifact/EDzLqzrXEJBqHH4UaB2VsW (interactive: tour and explorer respond to clicks) |

The snapshots use literal hex values. In the theme every one of them maps to an existing token
(`#f4f1eb` = `--bg`, `#e4ded2` = `--bg-deep`, `#dcd7cc` = `--bg-sunken`, `#cac3b4` =
`--border-strong`, `#d7d1c4` = `--border`, `#11100e` = `--heading`/`--ink`, `#44423f` = `--text`,
`#5c5a56` = `--muted`, `#ad3216` = `--accent`, `#d4421d` = `--accent-fill`). Use the tokens, never
the hex values. The design shows the light theme only; the dark theme follows from the tokens and
has to be checked by eye.

The snapshots do not draw the theme toggle in the header. It stays.

## Decide before coding

1. **Search.** The header and the docs entry page show a search field. Search needs a script,
   and the theme allows two inline scripts (`ALLOWED_SCRIPTS` in `scripts/check-site.cjs`).
   Either add search as a third, opt-in script with its own rule in `check-site.cjs`, or drop
   both fields. Until this is decided, build the header and docs page without search.
2. **Label "Examples".** The design calls the showcase "Examples" in the navigation. Suggested:
   change the `showcase` string in `lib/i18n.ts` and keep the route `/showcase/`.
3. **Explorer vs. list.** The explorer suits a handful of examples. Suggested: a
   `showcaseLayout: 'explorer' | 'list'` option, default `'list'`, so no existing site changes
   without opting in.

## Constraints that hold throughout

- No new scripts. Tour and explorer are CSS-only, built like `Tabs` and `Install` (radio inputs,
  `:has()`, first panel as the fallback).
- No external requests, both themes, text contrast 4.5:1, touch targets 44 px.
- Every new UI string goes into `lib/i18n.ts` for `en` and `de`.
- `pnpm check`, `pnpm type-check`, `pnpm build` and `scripts/check-site.cjs` on the starter build
  pass after every package below.
- Existing sites must render as before unless they use a new component or option. The exceptions
  are the footer and the header, which change for every site: call that out in the changelog.

## Work packages

Each one is shippable on its own. Suggested order as listed.

### 1. Footer: compact and light

Replace the black three-column footer in `components/Footer.astro`. About 210 px high at 1440 px
instead of about 460 px.

- Ground `--bg-deep`, text `--text`, in both themes (drop the footer's own colour overrides).
- Container `--max-wide`, padding `36px var(--gutter) 24px`.
- Row 1, space between, wraps: the project name as a wordmark (30 px, weight 600,
  letter-spacing -0.03em, followed by a `.` in `--accent-fill`) with the description beside it
  (15.5 px, max 64ch). On the right the package links as outlined pills (44 px high, 1 px
  `--border-strong`, radius 999 px, the existing external-arrow mask): GitHub first, then
  `config.packages`.
- Row 2 above a hairline (`--border-strong`), 13.5 px, `--muted`: the CASOON logo (104 px wide,
  links to casoon.de) with "A CASOON project · Jörn Seidel"; on the right licence and year,
  "All projects" (catalog), imprint, privacy policy.
- Logo: `assets/casoon-logo.svg` on the light ground, `assets/casoon-logo-dark.svg` in the dark
  theme. The turquoise on near-black was the reason for the change.
- Removed: the "Project" column (it repeated the header), the casoon.de text link and the
  catalog-entry link. `config.website` and `config.demo` are reachable from the header.

### 2. Header: navigation and narrow widths

- Order of entries: Use cases (new, when the site has them), Docs, demo, Examples, Changelog.
- From 960 px: one row, as today.
- Below 960 px: two rows. Row 1 holds name and version, on the right the tools (search icon if
  search exists, theme toggle, GitHub button). Row 2, above a hairline, holds the links.
  Radius 24 px, as the wrapped header already uses.
- Below 480 px: outer padding 10 px 12 px, the GitHub button loses its arrow circle, links at
  13.5 px with 9 px padding; the link row scrolls sideways rather than wrapping.
- Below 350 px: the version badge is hidden.
- The current rules live at the 640, 480 and 860 px queries in `Header.astro`; replace them
  rather than adding a fourth set. `data-wide` / `data-compact` need a second look.

### 3. Hero (`layout="split"`)

- Columns side by side down to about 760 px (today 900 px).
- Text column narrower, output wider: about 38 % to 62 %
  (`flex: 0.8 1 280px` and `flex: 1.6 1 360px` in the snapshot).
- Terminal in the `output` slot: padding `clamp(14px, 2.2vw, 30px)`, font size
  `clamp(12px, 1.05vw, 14.5px)`, so a 37-column line fits at 390 px without scrolling.

### 4. StatBand

Four items never break 3 + 1. Fixed columns: four from 720 px, two by two below, one column
below 330 px, with the hairlines following the grid. Other counts keep today's `auto-fit`.

### 5. New component `Tour`

The presentation on the start page: three to five steps on the left, one stage on the right
showing what the selected step produces.

- Props: `eyebrow?`, `title`, `lead?`, `steps: { title, body }[]`, `link?`. One named slot per
  step (`step-1` …) for the stage content: `Terminal`, `CodeBlock`, `Figure`.
- Step: index in mono `--accent`, title 20 px / 600, body 15 px. Selected: `--surface`,
  1 px `--border-strong`, `--shadow`, radius `--r-card`. Unselected: transparent.
- The stage has no frame of its own; the medium stands on the page ground, top-aligned with the
  first step.
- Columns `flex: 1 1 300px` and `flex: 1.5 1 400px`; stacked, the steps come first.
- CSS-only: one radio group, the steps are its labels.

### 6. Use cases: component and page

- `UseCases` for the start page: rows between hairlines. Per row the title (24 px / 600), one
  sentence, tags (`Badge`), and an arrow in a 44 px circle on the right that stays vertically
  centred. Below about 640 px sentence and tags move under the title, the arrow stays right.
  Props: `title`, `link?`, `items: { title, body, tags?, href }[]`.
- Page `/use-cases/`, injected when the site supplies a module, by analogy with the showcase:
  option `useCases` (default `./src/use-cases.ts`, exporting `useCases`), virtual module
  `virtual:casoon-pages/use-cases`, header entry and sitemap follow.
- Page layout (`reference/UseCases.html`): page head with breadcrumb, large title and lead;
  the first use case as a panel on `--bg-deep` with numbered steps beside a code block
  (`Split numbered` with `CodeBlock marks` already does this); the others as open rows with a
  three-line spec list on the right; an optional closing `Tradeoffs`.
- The filter chips in the snapshot are decoration. Leave them out unless tags get real filtering
  without a script (anchor links to groups would do).

### 7. Docs entry page

The design turns `/docs/` from a plain article into an entry page. It stays an MDX page; the
theme adds two components available in MDX:

- `StepPath`: three linked steps in one band on `--bg-deep`, numbered, hairlines between them.
- `LinkList`: rows of title, one sentence and arrow, between hairlines. Used per sidebar group
  and for "By task" (links to the use cases).

Layout changes in `layouts/Docs.astro`: the table of contents is hidden below 1180 px (today
1100 px); below 860 px the content comes first and the sidebar follows under a hairline.
Update the starter's `docs/index.md` accordingly.

### 8. Showcase explorer

- `ShowcaseExample` gains two optional fields: `notes?: { term: string; text: string; result?: string }[]`
  ("what the renderer did") and `steps?: { title: string; body: string; code?: string }[]`
  ("how to get there"). A second, optional output source `output.source?: string` holds the
  produced markup as text for the Source tab.
- Overview in explorer layout (`reference/Examples.html`): a rail on the left with the examples
  under their `group` headings; on the right title, description, tags and file, then three
  tabs. Output shows the rendered result beside the notes. Source shows input beside the
  produced markup. How to shows the steps side by side.
- A tab without data is not rendered (no `steps`: no "How to" tab).
- Below 860 px the rail becomes a row of chips and group headings are hidden; panels stack.
- CSS-only: an outer radio group selects the example, each example carries its own tab group.
- Detail pages `/showcase/<slug>/` stay as they are and stay linked.

### 9. Starter, docs, release

- `starter/site/src/pages/index.astro`: rebuild after `reference/Main.html` (Hero, StatBand,
  Tour, UseCases, Showcase panel with three tiles, docs teaser, ReleaseHighlights, CallToAction).
  The page drops most of the component catalogue it carries today; move that to a separate
  starter page so every component still has a living example.
- Add `starter/site/src/use-cases.ts`, extend `showcase.ts` with `notes` and `steps`.
- README: options table, component table, the new sections. CHANGELOG: one entry, minor version.
- Rollout check on two real sites (opengrid, auditmysite) before tagging.

## Content caveats

The copy is the starter's sample content for the fictional `runemark`. Three things in the
snapshots were written for the design and are not facts about any project: the workflow snippet
on the use-case page (it contains the placeholder `[YOUR COMMAND]`), the spec lists of use cases
02 to 04, and the notes in the explorer. The class names in the explorer's Source tab
(`ansi-fg-2`, `ansi-bold`) are what `lib/ansi.ts` emits.

## Verified so far

The design was rendered at 320, 390, 768, 1024 and 1440 px with no horizontal overflow on any
of the four pages. That was done with a stand-in for the canvas runtime, in the light theme
only. Not checked: the dark theme, keyboard operation of tour and explorer, and anything in
Astro.

## Starting this in Claude Code

> Read `design/product-site/BRIEF.md` and the files in `design/product-site/reference/`.
> Ask me the three questions under "Decide before coding", then implement work package 1
> (footer) on a new branch, including the starter, README and CHANGELOG. Run `pnpm check`,
> `pnpm type-check` and `pnpm build`, show me the footer in both themes, and stop before the
> next package.
