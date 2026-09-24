#!/usr/bin/env bash
# Ping IndexNow (Bing/Yandex/Seznam, and anything else that honors the
# protocol) after a content change worth an immediate recrawl.
#
# NOT wired into any build step, deploy hook, or CI job. Run it by hand,
# on purpose, after you've actually changed something — IndexNow has no
# rate-limit courtesy built in on our side, so don't loop this.
#
# Key file: public/1a366e5be29e8a3030dd846be8b6acfa.txt (must stay published
# at https://legalaimcp.com/1a366e5be29e8a3030dd846be8b6acfa.txt — IndexNow
# checks it matches the key in the ping payload before accepting URLs).
#
# Usage:
#   scripts/indexnow-ping.sh https://legalaimcp.com/guides/connect-claude-to-clio [more URLs...]

set -euo pipefail

KEY="1a366e5be29e8a3030dd846be8b6acfa"
HOST="legalaimcp.com"
KEY_LOCATION="https://legalaimcp.com/${KEY}.txt"

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 <url> [url...]" >&2
  exit 1
fi

# Build a JSON array of the URL args without a jq dependency.
urls_json=""
for u in "$@"; do
  if [ -n "$urls_json" ]; then urls_json="${urls_json},"; fi
  urls_json="${urls_json}\"${u}\""
done

payload=$(cat <<JSON
{
  "host": "${HOST}",
  "key": "${KEY}",
  "keyLocation": "${KEY_LOCATION}",
  "urlList": [${urls_json}]
}
JSON
)

echo "Would POST to https://api.indexnow.org/indexnow with:"
echo "$payload"
echo
echo "This script does not call the API. Uncomment the curl below to actually send it."
echo
echo "# curl -sS -X POST https://api.indexnow.org/indexnow \\"
echo "#   -H 'Content-Type: application/json; charset=utf-8' \\"
echo "#   -d '$payload'"
