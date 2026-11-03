#!/usr/bin/env bash
# Rolls the latest @casoon/pages-theme from npm out to project repos in one go. Each repo is
# handled in a temporary worktree on origin/<branch>, so local work in the clone is never touched:
# pnpm add, drop a leftover vendored copy, build, type-check, changelog line, commit of site/
# (+ CHANGELOG.md, + the root lockfile of a workspace site).
#
#   scripts/rollout.sh [--push] [repo ...]   all project repos when none are given;
#                                            without --push nothing leaves the machine
#   scripts/rollout.sh --status              theme dependency on origin and last Pages run per repo
#
# Project repos are found on GitHub: every non-archived casoon repo whose site/package.json
# depends on @casoon/pages-theme. Clones are expected next to this repo.
# Env: JOBS (parallel repos, default 4), THEME_VERSION (default: latest on npm).
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
version="${THEME_VERSION:-$(npm view @casoon/pages-theme version)}"
work="${TMPDIR:-/tmp}/pages-rollout"

# Prints "<repo> <branch> <theme dependency>" for every project repo, sorted.
projects() {
  gh repo list casoon --no-archived --limit 1000 --json name,defaultBranchRef \
    -q '.[] | select(.defaultBranchRef != null) | "\(.name) \(.defaultBranchRef.name)"' |
    xargs -P 8 -L 1 bash -c '
      spec="$(gh api "repos/casoon/$0/contents/site/package.json?ref=$1" \
        -H "Accept: application/vnd.github.raw" 2>/dev/null \
        | node -e "let s=\"\";process.stdin.on(\"data\",(d)=>(s+=d)).on(\"end\",()=>{try{console.log(JSON.parse(s).dependencies[\"@casoon/pages-theme\"]||\"\")}catch{}})")"
      [[ -n "$spec" ]] && echo "$0 $1 $spec"
      true' | sort
}

if [[ "${1:-}" == "--status" ]]; then
  projects | while read -r repo branch spec; do
    run="$(gh run list -R "casoon/$repo" -w pages.yml -L 1 --json status,conclusion \
      -q '.[0] | if .status == "completed" then .conclusion else .status end' 2>/dev/null)"
    printf '%-28s %-26s %s\n' "$repo" "$spec" "${run:--}"
  done
  exit 0
fi

# One repo; prints a single result line. Runs in a subshell per repo (see the end of the file).
roll() {
  local repo="$1" branch="$2" push="$3"
  local clone="$root/../$repo" wt log links=()
  wt="$work/$repo"
  log="$work/$repo.log"
  fail() { echo "$repo | FAILED: $1 (log: $log)"; cleanup; exit 0; }
  cleanup() {
    for l in ${links[@]+"${links[@]}"}; do [[ -L "$l" ]] && rm -f "$l"; done
    git -C "$clone" worktree remove --force "$wt" >/dev/null 2>&1 || true
  }

  [[ -d "$clone/.git" ]] || { echo "$repo | FAILED: no clone at $clone"; exit 0; }
  git -C "$clone" fetch -q origin "$branch" >"$log" 2>&1 || fail "fetch"
  git -C "$clone" worktree remove --force "$wt" >/dev/null 2>&1 || true
  git -C "$clone" worktree add -q --detach "$wt" "origin/$branch" >>"$log" 2>&1 || fail "worktree"

  # A site that is a package of the repo's pnpm workspace (castwright) installs and builds
  # from the root, like its pages.yml; every other site installs on its own.
  local in_workspace=false
  grep -qE '^\s*-\s*"?\.?/?site"?\s*$' "$wt/pnpm-workspace.yaml" 2>/dev/null && in_workspace=true

  # Site builds and pre-commit hooks need what the clone has built locally but git ignores
  # (dist/, wasm pkg/, native bindings, root node_modules); link it in for the run only.
  # Never node_modules a root install would write through, nor the site's own build output.
  local item
  while IFS= read -r item; do
    item="${item%/}"
    case "$item" in
      site | site/node_modules | site/dist | site/.astro | plan | */node_modules) continue ;;
      node_modules) $in_workspace && continue ;;
    esac
    if [[ -d "$(dirname "$wt/$item")" && ! -e "$wt/$item" ]]; then
      ln -s "$clone/$item" "$wt/$item"
      links+=("$wt/$item")
    fi
  done < <(git -C "$clone" status --ignored --porcelain | sed -n 's/^!! //p')

  local dep="@casoon/pages-theme@^$version"
  if $in_workspace; then
    (cd "$wt" && pnpm --filter ./site add "$dep" && pnpm install) >>"$log" 2>&1 || fail "pnpm add"
  else
    local flags=()
    [[ -f "$wt/pnpm-workspace.yaml" ]] && flags+=(--ignore-workspace)
    (cd "$wt/site" && pnpm add "$dep" ${flags[@]+"${flags[@]}"}) >>"$log" 2>&1 || fail "pnpm add"
  fi
  # Sites set up before the npm package carry a vendored copy and exclude it in tsconfig.json.
  if [[ -d "$wt/site/vendor/pages-theme" ]]; then
    rm -rf "$wt/site/vendor/pages-theme"
    rmdir "$wt/site/vendor" 2>/dev/null || true
    node -e '
      const fs = require("node:fs");
      const file = process.argv[1];
      const text = fs.readFileSync(file, "utf8")
        .replace(/^\s*\/\/ vendor\/ is the synced theme.*\n/m, "")
        .replace(/,\s*"vendor"/, "");
      fs.writeFileSync(file, text);
    ' "$wt/site/tsconfig.json"
  fi
  if $in_workspace; then
    # The root build comes first (packages the site renders with); it may or may not include
    # the site itself (castwright: pnpm -r build; liveaudit: only the inspector).
    if node -e "process.exit(require('$wt/package.json').scripts?.build ? 0 : 1)"; then
      (cd "$wt" && pnpm build) >>"$log" 2>&1 || fail "build"
    fi
    if [[ ! -f "$wt/site/dist/index.html" ]]; then
      (cd "$wt" && pnpm --filter ./site build) >>"$log" 2>&1 || fail "build"
    fi
  else
    (cd "$wt/site" && pnpm build) >>"$log" 2>&1 || fail "build"
  fi
  # Type errors are reported, not fatal: the Pages build does not run the check either.
  local note=""
  if node -e "process.exit(require('$wt/site/package.json').scripts?.['type-check'] ? 0 : 1)"; then
    (cd "$wt/site" && pnpm -s type-check) >>"$log" 2>&1 || note=" (type-check fails, see log)"
  fi
  [[ "$(node -p "require('$wt/site/node_modules/@casoon/pages-theme/package.json').version")" == "$version" ]] \
    || fail "installed theme is not $version"
  # axe (WCAG 2.2 AA, light and dark), links, scripts and external requests on the built site.
  # Runs here rather than in the Pages workflow, so it costs no Actions minutes.
  node "$root/scripts/check-site.cjs" "$wt/site/dist" >>"$log" 2>&1 \
    || fail "site check: $(tail -1 "$log")"

  if [[ -f "$wt/CHANGELOG.md" ]]; then
    python3 - "$wt/CHANGELOG.md" "$version" <<'EOF'
