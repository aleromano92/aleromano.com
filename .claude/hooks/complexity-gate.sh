#!/usr/bin/env bash
# Stop hook: enforce the complexity gate (limits in cccc.toml) before Claude ends a turn.
# Same paths as `npm run complexity`; CI runs the same gate.
set -u

input=$(cat)

# Claude is already continuing because of this hook: let it stop instead of looping.
if printf '%s' "$input" | grep -Eq '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi

# Environments without cccc (e.g. cloud sessions) skip the gate; CI still enforces it.
command -v cccc >/dev/null 2>&1 || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

paths=(src scripts observability)
cccc "${paths[@]}" >/dev/null 2>&1 && exit 0

{
  echo "Complexity gate failed: a function exceeds the cognitive or cyclomatic limit in cccc.toml."
  echo "Refactor it (extract well-named helpers, early returns, lookup tables), never raise the thresholds,"
  echo "then re-run \`npm run complexity\` until it passes. Most complex functions:"
  cccc --top-cognitive 5 "${paths[@]}" 2>&1
  cccc --top-cyclomatic 5 "${paths[@]}" 2>&1
} >&2
exit 2
