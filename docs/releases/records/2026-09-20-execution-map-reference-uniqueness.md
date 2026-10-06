# 2026-09-20-execution-map-reference-uniqueness — Reject duplicate work placement

## Release ID

`2026-09-20-execution-map-reference-uniqueness`

## Status

`candidate`

## Plain-English Summary

The structure map used by the internal execution board contained a repeated block of item references. The generated queue preserved both references and displayed one open item twice, which could direct concurrent sessions toward the same work.

This release removes the repeated references and makes duplicates within a structural item list a hard error. It keeps intentional reuse between a stage and its capability views valid.

## Layer Impact

- Release lane: `internal-admin`.
- Layers 1 through 4: no change.
- Internal operator tooling: board and queue generation reject duplicate structural placement.

## Client Applicability

- All clients: no product or data change.
- Specific clients: none.
- Internal only: all operators using the generated execution board and queue.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Remove repeated work references from `scripts/exec/source-stage-map.json`.
- Validate uniqueness within stage, track, and capability item lists in `scripts/exec/build-source-board.mjs`.
- Add positive and negative behavioral coverage in `scripts/exec/build-execution-queue.test.mjs`.

## QA / Validation

- PASS: isolated generator suite, 26 checks.
- PASS: focused mutation that reintroduced a duplicate reference caused the generator to exit non-zero and name the duplicate location.
- PASS: live operator documents regenerated with zero unmapped items and one row per open item.
- PASS: TypeScript, ESLint, and release control are required before merge.

## Rollout Plan

Merge through the protected pull-request lane. The repository-owned ACA workflow may build the unchanged product runtime, while operators receive the corrected board behavior the next time they regenerate local views.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`; no ad hoc deployment.
- Shared runtime mutators: none in this change.
- Approved image digest: recorded by the repo-owned workflow after merge.
- ACA runtime invariant: verify read-only after deployment.
- Worker image invariant: verify read-only after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: no; this change has no product surface.

## Rollback Plan

Revert the merge commit. This restores the previous generator and structure map; no tenant data, schema, or product runtime state needs rollback.

## Audit Evidence

- `scripts/exec/build-execution-queue.test.mjs`
- `scripts/exec/source-stage-map.json`
- Pull-request checks and the post-merge read-only runtime invariant artifact

## Known Gaps

The append-only claim protocol remains operator state outside the repository. This change prevents duplicate structural placement; it does not infer a claim from the separate heartbeat log.
