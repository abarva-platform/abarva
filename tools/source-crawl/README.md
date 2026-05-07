# Source crawl — slice 1

Read-only Playwright crawler that takes a faithful snapshot of one
tenant's `/source` surface. Default target is AbarVa's own production
app — point it at any sourcing platform by editing `.env`.

This is **slice 1 of N** in the sourcing-platform audit pipeline. We
are not auditing anything yet — we are building the ground truth that
later slices measure the agent against. Spec lives in `1_crawl.md`.

## What it does, in one paragraph

Loads a saved Clerk/Playwright session, BFS-walks every link under
`/source/*`, and writes one JSON object per page to `snapshot.jsonl`,
one row per URL to `url_inventory.csv`, plus a deduped
`agent_touchpoint_index.json` and a `crawl_summary.json` with stop
reason + per-entity counts. Read-only is enforced two ways: any
control whose label looks like a write verb is skipped, and any
non-GET request observed during a navigation aborts that path.

## Quickstart

```bash
cd tools/source-crawl
cp .env.example .env          # default points at app.abarva.ai/source
npm install
npx playwright install chromium

# 1. Save a logged-in session — opens a real browser, you log in
#    manually (Clerk OTP). The script saves storageState.json once
#    the URL leaves /sign-in.
npm run save-session

# 2. Dry pass — first 50 pages, then stop. Review the output.
npm run crawl:dry

# 3. After review, full pass.
npm run crawl:full
```

Output lands in `crawl/output/` (snapshots, CSV, JSON) and `vault/`
(raw HTML, full-page screenshots; mode 0700, gitignored).

## Pre-flight checklist (from the spec)

- [ ] `npm run save-session` has been run; `auth/storageState.json` exists
- [ ] `.env` populated (`TENANT_URL`, `TENANT_HOSTNAME`, `AUDITOR_EMAIL`)
- [ ] User has confirmed the auditor account is genuinely read-only at
      the platform's permission layer (not just by convention)
- [ ] `vault/` will be created with mode 0700 on first run
- [ ] Headed browser confirmed working (`CRAWL_HEADED=true`)
- [ ] Dry-pass output reviewed and approved before running `crawl:full`

## Hard rules

1. **Read-only.** Never click any control whose label or `aria-action`
   implies write (`create`, `new`, `add`, `save`, `submit`, `send`,
   `award`, `approve`, `delete`, `archive`, `publish`, etc.).
2. **GET only.** Any non-GET request observed during a navigation
   aborts that path. Logged in `crawl_summary.json →
   skipped_mutating_paths[]`.
3. **Reuse the saved Playwright session.** Never re-auth in scripts;
   never touch password / OTP fields.
4. **Serial requests** with 800–1200 ms jitter. On HTTP 429 or 5xx,
   exponential backoff (2 → 4 → 8 → 16 s) then stop and log.
5. **Stay on the tenant's hostname and path prefix.** No cross-tenant,
   no marketing sites, no third-party.
6. **Stop after 2 hours wall-clock or 5,000 pages**, whichever comes
   first. Partial snapshot is still emitted.
7. **Headed browser by default** so a human can watch what the bot
   sees.
8. **PII redaction.** Email local-parts (`*****@domain.tld`), phone
   digits (keep country code), free-text > 500 chars
   (`<<redacted_long_text:len=N>>`) in structured JSON. Raw HTML and
   screenshots verbatim, but stored under `vault/` (gitignored,
   mode 0700).

## Layout

```
tools/source-crawl/
├── 1_crawl.md                  spec — slice 1 of N
├── README.md                   you're here
├── package.json                deps + npm scripts
├── tsconfig.json
├── .env.example                copy to .env, defaults target app.abarva.ai
├── .gitignore
├── auth/
│   └── storageState.json       saved by `npm run save-session` (gitignored)
├── src/
│   ├── auth.ts                 interactive session capture
│   ├── config.ts               env loading + typed config
│   ├── crawl.ts                main BFS entry
│   ├── extractor.ts            per-page entity classification + payload
│   ├── output.ts               streaming JSONL/CSV/JSON writers
│   ├── safety.ts               read-only enforcement + PII redaction
│   └── types.ts                entity schemas
├── crawl/output/               structured outputs (mostly gitignored)
└── vault/                      raw HTML + full screenshots (mode 0700)
```

## Stop conditions

- `write_confirmation` — page body contains "created", "submitted",
  "sent", etc., right after a navigation. Treated as evidence we
  triggered a write. **Halt immediately** and surface to the user.
- `cross_tenant` — defensive check; data from a different tenant
  appears in a list view. Halt.
- `auth_expired` — Clerk redirected us back to `/sign-in`. Halt; do
  not re-auth in script.
- `max_pages` / `max_hours` / `manual_stop` — soft stops; partial
  snapshot is still written.

## Output files

| File | Purpose |
| --- | --- |
| `snapshot.jsonl` | One JSON object per page — url, entity_type, redacted payload, outbound intra-tenant links. |
| `url_inventory.csv` | URL, status, depth, parent, bytes, notes — quick visual scan. |
| `crawl_summary.json` | Counts per entity type, depth histogram, skipped mutating paths, errors, stop reason. |
| `agent_touchpoint_index.json` | Deduped list of agent invocation surfaces (chat lanes, "Ask Sentinel" buttons, agent-driven generation). Anchors slices 2–7. |
| `canary_candidates.json` | Naturally-rare facts surfaced during the crawl — input to slice 5 canary selection. |
| `screenshots/{hash}.png` | Viewport screenshot per visited page, keyed by URL hash. Full-page screenshots live in `vault/`. |

## What slice 1 hands off

- `agent_touchpoint_index.json` → drives slices 2, 4, 5
- `snapshot.jsonl` filtered by entity → ground truth for slices 3, 5, 6
- `canary_candidates.json` → input to slice 5 canary selection
