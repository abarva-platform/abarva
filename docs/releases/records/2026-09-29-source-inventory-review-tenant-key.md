# Source inventory review tenant-key alignment

## Release ID

`2026-09-29-source-inventory-review-tenant-key`

## Status

`candidate`

## Plain-English Summary

The Scope inventory reviewer now looks up the linked file using the same canonical tenant key that the upload registry writes. A parsed upload remains insufficient on its own: human review, the exact artifact, file hash, event, stage and tenant still control promotion to usable evidence.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical facts: No schema, migration or canonical fact write.
- Layer 4 Source projection: Aligns the evidence-review read fence with the existing artifact-registry tenant identity.

## Client Applicability

- All clients: Source New Scope inventory review where the app client key differs from the canonical artifact tenant key.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- The exact linked `source_artifacts` lookup uses the upload registry's canonical tenant-key mapping.
- The route test uses distinct app and registry tenant keys, and negative POSTs include the expected preview identity so the tenant fence is independently exercised.
- No upload format, approval authority, supplier communication or stage-gate rule changes.

## QA / Validation

- Pass: Red-first same-tenant alias fixture returned 409 on the prior lookup and 200 after the correction.
- Pass: Removing the tenant filter deliberately made the other-tenant negative return 200; restoring it returned 409. All 20 focused route tests pass.
- Pass: Adjacent upload, substrate-sync and review suites pass 55/55; TypeScript, scoped ESLint, release check and diff check pass.
- Not run: PR CI, official ACA deploy/runtime and signed-in review replay until their respective stages.

## Rollout Plan

Squash-merge after local validation, applicable CI and review. Only the repo-owned ACA main workflow may deploy. Verify the web template, 100%-traffic revision and required workers use the same immutable digest, then retry the exact signed-in inventory review.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None from this branch.
- Approved image digest: Pending main workflow.
- ACA runtime invariant: Template and 100%-traffic revision must match.
- Worker image invariant: Required delivery jobs must match.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert through a new PR and the repo-owned main workflow. No schema or data rollback is needed.

## Audit Evidence

Focused red/green and mutation output, PR checks, exact main deploy, immutable runtime readback and private signed-in journey ledger.

## Known Gaps

This corrects inventory review lookup only. It does not supply other Scope evidence or exit the Scope gate.
