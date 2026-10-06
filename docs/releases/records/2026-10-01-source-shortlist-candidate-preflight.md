# 2026-10-01 Source Shortlist Candidate Preflight

## Release ID

`2026-10-01-source-shortlist-candidate-preflight`

## Status

`candidate`

## Plain-English Summary

The vendor-shortlist draft action now checks that the event has at least one explicitly accepted candidate supplier before invoking document generation. If candidate authority cannot be read, it fails closed. An accepted RFP package remains a separate prerequisite, and this change neither selects recipients nor issues a package.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3: reads existing canonical supplier identity through event-scoped candidate authority; no canonical data is changed.
- Layer 4: Source draft-generation preflight only. No approval, release, or supplier-contact behavior changes.

## Client Applicability

- All clients: yes, for the vendor-shortlist draft action.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Vendor-shortlist draft route preflight and focused route tests.
- No schema, migration, loader, or data mutation.

## QA / Validation

- PASS: red-first route tests reproduced the missing preflight before the fix: an empty panel reached the unrelated upstream-document error.
- PASS: negative tests require an event-scoped read, a specific empty-panel block, and a fail-closed unavailable-authority result.
- PASS: positive controls retain the existing document prerequisite and leave other artifact codes unaffected.
- PASS: removing the empty-panel guard made its negative test fail; the guard was restored.
- PASS: three adjacent generation suites, 8 tests; TypeScript and scoped ESLint.
- NOT RUN: CI, deployment, and signed-in replay are post-PR steps.

## Rollout Plan

Squash merge through the protected main branch. Only the repo-owned ACA main workflow may build and deploy the digest-pinned image. No flag or data job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: verify after deployment.
- ACA runtime invariant: verify web template and the sole 100%-traffic revision against the workflow digest.
- Worker image invariant: verify both required worker images against the same digest.
- Feature/env flag update path: none.
- Live signed-in proof required: retry the shortlist draft action with no accepted panel and confirm the candidate-specific block.

## Rollback Plan

Revert the squash commit through a PR and let the repo-owned main workflow redeploy. No data rollback is needed.

## Audit Evidence

PR checks, the focused red/green and mutation test output, the official ACA workflow run, digest readback, and signed-in action readback.

## Known Gaps

This preflight does not establish respondent selection, NDA coverage, legal approval, a client-final shortlist, or RFx release. Those remain separately governed decisions.
