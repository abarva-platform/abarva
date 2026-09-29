# 2026-09-29 Moves Deliverable Lineage Schema

## Release ID

`2026-09-29-moves-deliverable-lineage-schema`

## Status

`candidate`

## Plain-English Summary

Add the nullable structured-metadata column required for generated-artifact approval lineage on the authoritative Moves deliverable row. Existing rows are unchanged; the metadata is written only when a reviewer accepts a generated artifact.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Moves: enables the existing client-approval flow to record accepted artifact and evidence-revision lineage on the row evaluated by the phase gate.
- Layer 3: no canonical business facts or objects are added. The migration adds nullable metadata to the governed deliverable record and does not backfill or infer historical approvals.
- Layers 1 and 2: no intake or adapter changes.

## Client Applicability

- All clients: yes, for generated Moves deliverable approval.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add nullable `deliverables_v2.structured_data` JSONB metadata.
- Preserve verified generated-artifact ID, approval mode, and evidence revision on the authoritative deliverable row.
- No data backfill, approval-policy change, or client-content mutation.

## QA / Validation

- Pass: focused approval-route, sign-off mutation, and gate suites from the preceding application change, 49/49.
- Pass: live signed-in upload reproduced the missing-column failure before this migration.
- Pass: full migration replay from zero against disposable PostgreSQL 16, including schema verification and migration ledger.
- Pass: release control check.
- Pending: PR checks, governed lab migration apply and schema readback, and post-apply signed-in approval flow.

## Rollout Plan

Merge through a reviewed PR, deploy only through `.github/workflows/aca-main-deploy.yml`, then apply the merged migration only through `.github/workflows/db-migration-lab.yml` in explicit `apply` mode after its required approval gates. Confirm the schema and repository readback before retrying client approval.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: pending exact-SHA build.
- ACA runtime invariant: pending template and 100%-traffic revision readback.
- Worker image invariant: pending exact digest readback.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, upload reviewed DOCX, sign-off, and verify P1 gate / P2 access.

## Rollback Plan

The migration is additive and nullable. If application behavior must be reverted, roll back the application through a PR and the repo-owned ACA deploy workflow while leaving the column in place. Do not drop the column after approval lineage has been recorded; repair forward if a schema issue is found.

## Audit Evidence

- PR, CI, migration workflow run and schema readback, exact-SHA ACA deployment proof, and signed-in approval receipt will be recorded here after completion.

## Known Gaps

- Historical deliverables are not backfilled; no approval is inferred for an existing row.
- Live approval remains blocked until the governed migration is applied and read back.
