# 2026-09-16-source-ava-empty-opportunity — Guard empty contract opportunity packets

## Release ID

`2026-09-16-source-ava-empty-opportunity`

## Status

`candidate`

## Plain-English Summary

When a contract has no governed opportunity rows in the current Source answer packet, aVa now says actionability and value are not established. The answer, export, graph, and suggested next step no longer imply that a commercial optimization case already exists. Contract-specific posture and source-system links are used only for the selected contract they describe.

## Layer Impact

- `global-control-lane`, Layer 4 Source aVa answer presentation only. No canonical fact, adapter, intake, or schema change.

## Client Applicability

- All clients using Source contract answer and optimization export packets.
- No tenant-specific data mutation or feature flag.

## Changes Included

- Empty-opportunity verdict, export, graph, and next-step guards.
- Selected-contract binding for commercial posture and source connections.
- Rendered answer regression covering a named contract without opportunity rows while another contract is selected in the page context.

## QA / Validation

- The regression failed before the implementation and passed afterward; focused suite: 14 tests passed.
- Scoped ESLint, TypeScript `--noEmit`, and release gate: passed.
- Signed-in proof: pending deployment.

## Rollout Plan

Merge through a reviewed PR and deploy through the repo-owned ACA main workflow after separate approval. No migration or data build is required. Coordinate this answer-file change with other open Source aVa PRs.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the deploy workflow.
- ACA runtime invariant: verify after deployment.
- Worker image invariant: verify after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: an empty-opportunity contract answer must state the evidence gap and avoid borrowing another contract's posture.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. No data or schema rollback is needed.

## Audit Evidence

PR diff, local tests, release gate, deploy readback, and signed-in answer proof when available.

## Known Gaps

This guard does not load or calculate opportunities. It does not establish a finance-confirmed value.
