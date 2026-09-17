# 2026-09-17-source-new-phase-state-evidence - Phase State From Evidence, Not Position

## Release ID

`2026-09-17-source-new-phase-state-evidence`

## Status

`candidate`

## Plain-English Summary

In the Source New event workspace, each phase in the rail said "Earlier" whenever its position came before the event's current phase. That is a past-tense claim the surface had no basis for: an event sitting in the market-package phase showed "Suppliers & NDA — Earlier" with no supplier, no NDA and no file recorded anywhere. Phase state is now read from what the phase actually holds. A phase behind the event reads "Recorded" only when the event's own facts or its filed artifacts show something there, and "No record" otherwise.

Two related defects in the same surface are fixed. An event whose stage had advanced past these four phases was placed in no phase at all, so the rail marked every phase — including ones that demonstrably happened — as "Later", i.e. not yet open; those phases now report what they hold, and the surface states where the event actually is. And the next-action panel printed raw stage keys ("Current stage: rfp rfi package"); stage keys now resolve to operator wording, with the market-package phrase used for the `rfp` key family because that key does not record whether the event is an RFI or an RFP.

## Layer Impact

`global-control-lane`, Layer 4 product UI only. No schema, migration, adapter, canonical object, projection or route change. The new module is a pure function library with no I/O.

## Client Applicability

- All clients: Source New event workspace users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/new-workspace/phase-state.ts` (new): phase order, phase-state resolution from evidence, operator stage labels.
- `src/components/source/new-workspace/SourceNewWorkspace.tsx`: rail badges, work-body copy and next-action detail now read the shared resolver; phase evidence is derived from recorded event facts and the files filed against each phase.
- Tests for both, including mutation checks.

No product surface gained a completion or approval claim. "Recorded" states that something exists in a phase; it does not assert that the phase was completed, approved or released, and this surface reads no approval record.

## QA / Validation

- `src/lib/source/new-workspace` and `src/components/source/new-workspace`: 46 tests passed across 5 suites.
- Mutation checks on the new guard: ignoring evidence in the behind-phase branch failed 5 tests; restoring the positional "locked" answer for unplaced events failed 3 tests.
- Scoped ESLint: clean. Full-project `tsc --noEmit`: clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: see PR.
- Signed-in acceptance on the deployed build: pending.

## Rollout Plan

Squash-merge after required checks pass; the repo-owned ACA main deploy workflow publishes the change. No migration and no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: On an event in the market-package phase with no supplier artifact, the Suppliers & NDA badge reads "No record"; on an event past these phases, no badge reads "Later" and the stage note names the current stage; no rail badge anywhere reads a raw stage key.

## Rollback Plan

Revert this UI change through a new PR and the repo-owned deploy workflow. Nothing persisted changes, so revert is immediate and lossless.

## Audit Evidence

PR link, focused test output, mutation results, CI, and ACA digest/invariant proof to be added when available.

## Known Gaps

- Phase evidence is derived from event facts and filed artifacts because the workflow authority does not yet persist per-phase activation or an accepted solicitation motion. When those fields land, this resolver should read them instead of inferring presence, and a completion claim should come from an approval record rather than from evidence of any kind.
- No signed-in browser proof yet.
