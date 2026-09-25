# 2026-09-25-source-read-model-inventory — Proposed Source read-model contracts

## Release ID

`2026-09-25-source-read-model-inventory`

## Status

`candidate`

## Plain-English Summary

Enumerates the proposed Source read models and makes missing build metadata visible. No read model is created or marked ready by this change; a complete metadata shape is not proof that its claims are valid.

## Layer Impact

Release lane: `client-data-lane`. Layer 3 remains the fact authority. This Layer 4 inventory describes proposed projections and refuses a build-ready verdict when required source, reconciliation, tenancy, freshness, owner, or job metadata is absent.

## Client Applicability

- All clients: The inventory contract is shared; no client data or rendered result changes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Add a 13-model proposed catalogue and a fail-closed build-contract assessment.
- Add a read-only operator report with an optional completeness exit status.
- Document the first event-queue candidate and its unresolved identity and denominator questions.
- Add behavior tests for completeness and missing tenant/reconciliation controls.

## QA / Validation

- Red first: the behavior suite failed because the contract module did not exist.
- Mutation: removing `tenantFence` from required fields failed two tests; it was restored.
- Focused Jest: Pass, 3 tests. TypeScript: Pass with an 8 GB Node heap after the default 4 GB heap exhausted. Scoped ESLint: Pass. Test coverage census: refreshed after the new suite. Release check: Pass.
- Operator report: 13/13 proposed models still lack complete metadata; `--require-complete` exits 1. Library orphan audit: Pass after the report became the non-test consumer.
- Live data reconciliation, ACA job and signed-in positive readback: Not run; separately authorized work remains.

## Rollout Plan

Merge through a reviewed PR. The repo-owned ACA main workflow carries the code, but there is no runtime consumer, schema apply or data build in this release. Each model requires an independently reconciled job and readback before product use.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None from this change.
- Approved image digest: Owed after merge.
- ACA runtime invariant: Owed after merge.
- Worker image invariant: Owed after merge.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for an unconsumed inventory; required for any subsequent model consumer.

## Rollback Plan

Revert the catalogue/doc PR and redeploy via the repo-owned workflow. No data rollback is involved.

## Audit Evidence

Focused Jest output, mutation output, review/CI, and post-merge runtime proof are separate evidence. This record does not claim model data or journey acceptance.

## Known Gaps

All 13 build contracts remain unreconciled. No approved owner, SLA, canonical join, denominator, governed build job, positive data readback, or signed-in acceptance is established here.
