# 2026-07-15-meridian-html-quality-accuracy — Meridian HTML Guide Quality Accuracy

## Release ID

`2026-07-15-meridian-html-quality-accuracy`

## Status

`candidate`

## Plain-English Summary

Updates the Meridian data-state reconciliation proof HTML and supporting audit output so the guide is more accurate and easier to verify. The audit script now produces an explicit HTML quality/accuracy report alongside the reconciliation proof.

## Layer Impact

- `public-demo`: Meridian proof/report artifacts used for demo-readiness review are updated.
- `internal-admin`: The audit script that generates the Meridian reconciliation report is updated for clearer quality and accuracy checks.

## Client Applicability

- All clients: No.
- Specific clients: Meridian Health demo/readiness materials.
- Internal only: No.
- Public/demo only: Yes.
- Feature flag: None.

## Changes Included

- `scripts/audit/meridian-data-state-reconciliation.mjs`
- `reports/demo-readiness/meridian-data-state/meridian-data-state-reconciliation-proof.html`
- `reports/demo-readiness/meridian-data-state/html-quality-accuracy-audit.md`
- `reports/demo-readiness/meridian-data-state/html-quality-accuracy-audit.json`
- `reports/demo-readiness/meridian-data-state/source-inventory.csv`
- `reports/demo-readiness/meridian-data-state/summary.json`

## QA / Validation

- Pass: GitHub checks from the original stacked PR before retargeting.
- Pending: refreshed release-control check after direct-to-main retarget.

## Rollout Plan

Merge through the protected PR path. No runtime deployment is required for report-only artifacts unless bundled with a later ACA release.

## Deployment Authority

- Repo-owned deploy workflow: Not required for this report-only slice.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the PR to restore the prior Meridian reconciliation report and audit script.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4831
- Report artifacts under `reports/demo-readiness/meridian-data-state/`.

## Known Gaps

- This is a proof/report quality update only; it does not change live runtime behavior.
