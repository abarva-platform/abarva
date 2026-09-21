# 2026-09-20-execution-map-t537 - Place new queue decision item

## Release ID

`2026-09-20-execution-map-t537`

## Status

`candidate`

## Plain-English Summary

The repository-owned execution stage map now places the newly filed CI ownership decision and this mapping repair in the platform-integrity track. This restores strict board and queue generation without assigning lifecycle progress, status, ownership, or proof to either item.

## Layer Impact

`internal-admin`: internal execution tooling only. No client intake, canonical data, product projection, schema, tenant configuration, or runtime behavior changes.

## Client Applicability

- All clients: no client-facing change.
- Specific clients: none.
- Internal only: operators using the generated execution board and queue.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Place two execution-tooling items in the platform-integrity track.
- Add a behavioral check that rejects status fields in the structure-only map.
- Add this release record.

## QA / Validation

- PASS: before the change, the live operator input failed board generation with one unmapped item.
- PASS: after the change, the same operator input generates with zero unmapped items.
- PASS: `node --test scripts/exec/build-execution-queue.test.mjs` reports 24/24 behavioral checks.
- PASS: removing the new mapping makes the live board run fail and name the missing item.
- PASS: weakening the forbidden-map-key guard makes the new behavior check fail.
- PASS: TypeScript, focused ESLint, release control, and zero-deletion checks run before push.

## Rollout Plan

Merge through the protected pull-request lane. The repo-owned main workflow may deploy the repository revision, but this mapping is consumed only by the operator toolchain.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` if triggered by the main merge.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: resolved by the workflow if it runs.
- ACA runtime invariant: read-only verification after deploy if it runs.
- Worker image invariant: read-only verification after deploy if it runs.
- Feature/env flag update path: none.
- Live signed-in proof required: no product behavior changed; none claimed.

## Rollback Plan

Revert the merge commit. Board generation will again fail closed until every backlog item is placed.

## Audit Evidence

Inspect the pull request, the execution-queue behavior workflow, the before/after unmapped count, and the regenerated queue output.

## Known Gaps

The mapped decision item remains open; this release deliberately does not decide its CI-workflow ownership question.
