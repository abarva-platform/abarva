# Moves Rich-Context Build - Live Status

**Updated:** 2026-09-01T19:06:52Z
**Agent:** codex
**Branch:** codex/moves-rich-context
**Head:** 62fc13011

## Now
Increment 1 context packing implementation is committed and release-check validation is next.

## Increments
| # | Increment | State | Evidence |
|---|-----------|-------|----------|
| 1 | Context packing | in_progress | implementation SHA 62fc13011; focused Jest 41/41; targeted ESLint pass; TypeScript pass with larger heap |
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

## Known gaps
Increment 2 is not started because the auto-commit and gate-blocking behavior requires a product-owner decision.
Increments 3 and 4 are intentionally deferred until Increment 1 is measured.
Release record exists as candidate. Release check, PR, deployment, and live proof have not started.
