# 2026-09-22 Execution Map U-512 Placement

## Release ID

`2026-09-22-execution-map-u512`

## Status

`candidate`

## Plain-English Summary

The generated execution board can classify the newly filed unresolved-client fallback audit without attributing it to a Source lifecycle stage. This restores queue generation and does not change the audit item's product status.

## Layer Impact

- Release lane: `internal-admin`.
- Execution control: two identifiers are added to the platform-integrity track.
- Product layers: no product or data behavior changes.

## Client Applicability

- All clients: no product behavior changes.
- Specific clients: none.
- Internal only: generated execution board and queue.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Place U-512 and its structural repair item T-614 in the platform-integrity track.

## QA / Validation

- Pass: red-first generation refused T-614 and U-512 as unmapped identifiers.
- Pass: board and queue generation completed with zero unmapped identifiers.
- Pass: CPO vision completion remained 40.7%.
- Pass: 103 execution generator tests completed with no failures.
- Pass: release check and diff check completed before the pull request.

## Rollout Plan

Squash-merge through the protected pull-request path. The repository-owned ACA workflow handles the standard release path; no product behavior changes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge.
- Shared runtime mutators: none.
- Approved image digest: recorded by the repo-owned deploy.
- ACA runtime invariant: required before calling the merge deployed.
- Worker image invariant: required by the repo-owned deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the squash commit through a pull request. The generated queue will again refuse the two identifiers until another valid placement exists.

## Audit Evidence

- Generated `source-board-summary.json` and `EXECUTION_QUEUE.md`.
- Pull-request checks and repo-owned ACA runtime-invariant artifact.

## Known Gaps

U-512 remains a separate product classification and repair item; this release does not implement it.
