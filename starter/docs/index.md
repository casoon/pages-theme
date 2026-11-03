---
title: Overview
description: What runemark does, where it stops, and how this documentation is organised.
order: 0
---

runemark turns ANSI terminal output into static HTML. It resolves colour and cursor sequences at
render time, so the page needs no JavaScript and screen readers get plain text in reading order.

## What it covers

- SGR colours and text attributes, mapped to CSS custom properties.
- Carriage returns and cursor movement, collapsed to the final visible frame.
- Contrast reporting for colour pairs below 4.5:1.

## Where it stops

runemark renders output that already exists. It does not run commands, record sessions or
emulate a full terminal (alternate screen, mouse reporting).

## How the docs are organised

- **Getting started**: install the package and render a first stream.
- **Reference**: overview of the public API and the building blocks of this site. Item-level
  documentation lives on [docs.rs](https://docs.rs/runemark).
