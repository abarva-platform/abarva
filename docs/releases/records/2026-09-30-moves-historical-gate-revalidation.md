# 2026-09-30-moves-historical-gate-revalidation — Revalidate completed phase gates

## Release ID

`2026-09-30-moves-historical-gate-revalidation`

## Status

`candidate`

## Plain-English Summary

The Moves phase workspace derived historical completion from the saved phase
position and evidence revision, but did not re-evaluate the completed phase's
hard gate before rendering it as approved. A deliverable could therefore
become unverified while the earlier phase still appeared complete.

The workspace now re-evaluates every completed prior phase against its current
hard-gate rules. It returns the effective phase to the earliest blocked or
unverifiable gate without changing stored phase state. When a phase is
reopened, its criteria are evaluated in historical mode so the workspace can
show the actual blockers.

## Layer Impact

**Release lane: `global-control-lane`.**

- **Layer 4 (Products):** Moves phase navigation and gate status now reflect
  current hard-gate validity as well as the saved phase position and global
  approved-evidence revision.
- **Layers 1–3:** No intake, adapter, canonical-model, or schema changes.

## Client Applicability

- All clients: yes, for Moves phase navigation and gate status
- Specific clients: none
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- The Moves phase workspace revalidates completed prior gates before projecting
  the effective current phase.
- Reopened prior-phase gate criteria are evaluated with historical-phase
  validation enabled.
- Regression coverage proves that a current evidence hash does not mask a
  blocked prior hard gate.

## QA / Validation

- Red-first regression: the new historical-gate assertion failed before the
  resolver existed and passes with the gate validation in place.
- Focused suites: 4 suites, 79 tests passed, including phase evidence binding,
  phase-gate approval route, governance gate evaluation, and transformer
  criteria.
- Typecheck: clean using the repository typecheck script and Node 24.
- ESLint: clean on all five changed TypeScript files.
- Signed-in runtime proof: pending merge and deployment.

## Rollout Plan

Merge through the protected-branch PR path. Deploy the merged `main` SHA only
through the repo-owned ACA main deploy workflow. Verify the exact workflow run,
100% traffic revision, template image and both required worker job images before
the signed-in synthetic Moves proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow
- Approved image digest: pending deployment
- ACA runtime invariant: pending exact-SHA verification
- Worker image invariant: pending exact-SHA verification
- Feature/env flag update path: none
- Live signed-in proof required: **yes**; verify a stale completed hard gate
  reopens the earliest affected phase and cannot advance until current outputs
  satisfy it

## Rollback Plan

Revert the PR through the protected-branch workflow and redeploy the resulting
`main` SHA through the repo-owned ACA workflow. No data migration or stored
phase-state repair is required.

## Audit Evidence

- Pull request and its CI checks (pending)
- Focused local test, typecheck, and lint results recorded above
- Exact-SHA ACA workflow and image-invariant proof (pending)
- Signed-in synthetic phase-gate readback (pending)

## Known Gaps

The end-to-end synthetic journey has not yet been resumed through P5. This
change closes the phase-rendering gap; subsequent journey defects remain in
scope for the autonomous smoke loop.
