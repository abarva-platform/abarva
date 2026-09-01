# Moves Rich-Context Build - Live Status

**Updated:** 2026-09-01T20:45:54Z
**Agent:** codex
**Branch:** codex/moves-rich-context
**Head:** bc86ca2c1

## Now
Increment 1 PR follow-up is validated and ready for review.

## Increments
| # | Increment | State | Evidence |
|---|-----------|-------|----------|
| 1 | Context packing | pr_open | PR #7287; implementation SHA 62fc13011; follow-up coverage semantics validated; focused Jest 42/42; targeted ESLint pass; TypeScript pass with larger heap; release:check pass |
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

## Known gaps
Increment 2 is not started because the auto-commit and gate-blocking behavior requires a product-owner decision.
Increments 3 and 4 are intentionally deferred until Increment 1 is measured.
Release record exists as candidate. PR #7287 is open. Deployment and live proof have not started.
