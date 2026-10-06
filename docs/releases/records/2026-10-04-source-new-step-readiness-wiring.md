# Source New — wire the step-readiness model into the workspace

## Release ID

2026-10-04-source-new-step-readiness-wiring

## Status

Merged — not deployed and not live-proven by this record.

## Plain-English Summary

The Source New event workspace now shows one status and one next action for the step the operator is
working in, instead of leaving them to infer it from several parallel counters.

`src/lib/source/new-workspace/step-readiness.ts` has modelled exactly this since September — a
status per step plus `nextAction: { label, disabled, disabledReason }` — and nothing in the product
called it. It was listed in `docs/architecture/orphaned-lib-modules.json` as test-only. This change
adds the adapter that turns a loaded event into that model, calls it from the event page, and
renders the result. When the action is unavailable the surface states the reason instead of showing
a control that silently does nothing.

Scope is the request step only. Later steps need data the page does not load yet; the adapter
returns `null` for anything it cannot model, and the existing panels render unchanged in that case.

## Layer Impact

Release lane: **global-control-lane**.

Product read path and presentation only. No schema change, no migration, no new network call, and no
change to authority, approval or tenant rules. The rendered control is presentational in this slice:
it reflects readiness and does not submit.

## Client Applicability

All clients, through the shared control lane. Behaviour is unchanged wherever the model returns
`null`, which is every step except request, so no client sees a changed surface outside that step.

## Changes Included

- `src/lib/source/new-workspace/step-readiness-adapter.ts` — new adapter.
- `src/lib/source/new-workspace/step-readiness-adapter.test.ts` — new tests.
- `src/app/(maestro)/source/new/[eventId]/page.tsx` — computes readiness and passes it.
- `src/components/source/new-workspace/SourceNewWorkspace.tsx` — optional prop and the banner.
- `docs/architecture/orphaned-lib-modules.json` — baseline refreshed by the repo-owned generator.

## QA / Validation

| Check | Status |
|---|---|
| Adapter unit tests | PASS — 6 cases |
| Affected suites (new-workspace lib + components) | PASS — 16 suites, 225 tests |
| TypeScript `tsc --noEmit`, judged by exit code | PASS — exit 0, 0 errors |
| ESLint on changed files | PASS — exit 0 |
| Mutation — acceptance mapping forced off | PASS — failed as intended, then restored |
| Mutation — reviewer blockers dropped | PASS after fix — survived first, exposing an untested `changes_requested` branch; a case was added and the mutation then failed as intended |
| `npm run audit:lib-orphans` | PASS — reported the module reached again; baseline refreshed with `--update` |
| Signed-in acceptance | NOT RUN |

Two assumptions were wrong and were caught by the typecheck rather than by review: the event
projection has no `requestedBy` field, and the page kept only the approval `status` rather than the
full state. Both corrected — the requester maps to `owner`, documented inline as the closest true
reading and not a second name for the decision owner.

## Rollout Plan

Merge to `main`; the repo-owned main deploy workflow builds and deploys. No flag, no configuration
value, no data step.

## Deployment Authority

Repo-owned main deploy workflow only. No ad-hoc Azure command, no traffic or revision change from
this lane.

## Rollback Plan

Revert the commit. The adapter is additive and its prop is optional and defaults to `null`, so a
revert restores the previous rendering with no data or schema consequence.

## Audit Evidence

- Adapter and tests at the paths listed under Changes Included.
- Caller: the event page passes `stepReadiness`; the workspace renders `StepReadinessBanner`.
- Orphan baseline: `testOnly` 429 → 428 with the one module removed. The entry-point and scanned
  counts in the same file also moved because the baseline had not been regenerated since `main`
  advanced; no other module's classification changed.

## Known Gaps

- Only the request step is modelled. Define, suppliers and RFI need page data that is not loaded yet;
  each is its own slice.
- The control is presentational and does not submit; wiring it to the governed action is a later
  slice.
- Not deployed and not live-proven by this record. No signed-in readback was performed.
