# Maintaining

How the theme is developed, released and rolled out to the project sites. None of this is part
of the npm package (`files` in `package.json` lists only the theme).

## Repository

| Path | Purpose |
| --- | --- |
| theme files at the root | `@casoon/pages-theme`, published to npm |
| `starter/` | template of a project repo: `site/`, `docs/`, `examples/`, `CHANGELOG.md`, `.github/workflows/pages.yml`; sample content |
| `scripts/init-site.sh` | sets up the site in a new project repo |
| `scripts/rollout.sh` | brings every project site to the latest theme version |
| `scripts/check-site.cjs` | checks a built site: axe, links, scripts, external requests |
| `.github/workflows/publish.yml` | publishes a version tag to npm |

## Develop

The repo is a pnpm workspace: the starter site uses the theme from the root, so changes show up
immediately.

```bash
pnpm install
```

```bash
pnpm dev
```

`pnpm build`, `pnpm check` (Biome) and `pnpm type-check` (`astro check`, theme included) run
from the root.

## Release

1. Change the theme, raise `version` in `package.json`, add the entry to `CHANGELOG.md`
   (Keep a Changelog), merge to `main`.
2. Tag and push: `git tag vX.Y.Z && git push origin vX.Y.Z`.
3. The `Publish` workflow checks that the tag matches the version and packs the package. The
   publish job waits in the `npm` environment: approve it in the run (Review deployments).
4. npm receives the package through trusted publishing (OIDC, no token) with provenance.
   Check: `npm view @casoon/pages-theme version`.

A dry run of everything up to the publish: run the `Publish` workflow by hand
(`workflow_dispatch`).

## Roll out to all project sites

A project repo is every non-archived `casoon` repo whose `site/package.json` depends on
`@casoon/pages-theme`; `rollout.sh` finds them on GitHub. Clones are expected next to this repo
(`~/GitHub/<repo>`).

```bash
scripts/rollout.sh            # dry run: per repo a worktree on origin, latest npm version, build, commit
scripts/rollout.sh --push     # the same, then push (sites that deploy on dispatch only are dispatched)
scripts/rollout.sh --status   # theme dependency on origin and last Pages run per repo
```

- Each repo runs in a temporary worktree on `origin/<default branch>`; local work in the clone
  stays untouched. Ignored build inputs of the clone (`dist/`, wasm `pkg/`, native bindings) are
  linked in for the build.
- Committed are only `site/` (for a workspace site also the root lockfile) and one line in
  `CHANGELOG.md`: `the project site uses the current shared theme (X.Y.Z)`.
- Before the commit, every site is built and checked with `scripts/check-site.cjs`: axe
  (WCAG 2.2 AA) in light and dark theme, broken or out-of-base links, scripts beyond the
  theme's two, requests to other origins. A site with findings is not committed. The check runs
  here, not in the Pages workflows, so it costs no Actions minutes.
- A failing repo is reported with its log; the others continue. `THEME_VERSION` pins a version,
  `JOBS` sets how many repos run in parallel (default 4).

## Check one site

```bash
node scripts/check-site.cjs ~/GitHub/<repo>/site/dist
```

Serves the build under its base path and crawls every page. A page that runs one own script on
purpose (a browser module of the project on its regular content) is listed in the site's
`site/package.json`: `"casoonPagesCheck": { "allowScript": ["interactive/"] }`. Once per
machine: `pnpm exec playwright install chromium`.

## New project site

1. `scripts/init-site.sh ~/GitHub/<repo>`: copies the starter (keeps existing `docs/`,
   `examples/`, `CHANGELOG.md`, `pages.yml`) and sets the latest theme version.
2. In `site/astro.config.mjs`: `site`, `base` and the options of `casoonPages()`
   (see [README](README.md#options)).
3. Fill `site/src/pages/index.astro`, `site/src/showcase.ts` and `docs/` with the project's
   content; render the examples with the project's own package.
4. Add the project build to `pages.yml` if the site needs its binary or binding.
5. In `site/`: `pnpm install && pnpm build`, commit `site/` with `pnpm-lock.yaml`.
6. Once in the GitHub repo: *Settings → Pages → Source* to "GitHub Actions".

From then on `rollout.sh` finds the repo by itself.
