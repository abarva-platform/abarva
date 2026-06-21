# 2026-06-21-scb-tower-ask-endpoint — Tower server answer endpoint (flag-gated)

## Release ID

`2026-06-21-scb-tower-ask-endpoint`

## Status

`candidate`

## Plain-English Summary

Adds a server-side Tower answer endpoint `POST /api/tower/ask` — the missing piece of W1.4 (Tower previously answered only in the browser via `public/tower-v2/app.js answerFor`, never hitting the server). It resolves the active client, builds the Ava/Tower system prompt (mirroring the Tower synthesis route's egress/auth/streaming), and — when `scb_shared_engine_tower` is ON for the tenant — grounds the answer in the Consilium expert(s) for the question (industry-fenced), streaming the result. **Flag OFF (every tenant today) and the endpoint is not yet called by any client, so this is additive + dormant.** The browser-frame wiring (`answerFor` → POST this endpoint) is the follow-on that makes it live.

## Layer Impact

- **global-control-lane (additive, dormant):** one new API route. No existing file changed; uses the existing `scb_shared_engine_tower` flag (default off). No client calls it yet.

## Client Applicability

- All clients: No runtime change — new route, uncalled, flag off.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `scb_shared_engine_tower` (existing placeholder, default OFF) is now consumed by this route.

## Changes Included

- `src/app/api/tower/ask/route.ts` — POST `{question}` → tenancy gate + active client → Ava/Tower prompt → flag-gated expert grounding (`summonExpertsForQuery`) → preflighted Anthropic stream (same egress path as the synthesis route).

## QA / Validation

Validation: Pass (static). `tsc --noEmit` clean on the route + registry. Flag-off = ungrounded (groundingBlock empty → user message === bare question). `scb_shared_engine_tower` resolves FALSE for apexretail/firstcapital/null. The live route is not exercised (needs Clerk/DB/Anthropic creds) — not faked.

## Rollout Plan

Merge to `main` (dormant). Follow-on slice: wire `public/tower-v2/app.js answerFor` to POST this endpoint and render the stream; then flip `scb_shared_engine_tower` per tenant + signed-in proof.

## Deployment Authority

Not applicable to this merge — new uncalled route, flag off, no runtime behavior change.

- Repo-owned deploy workflow: `aca-main-deploy` (auto on push) — ships the route but nothing calls it.
- Shared runtime mutators: none.
- Approved image digest: built by the deploy workflow.
- ACA runtime invariant: route present but inert.
- Worker image invariant: n/a.
- Feature/env flag update path: `scb_shared_engine_tower` (later).
- Live signed-in proof required: Yes — at the client-wiring + flag-flip step, not this merge.

## Rollback Plan

Revert the PR — deletes the uncalled route. No data/migration.

## Known Gaps

- Not wired to the Tower client yet (the browser still uses `answerFor`); that's the follow-on.
- Not runtime-proven.

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-tower-ask` → `main`.
- CI: `npm run release:check`, tsc clean, flag-resolution check (default off).
