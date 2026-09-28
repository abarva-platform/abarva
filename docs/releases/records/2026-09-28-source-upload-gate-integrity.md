# 2026-09-28 Source Upload Gate Integrity

## Release ID

`2026-09-28-source-upload-gate-integrity`

## Status

`candidate`

## Plain-English Summary

Receiving a Source document no longer records an accountable governance decision. The upload still registers the file and can land extracted content on a draft artifact, but linked human-review criteria remain pending until their own decision path is completed.

## Layer Impact

- `global-control-lane`, Layer 4 Source workflow: removes an upload-side gate-state write. No Layer 3 fact, source adapter, or intake record changes.

## Client Applicability

- All clients using Source document uploads; no tenant-specific rule or feature flag.

## Changes Included

- The artifact-scoped upload route no longer marks code-linked gate criteria met on file receipt.
- Existing file registration, extracted-text body landing, and artifact-presence substrate sync remain in place.
- Focused route tests cover landed content and missing extractable text without a human gate decision.
- No migration or data build.

## QA / Validation

- Pass: red-first route test observed a linked human criterion marked met on upload; after the change the same request lands content without a gate write.
- Pass: focused upload, substrate-sync, and gate-decision suites, 31 tests; Node 24 TypeScript check; scoped ESLint with no errors; `release:check`; `git diff --check`.
- Not run: post-deploy signed-in replay, pending release processing.

## Rollout Plan

Squash-merge after applicable CI and review. Only the repo-owned ACA main workflow may deploy the shared runtime. No database migration or flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending official main deploy.
- ACA runtime invariant: pending template and 100%-traffic revision readback.
- Worker image invariant: pending both required delivery worker checks.
- Feature/env flag update path: none.
- Live signed-in proof required: upload receipt must not be mistaken for a stage decision; stage readiness remains independent.

## Rollback Plan

Revert through a new PR and the official main workflow. No schema or data rollback is involved.

## Audit Evidence

Focused test output, PR/CI, official deploy, digest/runtime readback, and the private signed-in journey ledger.

## Known Gaps

This does not parse registered-only files or complete any evidence applicability decision. Named reviews, approvals, and external-release checks remain separate.
