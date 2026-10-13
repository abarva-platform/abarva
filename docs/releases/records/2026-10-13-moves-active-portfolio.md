# 2026-10-13-moves-active-portfolio - Active portfolio scope

## Release ID

`2026-10-13-moves-active-portfolio`

## Status

`candidate`

## Plain-English Summary

The redesigned Moves landing now requests non-archived records before deriving
its headline, declared-value summary, decision cards, table and reconciliation.
Archiving a Move therefore removes it from the active landing without deleting
its history. Manage Moves remains the recovery surface. Completed, non-archived
Moves remain in the table but are not counted as in flight.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, product projection: select the existing active portfolio read scope
  when the redesigned landing is enabled. No canonical objects, intake,
  adapters, lifecycle mutations, authorization rules or schema are changed.

## Client Applicability

- All clients: tenants using the redesigned Moves landing.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing `moves_home_v2`; no flag changes. The legacy landing
  retains its all-record read because it has an explicit Archived filter.

## Changes Included

- `src/app/(maestro)/strategic-moves/page.tsx`: resolve the existing feature flag
  before querying the portfolio; include archived rows only for the legacy view.
- `src/lib/programs/__tests__/moves-home-active-portfolio.test.tsx`: invoke the
  host with mocked read boundaries and render the real synchronous landing to
  verify archive exclusion, empty active scope, restoration and legacy behavior.
- Regenerated test coverage census; the new suite is covered by the existing
  Programs directory sweep in AI surface control catalog.

## QA / Validation

- Red first: two of four new cases failed on the old host's all-record query.
- Broad Programs and Moves-home suites: 254 suites / 4,214 tests passed.
- Mutation proof: forcing `includeArchived: true` again failed two cases;
  the active-only implementation was restored before the broad passing run.
- ESLint on the changed host and test passed.
- TypeScript passed with Node 24 and an 8 GB heap; the default-heap attempt
  exhausted memory. All 11 release checks passed.
- These are local code proofs, not evidence of shared runtime or live data.

## Rollout Plan

Squash merge through a PR, then let `.github/workflows/aca-main-deploy.yml`
build and deploy main. No migration, reload, archive operation or feature update
is needed. Independently verify the runtime invariant and compare the signed-in
landing's visible IDs with Manage Moves' active IDs and archived recovery list.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: produced by the main workflow; capture privately after
  deployment, not known at candidate creation.
- ACA runtime invariant: digest-pinned template and single healthy 100%-traffic
  revision must match the approved image.
- Worker image invariant: all workers enforced by the deploy must match.
- Feature/env flag update path: not used.
- Live signed-in proof required: landing rows, headline and value denominator;
  active IDs and archive recovery remain consistent in Manage Moves.

## Rollback Plan

Revert this projection change through a PR and deploy main through the same
workflow. No database rollback is involved. Archived records and their evidence
remain recoverable regardless of the UI release.

## Audit Evidence

Regression suite and this record are public-safe code evidence. Test results,
mutation output, runtime proof and signed-in screenshots are kept privately by
the operator; no tenant names or record payloads belong in this release record.
PR, main deploy and live-proof status must be reported separately.

## Known Gaps

This does not certify any Move's readiness, declared value or business case.
It changes neither the existing 100-record query limit nor the legacy view's
filter controls. Shared deploy and signed-in proof are pending at creation.
