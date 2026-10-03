# 2026-09-28-source-trigger-evidence-provenance — Keep intake narrative distinct from source evidence

## Release ID

`2026-09-28-source-trigger-evidence-provenance`

## Status

`released`

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
- The Continue summary uses the same provenance rule and displays an unlinked
  trigger as `Not loaded`, rather than echoing a stale `Available` state.
- Regression coverage exercises legacy repair, artifact preservation, gate
  blocking, the unlinked parsed-trigger upload queue, and the rendered evidence
  status in both the Files checklist and Continue summary. One pre-existing
  readiness fixture now includes the artifact link its `Parsed` state claimed
  to have.

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
- **PASS:** PR #8642 merged at `a1ebd9316b12025622d47b9667b01fa5191a1240`;
  required PR checks passed.
- **PASS:** ACA run `36492521182` deployed that exact SHA. The template image,
  100%-traffic revision, and both worker jobs read back at
  `sha256:595a699f703bf30bb1255cfade2e29c40542a4fb4a652751471a5635142dee27`;
  workflow runtime invariant and health checks passed.
- **PASS:** Signed-in browser verification confirmed the Files checklist shows
  the trigger as `NOT LOADED`, evidence readiness is 0/3, and approval remains
  locked. This also exposed the separate stale `Now: Available` summary, which
  this follow-up change corrects.
- **PASS:** Follow-up PR #8644 corrected the Continue summary and updated its
  regression expectation. All required PR checks passed, including the
  13m33s behavior coverage floor; the Source canvas suite passed 60 suites /
  320 tests, and local lint, typecheck, release check, and coverage census
  checks passed.
- **PASS:** Follow-up deployment run `36496129488` deployed merge SHA
  `37ae78862a6af2677b3a22e81b4c5cfcbd98af3c`. The repo-owned runtime
  invariant and health checks passed.
- **PASS:** Fresh signed-in verification showed the Continue summary as
  `Now: Not loaded`; the Files ledger still marks the unlinked requirement
  `NOT LOADED`, keeps upload available, and leaves approval locked. No evidence
  was uploaded, accepted, or approved during verification.

## Rollout Plan

Merge through the normal PR path. The repo-owned ACA main deploy workflow builds
and deploys the merged SHA. The corrected display and gate logic apply on
deployment. Exact legacy rows are repaired through the existing event-intake
correction or gate-criteria workflow when that workflow is next used; no direct
database edit or batch migration is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- First deployed SHA: `a1ebd9316b12025622d47b9667b01fa5191a1240`.
- First deployed image digest: `sha256:595a699f703bf30bb1255cfade2e29c40542a4fb4a652751471a5635142dee27`.
- Follow-up deployed SHA: `37ae78862a6af2677b3a22e81b4c5cfcbd98af3c`.
- Follow-up image digest: `sha256:c4256f1cab69d9a5dde7a43a2699b56dba7e521a6caa2b238c3062465b25c23e`.
- Follow-up revision: `ca-abarva-web-lab-eastus--m37ae7886` at 100% traffic.
- ACA runtime invariant: passed for both deployments; for the follow-up,
  template, active revision, and traffic target use the follow-up digest.
- Worker image invariant: passed for both deployments; both worker jobs read
  back at the follow-up digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; verify both the Files checklist and
  Continue summary avoid showing an unlinked trigger as ready, and the Strategy
  gate remains blocked.

## Rollback Plan

Revert the squash commit through a normal PR. No migration rollback is needed.
Rows repaired to `Not Requested` remain open and can be satisfied through the
normal source upload and evidence-review path.

## Audit Evidence

- First-fix PR: #8642; merged SHA `a1ebd9316b12025622d47b9667b01fa5191a1240`.
- First-fix deploy run: `36492521182`.
- Follow-up PR #8644; merge SHA `37ae78862a6af2677b3a22e81b4c5cfcbd98af3c`.
- Follow-up deploy run `36496129488`; image digest
  `sha256:c4256f1cab69d9a5dde7a43a2699b56dba7e521a6caa2b238c3062465b25c23e`.
- Follow-up signed-in verification: Continue summary `Now: Not loaded`; Files
  checklist `NOT LOADED`; upload available; approval locked.

## Known Gaps

- The repair is lazy: a legacy row is normalized on the next event-intake
  correction or gate-criteria workflow, not by a global migration.
- Existing unlinked legacy rows may still store `Available` until that repair
  path runs; all readiness and UI projections must continue to fail closed.
- This change does not supply the required source file or satisfy other open
  Strategy evidence requirements. It prevents narrative from being mistaken
  for that file and preserves the intended evidence blocker.
