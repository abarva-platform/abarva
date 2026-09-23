# 2026-09-22 Source Request Version-Bound Approval

## Release ID

`2026-09-22-source-request-version-bound-approval`

## Status

`candidate`

## Plain-English Summary

Source event intake approval now refers to the exact immutable Request version
that the reviewer saw. Event creation writes the first Request version,
governed intake corrections supersede it in the same database transaction as
the event update, and the approval action fails closed if the page carries a
stale or unavailable version.

## Layer Impact

- Release lane: `global-control-lane`.
- Canonical model: writes and supersedes immutable Request authority versions,
  and appends a named approval receipt against the exact current version.
- Source product: the mounted approval page reads the current version ID and
  carries it through the approval action. Missing authority disables approval.

## Client Applicability

- All clients: yes, where Source event intake approval uses the canonical Azure
  data plane.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Request authority payload projection shared by create, edit, and approval.
- Transactional authority version writer with deterministic content hashing.
- Atomic intake-correction plus Request-version supersession on Azure Postgres.
- Exact-current-version check and named Request acceptance in the approval
  transaction.
- Event-then-version row locking shared with the intake-correction writer, so
  concurrent corrections serialize with an approval of the exact current version.
- Mounted approval page and card fail-closed behavior.

## QA / Validation

- Node.js 24 focused Jest suites: 8 suites / 112 tests passed across the
  authority store, event create/edit routes, mounted approval component,
  approval route, gate persistence, and Source write adapter.
- Concurrency regression on the Azure write adapter: 40 passed / 1 failed
  before the row lock; 41 passed / 0 failed after. A coordinated competing
  edit committed before approval in the failing run and only after approval
  when the current-version row was locked.
- Lock-order regression: 2 focused cases failed before approval acquired the
  event row ahead of the version row; the adapter suite passed 41 / 41 after
  matching the intake-correction transaction's order.
- TypeScript project validation: clean on Node.js 24.
- Mutation proof: removing the stale-page version comparison makes the stale
  Request route test fail; removing the write-adapter current-version check
  makes the no-lifecycle-mutation test fail. Removing `FOR UPDATE` from the
  transactional current-version read makes the new concurrency test fail at
  `editCommittedAtApprovalCommit` (expected false, received true).
- Scoped ESLint and `npm run release:check` passed.

## Rollout Plan

Squash merge only after applicable CI is green. Deployment, runtime proof, data
readback, and signed-in acceptance remain separate later steps and are not part
of this candidate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this candidate.
- Approved image digest: pending deployment.
- ACA runtime invariant: pending deployment.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the squash commit and redeploy the prior digest through the repo-owned
workflow. This candidate changes no migration and mutates no tenant data during
release preparation.

## Audit Evidence

- Pull request and CI links will be attached after the candidate is opened.
- Focused Jest, typecheck, lint, release-check, and mutation outputs are
  captured in the PR validation summary.

## Known Gaps

- Strategy authority still needs an explicit product decision that maps named
  business-owner and procurement-lead roles; this change does not infer them
  from generic approval rights.
- The applied schema uniquely indexes an event/kind/content hash. Reverting a
  Request to content used by a superseded version therefore needs a separate
  schema decision before it can satisfy the rule that every material edit
  creates a new version. This candidate fails closed on that conflict and does
  not alter migrations.
- Event creation and first Request-version creation are retry-safe but are not
  one database transaction because the existing event creator is outside the
  Source write-adapter transaction. A failed version write leaves approval
  disabled until an idempotent create retry repairs the version.
