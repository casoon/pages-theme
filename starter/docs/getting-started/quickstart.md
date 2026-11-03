---
title: Quickstart
description: Render a captured ANSI stream to an HTML fragment and put it on a page.
order: 2
---

## Capture a stream

Most tools disable colours when they do not write to a terminal. Force them on while capturing:

```sh
CLICOLOR_FORCE=1 cargo test --color always 2>&1 > report.ansi
```

## Render it

```rust
use runemark::{Options, Renderer};

let html = Renderer::new(Options::default()).render(&std::fs::read_to_string("report.ansi")?)?;
```

## Ship the stylesheet

The fragment uses classes, not inline styles. Include `runemark.css` once per page; it defines the
palette for light and dark surroundings.
