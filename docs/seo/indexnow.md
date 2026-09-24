# IndexNow

classification: PUBLIC

Added 2026-09-24 as part of the AEO/SEO pass. Not previously implemented on this site.

## What this is

IndexNow is a push protocol (Bing, Yandex, and Seznam.cz honor it; Google does not,
it still relies on its own crawl scheduling) that lets a site tell a search engine
"this URL changed, come get it now" instead of waiting for the next crawl. It does not
affect AI-crawler citation directly, since GPTBot, ClaudeBot, and PerplexityBot don't
read IndexNow, but it shortens the Bing index lag, and Bing is one of the corpora some
AI answer engines draw from.

## What's live

- Key file: `public/1a366e5be29e8a3030dd846be8b6acfa.txt`, served at
  `https://legalaimcp.com/1a366e5be29e8a3030dd846be8b6acfa.txt`. It must return the raw
  key as plain text with no other content. Do not move or regenerate this file without
  updating `scripts/indexnow-ping.sh` to match. A mismatched key makes every ping fail.
- Ping script: `scripts/indexnow-ping.sh <url> [url...]`. It builds the IndexNow payload
  and prints it. It does not call the API. The actual `curl` line is commented out on
  purpose. This was a deliberate scope boundary for the 2026-09-24 AEO pass: build the
  plumbing, don't fire it unreviewed.

## How to actually use it (next time, by hand)

1. Ship a content change worth an immediate recrawl: a new guide, a corrected fact, a
   materially rewritten page. Not a typo.
2. Run `scripts/indexnow-ping.sh https://legalaimcp.com/the/changed/url`.
3. Read the printed payload. If it looks right, uncomment the `curl` line in the
   script (or copy it out and run it directly) to send it.
4. IndexNow has no built-in rate limit on our side. Don't loop this per-listing or
   wire it into a cron job without a cap. One ping per meaningfully-changed URL,
   done deliberately, is the intended usage.

## Not done

- Not wired into CI, the build, or a deploy hook.
- Not auto-triggered on every Supabase listing update.
- No submission has been made yet. This session only built the key file and the
  script. The first actual ping is a follow-up action, not part of this commit.
