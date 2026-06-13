# 2026-06-13-moves-source-e2e-audit — Moves + Source E2E Audit Report

## Release ID

`2026-06-13-moves-source-e2e-audit`

## Status

`candidate`

## Plain-English Summary

Adds the lab QA audit report for the post Workspace Explorer + Doc-Gen build. The audit records what was proven on the live ACA lab revision, which Source checks passed, and why the Moves end-to-end proof is blocked by a missing SkyHarbor airline Function Pack binding rather than a simple UI bug.

## Layer Impact

- `public-demo`: documents buyer/demo readiness evidence and screenshots for Source and Moves.
- `internal-admin`: records lab deployment, private DB, and Log Analytics evidence for engineering follow-up.

No runtime code, schema, or data-plane behavior changes are included.

## Client Applicability

- All clients: none.
- Specific clients: SkyHarbor lab/demo evidence only.
- Internal only: engineering and founder review.
- Public/demo only: the report can be used as a demo-readiness evidence artifact after review.
- Feature flag: no feature flags are changed by this PR.

## Changes Included

- `docs/build/E2E_AUDIT_2026-06-13.md`
- This release record.

## QA / Validation

Validation captured in the report:

- Pass: ACA serving revision mapped to image and git SHA.
- Pass: Source Workspace Explorer rendered against `https://app.abarva.ai`.
- Pass: Source generate route returned API 200 and persisted a draft `source_artifacts` row in the private data plane.
- Blocked: Moves Workspace Explorer rendered but produced zero generate candidates.
- Pass: Private DB evidence confirmed the target SkyHarbor Move has `GLOBAL_NETWORK_AIRLINE` with no `function_pack_key`.
- Pass: Local code inspection confirmed no airline/global-network-airline Function Pack is present.
- Pass: ACA migration job template was restored after DB inspection.
- Not run: Source D09 RFP generation, approval/gate-advance, lineage-render, and artifact leak scan.

## Rollout Plan

Merge the docs PR. No Azure deployment, data migration, or feature-flag change is required.

## Rollback Plan

Revert the docs commit if the audit report needs to be withdrawn or replaced.

## Audit Evidence

- Report: `docs/build/E2E_AUDIT_2026-06-13.md`
- Screenshots: `~/Downloads/abarva-e2e-audit-2026-06-13/screenshots/`
- Raw crawl output: `~/Downloads/abarva-e2e-audit-2026-06-13/raw/`
- ACA revision: `ca-abarva-web-lab-eastus--mc6d9fb0c`
- Image: `acrabarvalab001.azurecr.io/abarva/web:main-c6d9fb0cf`

## Known Gaps

The full converged Moves + Source DoD is not green. Moves is blocked until SkyHarbor has a real airline/global-network-airline Function Pack and approved function-pack binding. Source still needs the D09 RFP, approval/gate-advance, lineage-render, and leak-scan portions of the audit completed.
