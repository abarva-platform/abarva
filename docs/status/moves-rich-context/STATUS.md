# Moves Rich-Context Build - Live Status

**Updated:** 2026-09-01T21:53:53Z
**Agent:** codex
**Branch:** main
**Head:** acb0b4d9b

## Now
Increment 0 informative routing guard and Increment 1 packing/coverage telemetry are merged to main via PR #7287. Deployment and live proof have not started.

## Increments
| # | Increment | State | Evidence |
|---|-----------|-------|----------|
| 0 | Evidence routing honesty | merged | PR #7287 merged at 2026-09-01T21:53:29Z; canonical-backed current-state families fail informatively in Upload & Review and direct document-ingest calls; focused helper/UI tests pass |
| 1 | Context packing | merged | PR #7287 merged at 2026-09-01T21:53:29Z; merge commit 67a0abdaf; coverage semantics validated; focused Jest 42/42; targeted ESLint pass; TypeScript pass with larger heap; release:check pass; GitHub PR checks pass |
| 2 | Approval gap | not_started | none |
| 3 | Digest layer | not_started | none |
| 4 | Digest-aware packing | not_started | none |

## Measurements
| Metric | Before | After |
|--------|--------|-------|
| Evidence tokens in prompt | | |
| approvedAvailable / packed / cited | | |
| coverageRatio | | |

## Blocked on
nothing

## Decisions taken
Isolated work in a clean worktree from origin/main because the primary checkout contains unrelated local changes.
Used an additive nullable run-ledger JSONB column so coverage telemetry does not break existing run polling.
Set coverageRatio to null when approvedAvailable is 0 so no-input and prompt-starvation states cannot collapse into the same dashboard value.
Added structural coverageState/requiresAttention fields inside run coverage telemetry so starvation is visible without parsing warning strings.
Added the Increment 0 4b guard only: canonical-backed current-state CSV families are reported as governed data-load requirements when routed through Upload & Review. No auto-routing or auto-commit policy change was made.

## Known gaps
Increment 0 4a routing to canonical loaders is not implemented here.
Increment 2 is not started because the auto-commit and gate-blocking behavior requires a product-owner decision.
Increments 3 and 4 are intentionally deferred until Increment 1 is measured.
Release record exists as candidate. PR #7287 is merged. Deployment and live proof have not started.