import re, sys
path, version = sys.argv[1], sys.argv[2]
text = open(path).read()
head, sep, rest = text.partition("## [Unreleased]")
if not sep:
    sys.exit(0)
section, nxt, tail = rest.partition("\n## [")
entry = f"- **Pages:** the project site uses the current shared theme ({version})."
if re.search(r"shared theme \(\d+\.\d+\.\d+\)", section):
    section = re.sub(r"shared theme \(\d+\.\d+\.\d+\)", f"shared theme ({version})", section)
elif "### Changed" in section:
    section = section.replace("### Changed\n\n", f"### Changed\n\n{entry}\n", 1)
else:
    # Keep a Changelog order: Changed goes after Breaking/Added, before the rest.
    kinds = re.split(r"(?m)^(?=### )", section)
    pos = next((i for i, k in enumerate(kinds)
                if re.match(r"### (Deprecated|Removed|Fixed|Security)", k)), len(kinds))
    block = f"### Changed\n\n{entry}\n\n"
    if pos == len(kinds):
        section = section.rstrip("\n") + "\n\n" + block
    else:
        kinds.insert(pos, block)
        section = "".join(kinds)
open(path, "w").write(head + sep + section + nxt + tail)
EOF
  fi

  # Links inside site/ are not ignored as symlinks; drop them before staging.
  for l in ${links[@]+"${links[@]}"}; do
    [[ "$l" == "$wt/site/"* && -L "$l" ]] && rm -f "$l"
  done
  local files=(site)
  [[ -f "$wt/CHANGELOG.md" ]] && files+=(CHANGELOG.md)
  $in_workspace && files+=(pnpm-lock.yaml)
  git -C "$wt" add "${files[@]}" >>"$log" 2>&1
  if git -C "$wt" diff --cached --quiet; then
    echo "$repo | unchanged ($version)"
    cleanup
    exit 0
  fi
  git -C "$wt" commit -q -m "Pages: theme $version from npm" >>"$log" 2>&1 || fail "commit (hook?)"
  local sha
  sha="$(git -C "$wt" rev-parse --short HEAD)"

  if [[ "$push" == true ]]; then
    git -C "$wt" push -q origin "HEAD:$branch" >>"$log" 2>&1 || fail "push"
    # Some sites deploy on workflow_dispatch only.
    if ! grep -qE '^\s+push:' "$wt/.github/workflows/pages.yml" 2>/dev/null; then
      gh workflow run pages.yml -R "casoon/$repo" --ref "$branch" >>"$log" 2>&1 || fail "dispatch"
      echo "$repo | pushed $sha, Pages dispatched$note"
    else
      echo "$repo | pushed $sha$note"
    fi
  else
    echo "$repo | committed $sha in $wt (not pushed; worktree kept)$note"
    for l in ${links[@]+"${links[@]}"}; do [[ -L "$l" ]] && rm -f "$l"; done
    exit 0
  fi
  cleanup
}
export -f roll
export root version work

push=false
if [[ "${1:-}" == "--push" ]]; then
  push=true
  shift
fi
# "<repo> <branch>" per line: the given repos, or every project repo.
if [[ $# -gt 0 ]]; then
  list="$(for repo in "$@"; do
    echo "$repo $(gh repo view "casoon/$repo" --json defaultBranchRef -q .defaultBranchRef.name)"
  done)"
else
  list="$(projects | awk '{print $1, $2}')"
fi

mkdir -p "$work"
echo "theme $version → $(grep -c . <<<"$list") repos (push: $push)"
xargs -P "${JOBS:-4}" -L 1 bash -c 'roll "$0" "$1" "$2"' <<<"$(sed "s/$/ $push/" <<<"$list")" | sort
