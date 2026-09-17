# 2026-09-17-source-depth-projection-ownership-counts

## Release ID

`2026-09-17-source-depth-projection-ownership-counts`

## Status

`candidate`

## Plain-English Summary

The contract-depth projection now respects the declared opportunity writer when checking package counts. Evidence-only inputs contribute contract evidence but do not contribute a second set of opportunities. The product view excludes legacy sourcing rows for those declared contract identities before combining opportunity sources.

## Layer Impact

Release lane: `client-data-lane` (tenant-scoped Source read-model projection and quality checks).

- Layer 3: readback expects no opportunity rows for an evidence-only package.
- Layer 4: opportunity, action, claim, and assistant-grounding readbacks use the canonical writer's persisted row count. The sourcing-opportunity union suppresses legacy rows only for contract identities declared evidence-only in the ownership manifest.

## Client Applicability

- All clients: projector behavior follows the ownership manifest without a tenant-specific code branch.
- Specific clients: only packages declared evidence-only by that manifest have changed count expectations or union filtering.
- Internal only: operator projection job and quality gate.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/source/project-contract-depth-package-layer4.ts`
- `scripts/source/contract-depth-projection-ownership.ts`
- Focused projector and ownership tests.
- No schema, loader guard, or cutover-job change.

## QA / Validation

- PASS: 13 focused Jest tests cover declared ownership, unchanged unrelated packages, canonical-writer count lookup, missing-writer refusal, and union-branch duplicate suppression.
- PASS: scoped ESLint and `tsc --noEmit`.
- NOT RUN: Azure apply, deployed readback, and signed-in proof for this candidate.

## Rollout Plan

Review and merge through the governed PR lane. Deploy only through the repo-owned ACA workflow, then run the separately approved operator projection job and read back the four affected view counts against the canonical writer. A merge or web deploy alone does not refresh the database views.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: pending deployment.
- ACA runtime invariant: pending deployment.
- Worker image invariant: pending deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after data-plane projection and readback.

## Rollback Plan

Revert the code in a new reviewed release. If projection views were refreshed, restore the prior approved view definition through a governed operator job; do not assume reverting web code reverses database views.

## Audit Evidence

- Source diff, focused test output, lint and type-check output.
- Subsequent operator-job proof bundle and readback, if approved and run.

## Known Gaps

Actual deployed row counts and whether older source-side records remain physically present are not established by local validation.
