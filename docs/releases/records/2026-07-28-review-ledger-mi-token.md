# 2026-07-28-review-ledger-mi-token — Review Ledger Managed-Identity Token

## Release ID

`2026-07-28-review-ledger-mi-token`

## Status

`candidate`

## Plain-English Summary

The Knowledge review-ledger builder can now connect to Azure PostgreSQL using the review job's managed identity instead of requiring a database password in the job command. It uses the Azure Identity SDK first, with the metadata endpoint as a fallback, and retries transient managed-identity startup failures. DB-backed review package reads and ledger writes now also set the explicit tenant session context required by PostgreSQL RLS.

This release does not approve candidates, write review decisions, publish domains, assemble a baseline, build projections, refresh Home, select a provider, or expose product runtime content.

## Layer Impact

- `client-data-lane`: Updates the Airline Demo New review-governance execution tooling so the tenant review job can authenticate to the private PostgreSQL data plane with Microsoft Entra.
- `internal-admin`: Improves the operator path for governed review-ledger execution. No client-facing product surface changes.

## Client Applicability

- All clients: Not directly affected.
- Specific clients: Airline Demo New execution lane only.
- Internal only: Review operator tooling.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/build-review-decision-ledger.mjs`: adds Azure PostgreSQL Entra token support when `PGPASSWORD` is absent and a managed-identity client id is supplied, using Azure Identity first and the metadata endpoint as fallback.
- `scripts/knowledge/build-review-decision-ledger.mjs`: sets `app.tenant_key` before DB-backed candidate reads and review-ledger writes so RLS returns only the approved tenant slice instead of an empty package.
- `scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`: adds regression coverage for passwordless DB connection configuration and explicit tenant context.
- Release record: this file.

## QA / Validation

- PASS: `node --check scripts/knowledge/build-review-decision-ledger.mjs`
- PASS: `npm run test:knowledge-process-executors`
- PASS expected after this record update: `npm run release:check`

## Rollout Plan

Merge to main through PR review, then deploy through the normal Azure Container Apps main workflow. The review-ledger apply remains dormant until the governed Airline review job runs it with the approved package hash, approved candidate manifest hash, approved batch classes, and `ABARVA_REVIEW_LEDGER_APPLY_ACK=APPLY_REVIEW_LEDGER`.

## Deployment Authority

- Repo-owned deploy workflow: Required for the updated script to be present in the digest-pinned runtime image.
- Shared runtime mutators: None in this release.
- Approved image digest: Captured after the ACA main deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required before the tenant review job runs this script.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this dormant tooling change; later product proof is required only after baseline/projection activation.

## Rollback Plan

Revert this release. Existing password-based local and break-glass execution paths remain unchanged. No database schema or data rollback is required because this release alone writes no tenant data.

## Audit Evidence

- PR URL: Added after PR creation.
- CI: GitHub checks plus local validation commands above.
- Runtime proof: ACA runtime invariant after merge/deploy.
- Execution proof: The later Airline review job run must capture ledger-apply and reconciliation artifacts separately.

## Known Gaps

- This does not itself apply review decisions.
- This does not grant database permissions; the Airline PostgreSQL Entra bridge and reviewer grants must already be in place.
- This does not publish domains, create an active baseline, build projections, or prove product consumption.
