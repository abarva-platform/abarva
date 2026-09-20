# 2026-09-20-liability-product-truth-ci-ownership - Liability and product-truth CI ownership

## Release ID

`2026-09-20-liability-product-truth-ci-ownership`

## Status

`candidate`

## Plain-English Summary

Pull-request CI now runs the shared AI-liability and product-truth library tests. These tests cover human-decision records, acknowledgments, audit exports, product capability claims, evidence-backed numbers, and third-party positioning.

## Layer Impact

- `global-control-lane`: test and release-control ownership for shared answer and human-decision safeguards.
- No client data, schema, migration, product runtime, model prompt, or user-interface behavior changes.

## Client Applicability

- All clients: future pull requests receive the additional CI coverage.
- Specific clients: none.
- Internal only: CI ownership and its audit evidence.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Preserve the existing exact CI owner for the shared human-rationale suite.
- Add a parent command for the remaining AI-liability suites while excluding the already-owned file.
- Add a parent command for the product-truth suite tree.
- Add a behavioral guard for exact/parent composition and generated-census ownership.
- Refresh the generated test-to-CI census.

## QA / Validation

- PASS - measured baseline: 13 suites and 80 tests.
- PASS - remaining AI-liability parent: 6 suites and 31 tests.
- PASS - product-truth parent: 6 suites and 41 tests.
- PASS - behavior ownership guard: 3 tests.
- PASS - mutation checks for minimum human rationale, fail-closed acknowledgment storage, capability overreach, and workflow ownership.
- PASS - repository behavior suite, TypeScript, scoped ESLint, workflow YAML parsing, census generation, and release control before merge.

## Rollout Plan

Merge through the protected pull-request path. The workflow coverage is active on subsequent pull requests. There is no data-plane or feature rollout.

## Deployment Authority

- Repo-owned deploy workflow: unchanged; a main deploy may run because repository policy deploys every merged change.
- Shared runtime mutators: none in this change.
- Approved image digest: resolved only by the repo-owned deploy workflow after merge.
- ACA runtime invariant: unchanged and checked by the repo-owned workflow if it runs.
- Worker image invariant: unchanged and checked by the repo-owned workflow if it runs.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no product behavior changed; authenticated product proof is not claimed.

## Rollback Plan

Revert the two workflow commands, behavior guard, generated census update, and this release record. No migration or data rollback is required.

## Audit Evidence

- The committed generated census records both control directories as workflow-owned.
- The workflow keeps the existing human-rationale owner and explicitly excludes that file from the new liability parent command.
- Focused test and mutation outputs are summarized in the pull request.
- Git history shows the rationale gap was superseded by shared-validator enforcement before this release.

## Known Gaps

The approval-pattern review is an executable governance audit rather than a product request path. This release gives its tests CI ownership; it does not add a product surface or runtime scheduler for that audit.
