# Moves PPTX Content Quality — Release Candidate

## Release ID

`2026-10-01-moves-pptx-content-quality`

## Status

`candidate`

## Plain-English Summary

Generated PowerPoint files are checked for substantive slide content before they are persisted, downloaded, or accepted as reviewed deliverables. When authored slide content is only placeholder text, the renderer may rebuild slides from the same generated document sections; it does not add claims or facts. If the resulting deck still fails the content check, the operation is blocked with a quality error.

## Layer Impact

- **Release lane:** `global-control-lane` — generated presentation delivery behavior shared by Moves users.
- **Products:** Moves-generated presentation projection only. The change does not create or own canonical facts.
- **Source adapters / canonical model:** No changes.

## Client Applicability

- All clients receiving generated PPTX deliverables.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Validated PPTX rendering can fall back from thin authored slides to generated document sections.
- PPTX persistence, download, and generated-draft acceptance fail closed when content quality remains below the existing deck contract.
- Regression tests cover placeholder slides, valid section fallback, and blocked delivery/acceptance.

## QA / Validation

- Focused Jest suites: 5 suites, 81 tests passed.
- Focused ESLint: passed.
- TypeScript check: pending.
- Release check: pending.
- Browser artifact verification: pending deployment.

## Rollout Plan

Merge through the protected main-branch PR path. Production activation requires the repo-owned ACA main deploy workflow and exact-SHA runtime verification. No database migration or feature-flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: pending deployment.
- ACA runtime invariant: pending exact-SHA deployment.
- Worker image invariant: pending exact-SHA deployment.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, verify a generated PPTX export and its fail-closed quality response on the deployed build.

## Rollback Plan

Use the repo-owned ACA main deploy workflow to redeploy the prior approved main revision. The check is fail-closed: if quality evaluation cannot establish a valid deck, delivery or acceptance is blocked rather than bypassed.

## Audit Evidence

- PR and CI evidence: pending.
- Exact-SHA ACA run and digest evidence: pending.
- Synthetic signed-in artifact export evidence: pending.

## Known Gaps

This change validates generated slide substance and physical integrity. It does not certify that narrative claims are factually correct; evidence lineage and claim validation remain governed by their existing contracts.
