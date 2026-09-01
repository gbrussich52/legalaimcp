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

# 2026-09-01 (claude-fable-5-1): under launchd the Supabase CLI cannot see the
# token it stored in the login keychain, so `supabase db query --linked` failed
# every week with "Access token not provided" and the Verified badge silently
# aged (improve-queue 2026-08-25). Read the same keychain item the CLI wrote and
# hand it over as the env var the CLI documents. Value never touches the log.
if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  SUPABASE_ACCESS_TOKEN="$(security find-generic-password -s 'Supabase CLI' -a supabase -w 2>/dev/null || true)"
  if [ -n "$SUPABASE_ACCESS_TOKEN" ]; then export SUPABASE_ACCESS_TOKEN; echo "token: keychain"; else echo "WARN: no Supabase access token (keychain read failed) — verify step will skip DB updates"; fi
fi

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
