# 2026-07-23-moves-deliverable-supersession — Fix deliverable regeneration proliferation

## Release ID

`2026-07-23-moves-deliverable-supersession`

## Status

`candidate`

## Plain-English Summary

A live inspection of a real sandbox Move's Files & Evidence vault found 53 deliverables where
there should have been far fewer — every Approve & Build re-run of a phase created a brand-new
titled deliverable instead of superseding the prior draft. Roughly 15+ near-duplicate "Target
Architecture" entries existed, each under a different model-authored title, with the same
pattern for Sourcing Strategy, Operating Model, and Solution Design. Root cause: the insert
function that persists a generated deliverable (`saveGeneratedArtifact`) never looked up whether
a deliverable of the same logical type already existed for that Move before inserting — it was
a pure INSERT with no dedup step. The database already had a `superseded_by` column and the
front-end (`FileCabinetPanel.tsx`, `MovesPhaseStandaloneClient.tsx`) already filters/dims
superseded artifacts — but `superseded_by` was never set by any live write path, so the
filtering had nothing to act on. This fix adds the missing step: after a new deliverable is
saved, any prior still-active artifact of the same client + Move + canonical
`deliverableTypeKey` is marked `superseded_by` the new one.

## Layer Impact

- **Data-plane, additive only.** No schema change — `generated_artifacts.superseded_by` already
  existed. `src/lib/artifacts/repository.ts`: `saveGeneratedArtifact` now calls a new
  best-effort `supersedePriorDeliverableVersions()` step after a successful insert. A failure in
  this step never fails the save that already succeeded (matches the existing
  `recordContextRefreshEvent` best-effort pattern in the same function). No changes to
  `evaluateGate()`/gate logic, no changes to generation content, no UI changes — the UI already
  reads and filters on `superseded_by`, it was just always null.

## Client Applicability

- All clients: yes — this is shared deliverable-persistence infrastructure, not tenant-gated
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none — this is a correctness fix to existing, always-on behavior

## Changes Included

- `src/lib/artifacts/repository.ts` — new `supersedePriorDeliverableVersions()` function; wired
  into `saveGeneratedArtifact` as a best-effort post-insert step
- `src/lib/artifacts/__tests__/repository.test.ts` — extended the mock Postgres builder to
  support `.contains()`/`.is()`/`.in()`/`.update()` and an awaitable (thenable) bare-chain
  result; new test covering: same-type regeneration supersedes the prior version; a different
  Move's artifact is never touched; a different deliverable type for the same Move is never
  touched

## QA / Validation

- `npx eslint src/lib/artifacts/repository.ts src/lib/artifacts/__tests__/repository.test.ts`:
  clean
- `npx jest src/lib/artifacts`: 5/5 passing (2 pre-existing + 3 new assertions in the new test)
- `npx jest src/lib/deliverables/orchestrator`: 204/204 passing — zero regressions in the
  broader orchestrator/persistence pipeline that calls `saveGeneratedArtifact` indirectly
- `git diff --check`: clean
- Root cause verified against a real, live sandbox Move (`4bf889aa-d4ee-4c1d-936b-51574614d191`,
  "Codex Proof First Capital E2E 20260721") — 53 deliverables observed live in Files & Evidence
  before this fix, with the specific near-duplicate title pattern documented in this session's
  handoff report

## Rollout Plan

1. Merge to `main` via the repo-owned ACA deploy workflow.
2. No flag/tenant change — takes effect for every future deliverable generation immediately on
   deploy.
3. Live signed-in verification: trigger a real regeneration of an already-generated deliverable
   type on the sandbox Move and confirm the prior version is marked superseded and disappears
   from the default (non-"show superseded") Files & Evidence view.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none directly
- Approved image digest: produced by the standard `aca-main-deploy` run for this merge SHA
- ACA runtime invariant: verify template image = 100%-traffic revision image post-deploy
- Worker image invariant: n/a (this path runs in the web request path and the durable worker
  that invokes the same shared `saveGeneratedArtifact`; confirm worker image also matches if
  the worker job pulls a separate image)
- Feature/env flag update path: none
- Live signed-in proof required: yes — see Rollout Plan step 3; not yet completed as of this
  record

## Rollback Plan

Revert the merge commit. The fix only adds a post-insert UPDATE step; reverting removes it and
returns to pure-insert behavior. No data cleanup is required for rollback (already-set
`superseded_by` values on existing rows are harmless to leave in place either way).

## Audit Evidence

- PR: (added at merge time)
- Backlog item: to be recorded in `docs/backlog/moves-product-backlog.md` as a new
  `MOVES-CAPABILITY-002` entry
- Live proof of the problem before this fix: Files & Evidence listing for Move
  `4bf889aa-d4ee-4c1d-936b-51574614d191`, captured 2026-07-23 (53 deliverables, ~15+ duplicate
  Target Architecture titles)

## Known Gaps

- This fix prevents FUTURE proliferation. It does **not** retroactively clean up the 53 existing
  duplicate rows already in the sandbox Move's vault — that would require a separate, explicitly
  scoped backfill/cleanup pass (grouping existing rows by client+Move+deliverableTypeKey and
  marking all but the newest as superseded), which is out of scope for this fix and not
  something to run against real data without its own review.
- `deliverableTypeKey` is read from the `metadata` JSONB column (it is not an indexed column).
  For very high deliverable volume this is a full-table JSONB containment scan per save; fine at
  current Moves volume, worth revisiting with an index if deliverable volume grows substantially.
- Live signed-in regeneration proof (Rollout Plan step 3) has not yet been captured as of this
  record.
