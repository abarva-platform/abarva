# 2026-09-28-source-trigger-evidence-provenance — Keep intake narrative distinct from source evidence

## Release ID

`2026-09-28-source-trigger-evidence-provenance`

## Status

`candidate`

## Plain-English Summary

The Strategy trigger asks for a source record or export. Previously, entering a
trigger description during event intake could mark that requirement `Available`
without linking a source artifact. The Files checklist then presented the row as
uploaded and ready, even though no file existed. Intake narrative now remains
context only; this requirement needs linked source provenance, the checklist
shows an unlinked row as not loaded, and the stage gate keeps it open. A narrow
repair also resets rows created by the former behavior without touching linked
or reviewed evidence.

## Layer Impact

Release lane: `global-control-lane` with a narrow `client-data-lane` repair.

- **Layer 4 (Products):** Source readiness and checklist rendering now agree
  with source provenance. No schema, tenant dataset, or generated artifact
  contract changes.
- **Client data:** Only legacy Strategy trigger rows carrying the exact old
  intake-sync note, `Available` state, and no source artifact are repaired to
  `Not Requested`. Other evidence rows are unchanged.

## Client Applicability

- All clients: the corrected evidence rule applies to Source Strategy events.
- Specific clients: none; repair is scoped by event, tenant, requirement, and
  the exact legacy row signature.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Source intake reconciliation no longer promotes typed trigger descriptions
  or creates evidence rows from narrative; it repairs only the legacy
  narrative-only state.
- Strategy trigger readiness requires a linked source artifact or cited event
  fact; human review alone cannot turn unlinked narrative into record evidence.
- Files checklist labels unlinked trigger state as `not loaded`, keeps the
  upload action available, and leaves the item open.
- Regression coverage exercises legacy repair, artifact preservation, gate
  blocking, the unlinked parsed-trigger upload queue, and the rendered evidence
  status. One pre-existing readiness fixture now includes the artifact link its
  `Parsed` state claimed to have.

## QA / Validation

- **PASS:** The planted pre-fix regressions failed for the intended reasons:
  narrative promoted to `Available`, legacy state not repaired, and human review
  allowed unlinked narrative to satisfy the gate.
- **PASS:** Intake, governance, API route, and evidence-checklist regressions:
  5 suites / 53 tests.
- **PASS:** Wider Source gate and readiness slice: 6 suites / 66 tests,
  including automatic gate assessment, stage progression, requirement coverage,
  and gate-advance contract tests.
- **PASS:** `eslint` on all changed TypeScript files.
- **PASS:** `tsc --noEmit` with the repository-prescribed Node 24 runtime.
- **PASS:** `audit:test-ci-coverage:write` and `audit:test-ci-coverage:check`;
  generated census matches the base.
- **PASS:** `node scripts/release-check.mjs --base origin/main --head HEAD`.
- **NOT RUN:** PR CI, deployed runtime proof, and signed-in production
  verification; these remain release gates.

## Rollout Plan

Merge through the normal PR path. The repo-owned ACA main deploy workflow builds
and deploys the merged SHA. The corrected display and gate logic apply on
deployment. Exact legacy rows are repaired through the existing event-intake
correction or gate-criteria workflow when that workflow is next used; no direct
database edit or batch migration is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending the exact merged-SHA deploy run.
- ACA runtime invariant: not yet verified.
- Worker image invariant: not yet verified.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; verify the trigger is not shown as
  uploaded/available without linked provenance and the Strategy gate remains
  blocked.

## Rollback Plan

Revert the squash commit through a normal PR. No migration rollback is needed.
Rows repaired to `Not Requested` remain open and can be satisfied through the
normal source upload and evidence-review path.

## Audit Evidence

- PR and exact merged SHA: pending.
- CI workflow results: pending.
- ACA deploy run and digest verification: pending.
- Signed-in evidence-checklist proof: pending.

## Known Gaps

- The repair is lazy: a legacy row is normalized on the next event-intake
  correction or gate-criteria workflow, not by a global migration.
- This change does not supply the required source file or satisfy other open
  Strategy evidence requirements. It prevents narrative from being mistaken
  for that file and preserves the intended evidence blocker.
