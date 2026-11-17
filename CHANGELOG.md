# Changelog

All notable changes to `@casoon/pages-theme` are listed here. The theme follows
[Semantic Versioning](https://semver.org/): while it is 0.x, a minor version may change what a
site renders.

## [Unreleased]

## [0.14.0] - 2026-11-17

### Added

- **Components:** `Section` (neutral section frame: heading, lead, slot, `width` of `narrow`, `default` or `wide`), `Figure` (image in a frame with a caption) and `SpecList` (term/value rows over the full width), to replace what project sites rebuilt locally.
- **Layouts:** `layouts/Page.astro`, a plain content page with breadcrumb (`crumbs`), title, lead (`description`) and `width`; the body is set like the docs (`.cp-prose`: headings, lists, tables, code).
- **Badge:** The tones `solid` and `soft` next to `muted`, for result classes such as Automatic / Hint only / Manual; the three differ in weight, not only in colour.
- **CodeBlock:** The `wrap` prop wraps long lines instead of scrolling sideways.
- **Headings:** Every component with a section heading takes `size="section"` (default) or `size="sub"`: `Features`, `BuildOutput`, `ReleaseHighlights`, `Keymap`, `Faq`, `Quickstart`, `Flow`, `Compare`, `AudienceList`, `SectionIntro`, `Spotlight` and `Section`.

### Changed

- **Defaults:** `ReleaseHighlights` shows 3 entries instead of 6 (`max`), and an entry is cut after three lines; the changelog link beside the heading has the rest.
- **Defaults:** Section headings share two sizes, `--h-section` (34–50 px) and `--h-sub` (28–40 px). `Quickstart` was 30 px and `Flow` and `Spotlight` started at 32 px; they now use the section size like the others (`size="sub"` for the smaller one). `Split`, `Showcase` and `Tradeoffs` use `--h-sub`.
- **Defaults:** The space below a section is one token, `--section-y` (64–112 px), instead of 0 to 128 px of padding per component; sections no longer carry top padding. Page rhythm changes on every site, and a site's own block between theme sections needs no extra margin.
- **Features:** The column count follows the item count (4 as 2 + 2, 5 as 3 + 2, 6 as 3 + 3) instead of `auto-fit`; long words and paths wrap inside the card. `body` is inline Markdown now (`code`, **bold**, links), so a backtick in an existing body renders as code.
- **Facts:** In `layout="grid"` the value sits at the top at a fixed position and the label of any length beneath it, so the figures line up across tiles.
- **Keymap:** A long key sequence wraps below the label instead of leaving the card.
- **Faq:** An odd number of questions stays one column instead of leaving an empty field in the frame.
- **Quickstart:** A long command wraps in its code block instead of being cut off.

## [0.13.2] - 2026-11-17

### Fixed

- **Docs sidebar:** A folder's own `index.md` (`docs/<group>/index.md`) is listed in that folder's group instead of the first one, so a site with several groups no longer shows every group overview under the first heading.

## [0.13.1] - 2026-11-16

### Fixed

- **StatBand:** On a phone the figures stack as one column without the left hairline and indent; a hairline above each separates them.

## [0.13.0] - 2026-11-16

### Added

- **Components:** `StatBand`, `SectionIntro`, `Split`, `FlowPanel`, `BarCompare`, `ElementList`, `Showcase`, `Compare`, `AudienceList` and `Tradeoffs` — lighter, alternating content blocks for a start page, as an alternative to the `Features` and `Facts` card grids. Nothing existing changes.
- **CodeBlock:** The optional `marks` prop sets numbered dots at the end of lines, to go with the numbered points of a `Split`. Without it the block renders as before.

## [0.12.14] - 2026-11-13

### Changed

- **Header:** The header pill is as wide as the hero (1240px instead of 1000px) and a little taller; menu entries get a soft background on hover and for the current page, and the GitHub link carries an arrow in its own white circle.
- **Hero:** The CASOON family badge is smaller and quieter: no shadow, a lighter outline, and the part after the hairline in a muted tone.

## [0.12.13] - 2026-11-13

### Changed

- **Hero:** An eyebrow that starts with `CASOON` (the default `CASOON Open Source` among them) is set as a family badge with the logo mark instead of a dot.

### Fixed

- **Hero:** A site's own block right after the hero — an aside, a card, a `Spotlight` — no longer sits flush against the hero's lower edge.

## [0.12.12] - 2026-11-11

### Changed

- **Assets:** The CASOON logo and the favicon are turquoise (`#028baa`) instead of red.

## [0.12.11] - 2026-11-11

### Added

- **Components:** `Flow` shows the path from input to result in 3–5 stages, each naming its
  artifact (a file, a command, an output folder).

## [0.12.10] - 2026-11-11

### Fixed

- **Footer:** links to other sites carry a small arrow icon on the baseline instead of the thin
  `↗` character.

## [0.12.9] - 2026-11-11

### Changed

- **Footer:** the project name leads in large type above its description, the link columns sit
  beside it with small captions and mark links to other sites, and the CASOON logo moves into
  the bottom line next to "A CASOON project".

### Fixed

- **Call to action:** a short title stays on one line on wide screens and a longer one breaks
  into two lines of even length, instead of breaking after about 14 characters.

## [0.12.8] - 2026-11-11

### Changed

- **Contributors:** `pnpm test:accent` builds the starter site with `accent` set and checks the
  colour the page computes in light, dark and with the theme toggle.

### Fixed

- **Colours:** the `accent` option takes effect; before, the theme's own `--accent` overrode the
  project colour in every colour scheme.

## [0.12.7] - 2026-11-03

### Changed

- **Contributors:** the repository holds the starter site and the scripts to set up a project
  site (`scripts/init-site.sh`) and roll a version out to all of them (`scripts/rollout.sh`,
  which finds the project repos on GitHub); the process is in `MAINTAINING.md`.
- **Contributors:** `scripts/check-site.cjs` checks a built site (axe WCAG 2.2 AA in light and
  dark theme, links, scripts, external requests); `rollout.sh` runs it on every site before
  committing.

### Fixed

- **Colours:** brand and accent red in the light theme are a shade darker, so red text and
  badges reach 4.5:1 contrast on the sand bands as well, not only on the page background.

## [0.12.6] - 2026-11-02

### Added

- **Package:** first release on npm: layout, components, docs/showcase/changelog routes and
  self-hosted fonts for the GitHub Pages sites of CASOON open-source projects.
