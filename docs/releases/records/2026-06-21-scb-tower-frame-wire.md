# 2026-06-21-scb-tower-frame-wire — Tower frame calls the server endpoint (server-first, browser fallback)

## Release ID

`2026-06-21-scb-tower-frame-wire`

## Status

`candidate`

## Plain-English Summary

Wires the live Tower surface (`public/tower-v2/app.js`) to answer through the server endpoint `POST /api/tower/ask` (shipped #3789) instead of the in-browser keyword switch — the W1.4 Tower cutover. On a Tower question the handler now: shows "thinking", POSTs the question, streams the response into the same answer card, and — on ANY failure (non-ok, network error, empty body) — FALLS BACK to the existing deterministic `answerFor(q)` so the surface never breaks. `answerFor` is kept intact as the fallback. This makes Tower answers model-based (Ava voice, expert-grounded when `scb_shared_engine_tower` is on) with a guaranteed safety net.

## Layer Impact

- **public-demo / global-control-lane:** one browser file (`public/tower-v2/app.js`) — the ask handler becomes server-first with streaming + a mandatory fallback to the existing browser answer. No `src/**` change. The endpoint it calls was already shipped (#3789).

## Client Applicability

- All clients: Tower answers now come from the server endpoint (Ava voice; grounded when the tenant's `scb_shared_engine_tower` flag is on), with automatic fallback to the prior deterministic answer on any failure.
- Specific clients: Grounding only when `scb_shared_engine_tower` is enabled per tenant (default off → ungrounded server answer; on error → original keyword answer).
- Internal only: No.
- Public/demo only: This is the Tower demo frame.
- Feature flag: Consumes `scb_shared_engine_tower` indirectly (via the endpoint); the frame itself always tries the endpoint with fallback.

## Changes Included

- `public/tower-v2/app.js` — `askNexus(q)` now async: thinking-state → `fetch('/api/tower/ask')` → stream into the answer card → fallback to `answerFor(q)` on any error; a monotonic token guard prevents stale answers; `answerFor` unchanged.

## QA / Validation

Validation: Pass (static). `node --check public/tower-v2/app.js` → syntax OK. The two Tower integration tests that read `app.js` as a string still pass — `function answerFor(q)`, `renderDock`, `Ask Ava`, and the tab/drawer symbols all remain present (the change is additive). The pre-existing 2 failures in those suites assert the Tower PAGE source (`<iframe`/`TowerIframeContainer`), are unrelated to this file, and fail identically on pristine main. The live streamed path is not exercised here (needs the running app + creds) — but the fallback guarantees the surface works in any env. Live signed-in proof (ask a Tower question → Ava answer streams; flag on → grounded) runs after deploy.

## Rollout Plan

Merge to `main`; `aca-main-deploy` auto-deploys. Then a signed-in Tower check: ask a question → an Ava server answer streams (and, with `scb_shared_engine_tower` on for the tenant, it's expert-grounded); kill the endpoint → the deterministic fallback still answers.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy` (auto on push) — serves the updated static frame via `/api/tower/v2-frame`.
- Shared runtime mutators: none.
- Approved image digest: built by the deploy workflow.
- ACA runtime invariant: Tower frame posts to `/api/tower/ask`; fallback intact.
- Worker image invariant: n/a.
- Feature/env flag update path: `scb_shared_engine_tower` (for grounding).
- Live signed-in proof required: Yes — Tower answer streams from the server (+ fallback works).

## Rollback Plan

Revert the PR — Tower returns to the in-browser keyword answers. Single static file; no data/migration.

## Known Gaps

- Behavior change: Tower answers are now model-based (server) rather than instant keyword matches — intended (W1.4), de-risked by the mandatory fallback.
- Not yet live-proven (the streamed path needs the running app + creds).

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-tower-frame-wire` → `main`.
- CI: `npm run release:check`, `node --check` OK, Tower integration `app.js`-string assertions still green; pre-existing page-source failures isolated.
