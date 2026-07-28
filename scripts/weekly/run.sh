#!/bin/bash
# Weekly maintenance for legalaimcp.com — the mechanism behind two public claims.
#
# The site tells visitors that published links are re-checked automatically and
# that dead tools get pulled, and it renders a dated "Verified" badge off the
# result. This script is what makes those sentences true. If it stops running,
# the copy on the site becomes false within a few weeks as `verified_at` ages —
# so treat a silent failure here as a content bug, not just a cron blip.
#
# Two steps, deliberately in this order:
#   1. verify   — probe every published listing, earn/lose the badge, pull
#                 anything unreachable 3 runs in a row. Accuracy first.
#   2. discover — sweep GitHub for new legal MCP servers into the /admin review
#                 queue. Coverage second, and only ever as a proposal.
#
# Not fatal-on-error between steps: a GitHub rate limit should not stop the
# link check from having run, and vice versa.

set -uo pipefail

ROOT="/Users/gianibrussich/project-claude/legalaimcp"
LOG_DIR="$ROOT/scripts/weekly/logs"
mkdir -p "$LOG_DIR"

STAMP="$(date '+%Y-%m-%d %H:%M:%S')"
echo "=== legalaimcp weekly — $STAMP ==="

cd "$ROOT" || { echo "FATAL: cannot cd to $ROOT"; exit 1; }

verify_status=0
echo "--- verify ---"
node scripts/curate.mjs verify || verify_status=$?
# exit 1 from verify means listings were unpublished — worth a look, not a failure.
if [ "$verify_status" -eq 1 ]; then
  echo "NOTE: listings were auto-unpublished this run — review /admin"
elif [ "$verify_status" -ne 0 ]; then
  echo "ERROR: verify failed with status $verify_status"
fi

echo "--- discover ---"
node scripts/curate.mjs discover || echo "ERROR: discover failed with status $?"

echo "=== done $(date '+%Y-%m-%d %H:%M:%S') ==="
