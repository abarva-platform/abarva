# 2026-10-10 — Moves step-page scaffold and sunset routing

## Release ID

`2026-10-10-moves-step-pages-scaffold-p0145`

## Status

`candidate`

## Plain-English Summary

The phase workflow now declares the P0, P1, P4 and P5 steps and their existing
capture keys. A shared mount gives each future step page the same phase and
step navigation, saved answers, prior-phase context, aVa dock and governed gate
path. Two tenant flags limit the new mounts to the synthetic demo cohort.

The phase address switches to step pages only when every step in that phase
has an implemented page. During the transition, missing pages point to their
own capture section. The old flow remains available through an unlinked
`?legacy=1` hatch. A sunset ledger records what still needs removal.

## Layer Impact

- Release lane: `experimental` (tenant-gated product projection).
- Product projection: Moves workflow registry, phase workspace composition and
  navigation. Existing capture keys, autosave, evidence and approval routes are
  reused.
- Canonical model and data plane: no schema, data, loader or tenant mutation.
- Governance: gate checks remain sourced from the evaluator. P0 origination
  approval remains separate from document builds; capture answers do not clear
  seed checks.

## Client Applicability

- All clients: workflow definitions and shared code are present, but new mounts
  require opt-in flags.
- Specific clients: only the synthetic demo cohort is enrolled.
- Internal only: no.
- Public/demo only: no.
- Feature flags: `moves_step_pages_p0p1_v1` and
  `moves_step_pages_p4p5_v1`, each requiring `moves_step_pages_v3` and
  `moves_capture_v2`.

## Changes Included

- Declared 19 steps and their capture ownership across P0, P1, P4 and P5.
- Added 19 view identifiers and four phase-owned component slots, plus a
  generic host mount and a shared gate-props contract.
- Added per-phase default routing, missing-page capture links, and an unlinked
  legacy hatch; documented old surfaces in the sunset ledger.
- Generalized gate-step mounting while retaining P0's reviewed-source and
  authorized-origination approval path.

## QA / Validation

- PASS: six targeted registry, routing, capture-flow, gate and host suites;
  451 tests after the final host-mount assertions.
- PASS: TypeScript typecheck and changed-file ESLint.
- PASS: eight one-by-one mutation probes covering capture-key ownership, view
  census, complete-phase switch, section fallback, feature guards, legacy
  hatch and P0 reviewed-evidence precondition; all eight were detected and
  restored, with zero survivors.
- PASS: library-orphan, route-reachability and export-reachability audits.
- PASS: test-coverage and tenancy-fence censuses; one new test suite accounted
  for in the coverage baseline.
- PASS: manual regeneration/check and release-record check.
- PASS: local gate-page visual render at 1440px and 390px, light and dark, with
  no horizontal overflow. The fixture omits the host-provided aVa rail and
  tabs; the shared page regions and tokens were compared with the template.

## Rollout Plan

Open a reviewed PR against `main`. The repository-owned main deploy workflow
will carry the merged candidate to the shared runtime. The new phase flags
do not switch a phase to step pages until its slots are populated by later
releases. Record a signed-in walk before marking an old surface hatch-only or
removing it.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the deploy workflow after merge.
- ACA runtime invariant: required before any deployed or live claim.
- Worker image invariant: unchanged by this PR; verify with any deployment.
- Feature/env flag update path: tenant-policy registry through a reviewed PR.
- Live signed-in proof required: yes, after the phase pages are implemented.

## Rollback Plan

Disable either new phase flag for the affected cohort to restore the capture
flow for that phase. Revert the PR if the shared registry or host contract needs
to be removed. No data rollback is required.

## Audit Evidence

- Branch: `feat/moves-step-pages-scaffold-p0145`.
- PR and CI: recorded with the review request.
- Local test and audit output: captured in the PR validation summary.
- Sunset ledger: `docs/build/moves-legacy-sunset.md`.

## Known Gaps

- The P0/P1/P4/P5 page slots are intentionally empty; their pages ship in
  subsequent scoped releases, so no new phase defaults to them yet.
- A signed-in runtime walk and legacy-surface removal remain pending.
- The P2/P3 phase-wide switch waits on their own remaining step pages.
