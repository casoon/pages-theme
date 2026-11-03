#!/usr/bin/env bash
# Sets up the CASOON Pages site in a project repository: copies the starter (site/, docs/,
# examples/, CHANGELOG.md, .github/workflows/pages.yml) and points site/package.json at the
# latest @casoon/pages-theme on npm. Existing docs/, examples/, CHANGELOG.md and pages.yml are kept.
#
#   scripts/init-site.sh <project-repo>
#
# Afterwards, in <project-repo>/site: pnpm install && pnpm build, then commit.
# Theme updates for all projects later: scripts/rollout.sh.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
target="$(cd "${1:?usage: scripts/init-site.sh <project-repo>}" && pwd)"
site="$target/site"

if [[ -e "$site" ]]; then
  echo "error: $site already exists" >&2
  exit 1
fi
rsync -a --exclude node_modules --exclude dist --exclude .astro "$root/starter/site/" "$site/"
# Drop the workspace-only includes (comment + theme paths) from tsconfig.json.
node -e '
  const fs = require("node:fs");
  const file = process.argv[1];
  const lines = fs.readFileSync(file, "utf8").split("\n");
  fs.writeFileSync(file, lines.filter((l) => !/Workspace only|"\.\.\/\.\.\//.test(l)).join("\n"));
' "$site/tsconfig.json"
mkdir -p "$target/.github/workflows"
for item in .github/workflows/pages.yml docs examples CHANGELOG.md; do
  if [[ -e "$target/$item" ]]; then
    echo "kept existing $item"
  else
    cp -R "$root/starter/$item" "$target/$item"
    echo "copied starter $item (sample content, replace it)"
  fi
done

version="$(npm view @casoon/pages-theme version)"

# The starter uses workspace:*; a project site takes the npm package.
node -e '
  const fs = require("node:fs");
  const [file, target, version] = process.argv.slice(1);
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  pkg.name = `${require("node:path").basename(target)}-site`;
  pkg.dependencies["@casoon/pages-theme"] = `^${version}`;
  pkg.pnpm = { onlyBuiltDependencies: ["esbuild"] };
  fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
' "$site/package.json" "$target" "$version"

echo "theme ^$version (npm) → $site/package.json"
echo "next: cd $site && pnpm install && pnpm build"
