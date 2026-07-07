# 2026-06-21-scb-intelligence-render — Render the Intelligence ask stream as prose + experts

## Release ID

`2026-06-21-scb-intelligence-render`

## Status

`candidate`

## Plain-English Summary

Fixes the Intelligence v2 ("Lens") ask bar, which was dumping the raw newline-delimited JSON event stream onto the page (`{"type":"delta","text":"..."}` lines) instead of an answer. It now parses the stream: accumulates the `delta` chunks into prose, renders an "Experts consulted" row of Consilium expert chips from the `contributing-experts` event, and renders the `followups` as clickable chips. Discovered during the live Apex grounding proof — the faculty grounding was correct end-to-end, but this surface never rendered it. Affects every tenant on the v2 Lens surface.

## Layer Impact

- **global-control-lane:** one client component (`IntelligenceV2Surface.tsx`) — stream parsing + answer/experts/followups rendering. No API, schema, or data change.

## Client Applicability

- All clients: Yes — every tenant on the Intelligence v2 Lens gets the corrected rendering (previously all saw raw JSON).
- Specific clients: The experts row only populates when the shared-engine flag is on for the tenant (today: `apexretail`); for others the answer simply renders as prose (still a fix over raw JSON).
- Internal only: No.
- Public/demo only: No (applies wherever the v2 Lens serves).
- Feature flag: None for the render fix itself; the experts row is fed by `scb_shared_engine_intelligence`.

## Changes Included

- `src/components/intelligence-v2/IntelligenceV2Surface.tsx` — NDJSON stream parser (delta→prose, contributing-experts→chips, followups→chips); experts/followups state + CSS; non-JSON line fallback to plain text.

## QA / Validation

Validation: Pass (static) + live re-proof to follow. `tsc --noEmit` clean (0 errors) on the component. Behavior reasoned from the captured live stream (the exact event sequence — session/classified/sources/contributing-experts/delta/followups/validation/done — was observed in the Apex proof and is what the parser handles). The end-to-end visual re-proof (sign in to Apex, ask, confirm prose + "Experts consulted: Customer Loyalty…" chip render) runs after deploy.

## Rollout Plan

Merge to `main`; `aca-main-deploy` auto-deploys. Then re-run the signed-in Apex proof to confirm prose + experts render.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy` (auto on push to `main`).
- Shared runtime mutators: none.
- Approved image digest: built by the deploy workflow from this commit.
- ACA runtime invariant: web app serves the updated client bundle after deploy.
- Worker image invariant: n/a.
- Feature/env flag update path: n/a.
- Live signed-in proof required: Yes — re-prove on Apex after deploy (visual render).

## Rollback Plan

Revert the PR — restores the prior rendering (raw, but no functional regression beyond that). Pure client component; no data/migration.

## Known Gaps

- Visual re-proof pending deploy.
- Router still summons an out-of-industry expert (e.g. airline-loyalty for a retail tenant) — separate routing-precision fix (pass tenant industry to the router).
- Answer prose is plain text; richer AgentAnswer rendering (tables/charts) is a later renderer task.

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-intelligence-render` → `main`.
- CI: `npm run release:check`, `tsc` clean (0 errors).
- Pre-fix evidence: live Apex stream captured raw NDJSON on-page (the bug); post-fix re-proof to be attached.
