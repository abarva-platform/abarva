# 2026-07-30-airline-missing-evidence-identity-diagnostic — Airline Missing Evidence Identity Diagnostic

## Release ID

`2026-07-30-airline-missing-evidence-identity-diagnostic`

## Status

`candidate`

## Plain-English Summary

This change improves the read-only Airline reconciliation verifier so operators can see why source rows fail to match live evidence rows. It prints the source version and sample persisted evidence identities for the top missing files in the governed job logs, allowing the next repair to target the real identity or parser issue.

## Layer Impact

- `client-data-lane` / Source adapters: read-only diagnostic only. No parser, source, candidate, review, publication, baseline, projection, or product data is changed.
- `client-data-lane` / Canonical model: no mutation. The verifier reads live evidence and source-version metadata and reports identity samples for reconciliation.

## Client Applicability

- All clients: No.
- Specific clients: Airline Demo New only.
- Internal only: Yes, operator diagnostic.
- Public/demo only: No.
- Feature flag: Not applicable.

## Changes Included

- `scripts/qa/airline-e2e-live-reconciliation-readback.mjs`

## QA / Validation

- Pass: `node --check scripts/qa/airline-e2e-live-reconciliation-readback.mjs`
- Pass: `node scripts/qa/airline-e2e-live-reconciliation-readback.mjs --skip-db --no-field-detail --out-dir /tmp/airline-readback-smoke-identity`

## Rollout Plan

Merge through the normal PR path, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the image, then rerun the governed Airline reconciliation job inside the VNet. The job remains read-only.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime image availability.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the deploy workflow after merge.
- ACA runtime invariant: Required before rerunning the governed diagnostic job.
- Worker image invariant: Use the deployed digest when starting the reconciliation job.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this is a read-only job diagnostic.

## Rollback Plan

Revert the verifier change and redeploy. No data rollback is required because this release does not mutate data.

## Audit Evidence

- PR diff for the verifier change.
- GitHub checks.
- VNet reconciliation job logs showing the expanded missing evidence identity diagnostics.

## Known Gaps

This does not fix the variance itself. It only produces the live identity proof needed to classify and repair the earliest failing source-row evidence gate.
