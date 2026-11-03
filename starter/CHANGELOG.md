# Changelog

All notable changes to this project are documented in this file. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.4.2] - 2026-03-04

### Fixed

- Wide glyphs no longer shift the column grid on clip.
- Node binding rejected valid `max_width` values of 0.

## [0.4.0] - 2026-02-11

### Breaking

- Inline styles replaced by CSS custom properties. Ship the new stylesheet.

### Added

- `strict_contrast` option and contrast reporting in the CLI.
- WASM fallback for unsupported targets.

## [0.3.1] - 2025-12-20

### Added

- Golden fixtures for cursor movement sequences.

### Fixed

- Carriage returns dropped the last frame in some streams.
