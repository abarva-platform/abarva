# 2026-10-03 — Moves P1 Evidence Routing

## Release ID

`2026-10-03-moves-p1-evidence-routing`

## Status

`candidate`

## Plain-English Summary

P1 working uploads are no longer inferred into KPI-baseline or approval families from generic words such as “baseline” or “decision.” The uploader may optionally route a file to a required evidence family; the server validates that choice against the Move's discovery blueprint. Uploads remain pending human review, and routing alone does not satisfy evidence or approve a gate.

## Layer Impact

- **Release lane: `global-control-lane`.**
- **Layer 4 — Products / Moves:** P1 upload classification and the upload control's optional evidence-family routing are updated. Original file content, readiness rules, and gate criteria are unchanged; previously stored records are untouched.

## Client Applicability

- All clients: Moves P1 workspace uploads.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Phase-aware P1 evidence classification and conservative unassigned review-family fallback.
- Optional uploader-declared evidence-family routing, validated by the existing API contract.
- Regression tests for proposal/evidence-plan distinctions, routing precedence, and pending-review upload behavior.

## QA / Validation

- `npx jest src/lib/programs/__tests__/uploaded-move-evidence-classification.test.ts src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand --silent` — passed.
- ESLint on changed files — 0 errors; 2 existing warnings in `MovesPhaseStandaloneClient.tsx`.
- `npx tsc --noEmit` — local Node process ran out of heap and exited 134 before reporting diagnostics; CI typecheck remains authoritative.
- `git diff --check` — passed.
- `npm run release:check --base origin/main --head HEAD` — pending.
- No live deployment or signed-in proof is claimed by this candidate record.

## Rollout Plan

Merge through a squash PR to `main`; the repo-owned ACA main deploy workflow is the only production rollout path. Verify the deployed image invariant and signed-in Moves P1 upload behavior before calling the change live-proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending deployment.
- ACA runtime invariant: Pending deployment verification.
- Worker image invariant: Confirm against the approved digest during deployment verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes; confirm both unassigned P1 review and explicitly routed review states without approving evidence.

## Rollback Plan

Revert the merged change through a follow-up PR and deploy it through the repo-owned ACA main deploy workflow. No schema migration or stored evidence rewrite is included.

## Audit Evidence

- PR and CI results: Pending.
- Live signed-in evidence: Pending; no production state change has been made.

## Known Gaps

Existing review rows are not rewritten by this change. They remain pending and must be reviewed or corrected through an auditable product workflow; no evidence is auto-approved, reclassified in place, or promoted to a gate.
