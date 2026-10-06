# Source New — read and show the Strategy authority

## Release ID

2026-10-05-source-new-strategy-authority

## Status

Merged — not deployed and not live-proven by this record.

## Plain-English Summary

The Source New event page read one governed authority, the Request version, and showed its state. The
Strategy version — the next authority in the same store, needing two distinct named approvers — was
never read and never shown.

It is now read alongside the Request one in the same parallel batch, evaluated with the existing
`evaluateStrategyVersionApprovals`, and rendered as its own row beside Request authority.

An unreadable authority stays "Not recorded". It does not become "not approved": absence is not a
decision, and a surface that renders an unread store as a refusal tells the operator somebody
declined when nobody did. That rule already governed the Request row and now governs both.

## Layer Impact

Release lane: **global-control-lane**.

One added read on an existing page, inside the batch that already runs in parallel, plus one rendered
row. No schema change, no migration, no write, and no change to authority, approval or tenant rules.
The surface reports the store; it does not decide anything.

## Client Applicability

All clients, through the shared control lane. Events whose Strategy authority is unreadable — which
is the current state, since those tables sit behind the separate migration apply gate — read
"Not recorded", which is what they are.

## Changes Included

- `src/app/(maestro)/source/new/[eventId]/page.tsx` — reads the Strategy authority and evaluates it.
- `src/components/source/new-workspace/SourceNewWorkspace.tsx` — new optional field, label and row.
- `src/components/source/new-workspace/StrategyAuthorityLabel.test.tsx` — new suite.
- `src/components/source/new-workspace/SourceNewWorkspace.test.tsx` — one assertion scoped; see QA.
- `.github/workflows/ai-surface-control-catalog.yml` — runs the new suite.
- `docs/architecture/test-ci-coverage-census.json` — refreshed by the repo-owned generator.

## QA / Validation

| Check | Status |
|---|---|
| New suite | PASS — 5 cases |
| Affected suites | PASS — 6 suites, 127 tests |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0, 0 errors |
| ESLint on changed files | PASS — exit 0 |
| Mutation — Strategy label copies the Request label | PASS — failed as intended, restored |
| Mutation — unread rendered as "pending" instead of "Not recorded" | PASS — failed as intended, restored |
| `audit:lib-orphans` | PASS — exit 0, no new orphan |
| `audit:test-ci-coverage` | PASS — census refreshed, shape matches |
| Signed-in acceptance | NOT RUN |

One pre-existing test broke, and it was a real collision rather than a flake: it asserted
`getByText("Not recorded")` inside the readiness region, which was unique only while Request was the
sole authority row. The Strategy row renders the same words when unread, so the query became
ambiguous. The assertion was scoped to the Request row rather than the feature changed — the test was
under-specified and this exposed it.

## Rollout Plan

Merge to `main`; the repo-owned main deploy workflow builds and deploys. No flag, no configuration,
no data step.

## Deployment Authority

Repo-owned main deploy workflow only. No ad-hoc Azure command, no traffic or revision change.

## Rollback Plan

Revert the commit. The field is optional and the read is additive; a revert removes one row and one
query with no data or schema consequence.

## Audit Evidence

- The Strategy read mirrors the Request read in the same `Promise.all`, so it adds no serial latency.
- Both labels are asserted by their own row in the new suite, so neither can silently adopt the
  other's copy.
- Census moves by one test file; no other directory changed state.

## Known Gaps

- This surfaces the Strategy authority; it does not yet feed the readiness model. The `define` step
  additionally needs a baseline evidence disposition, which no projection on this page carries — the
  remaining blocker recorded in the step-readiness projection gap note.
- Not deployed and not live-proven by this record. No signed-in readback was performed.
