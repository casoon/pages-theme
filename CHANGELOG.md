# Changelog

All notable changes to `@casoon/pages-theme` are listed here. The theme follows
[Semantic Versioning](https://semver.org/): while it is 0.x, a minor version may change what a
site renders.

## [Unreleased]

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
