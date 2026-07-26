# 2026-07-26-roadmap-pr12-structured-pass — PR12: dedicated golden-bar structured pass + governed-build observability

## Release ID

`2026-07-26-roadmap-pr12-structured-pass`

## Status

`candidate`

## Plain-English Summary

PR12 fixes the live golden-bar defect PR11 surfaced: the execution-roadmap generation persisted
narrative/DOCX artifacts but attached **no governed structured contract**, and the generation hook
swallowed the reason. Root cause: piggybacking a sentinel JSON block on the long HTML narrative did
not reliably produce the structured output (HTML framing + token-budget truncation).

PR12:

1. **Dedicated structured pass** (`roadmap-structured-pass.ts`) — a separate, focused model call that
   returns ONLY the structured roadmap JSON, built from the **authoritative SolutionContext** (never
   by parsing rendered HTML). Strict parse/validate with explicit failure codes
   (`structured_output_missing|malformed|schema_invalid`) and one controlled retry (both attempts
   recorded, model-response hash per attempt). Small + fast → does not push toward the proxy timeout.
2. **Explicit governed-build outcome model** (`roadmap-governed-outcome.ts`) — every attempt resolves
   to a typed outcome, never a swallowed `undefined`: `success` |
   `unsupported_approval_claim` | `lifecycle_mismatch` | `prose_structure_contradiction` |
   `renderer_failure` | `persistence_failure` | the structured-pass codes. A persisted outcome record
   carries artifact/move/tenant/run id/pipeline/timestamp/status/failure code+detail/schema version/
   lifecycle version/model-response hash/content hash/renderer results/supersession/version.
3. **Fast build service + endpoint** — `POST /api/v1/moves/:moveId/artifacts/execution-roadmap/build`
   runs the pass → outcome → persist (success stores the download-route's `roadmap_governed_record`;
   any attempt stores a `roadmap_governed_outcome` observability record) and returns the outcome
   directly. It does NOT regenerate the multi-minute HTML narrative, so it avoids the 504 the inline
   `/generate` hits. Consistency (prose⇄structure) is still enforced against the persisted narrative.

## Layer Impact

- **global-control-lane** (flag-gated `moves_governed_roadmap_downloads`): a new build endpoint + pure
  pass/outcome modules. No migration — records live in `deliverable_versions.structured_data`.

## Client Applicability

- Gated behind a **feature flag** (`moves_governed_roadmap_downloads`, default off). Specific clients
  receive it — Meridian first. All others: no change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- ACA runtime invariant: verify after deploy.
- Live signed-in proof required: **yes** — run the Meridian build + download success capture.

## Changes Included

- New: `roadmap-structured-pass.ts`, `roadmap-governed-outcome.ts`, `run-governed-roadmap-build.ts`,
  the `…/execution-roadmap/build/route.ts` endpoint, and `roadmap-structured-pass.test.ts` (17).
- Edited: `roadmap-structured-output.ts` — exported `structuredOutputToInput` for reuse by the pass.

## QA / Validation

- Status: **pass** locally; live app-level proof **not-run** (deferred to post-deploy Meridian capture).
- `npx jest` new suite — **pass**, 17/17. Full `src/lib/deliverables` — pre-existing 6-failure baseline
  **unchanged**; PR12 adds zero new failures. `eslint` clean; `tsc` 0 errors.

## Audit Evidence

- PR: to be opened. Builds on PR8–PR11 (extractor/engine/persistence/downloads).
- Local: 17/17 new tests, tsc 0, eslint clean, baseline unchanged.
- Live: **pending** — Meridian build run id, outcome status, content hash, and the three download
  responses to be captured post-deploy.

## Rollout Plan

Squash-merge to `main`. Deploy via ACA. Flag already on for Meridian. Then run the live build + download.

## Rollback Plan

Disable the flag (instant) or revert the merge. No schema/data migration; records are additive JSON.

## Known Gaps

The roadmap pilot **stays OPEN**. This PR fixes the golden-bar contract-attachment defect and makes
every build outcome observable. Remaining:

- **Live Meridian success proof** — run the build endpoint, confirm the dedicated pass succeeds, then
  download `current/{html,docx,pptx}` (200, correct MIME, non-zero, same content hash) with accurate
  governance wording. If the pass fails, the failure is now persisted and visible (report it, don't
  hide it).
- **Durable-worker migration + per-stage status endpoint + UI states** (PR12D/E full) — this PR uses a
  fast synchronous build (the focused pass is short); moving it into the durable worker with a
  per-stage status stream is the operational follow-up.
- **Orchestrator pipeline parity** — wire the orchestrator to the same dedicated schema + governed
  builder and compare, after golden-bar success.
- **PowerPoint acceptance** on the live-generated deck.

**Closure language stays: "Story-first renderer and structured-output path proven; live generation
persists, but governed download addressability, pipeline parity and PowerPoint acceptance remain
open"** — with download addressability already live-proven (PR11) and the golden-bar contract-
attachment defect now fixed pending the live success capture.
