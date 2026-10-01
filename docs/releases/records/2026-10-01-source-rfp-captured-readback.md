# 2026-10-01-source-rfp-captured-readback - Distinguish captured input from open evidence

## Release ID

`2026-10-01-source-rfp-captured-readback`

## Status

`candidate`

## Plain-English Summary

A Source stage could show that its workflow input was captured while the detail panel still called the same input missing. The panel now reports the captured input and its readback separately from other required evidence that remains open. Continue and stage approval remain locked until their existing requirements are satisfied.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 Source presentation only. No Layer 3 fact, evidence, approval or supplier record changes.

## Client Applicability

- All clients: Source event stage workspaces.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Show a captured, fact-backed step as captured with typed-fact readback even when another required evidence row is open.
- Point the operator to the remaining evidence instead of asking for a duplicate input upload.
- Distinguish captured workflow inputs from open evidence in the stage summary.
- Preserve the existing Continue and approval readiness predicates.

## QA / Validation

- The mounted captured-input test failed before the UI correction: expected `Readback: typed facts available.`, observed `Readback: no typed facts yet.` with a duplicate upload instruction.
- After the correction, the test reads captured facts while still showing the separate missing evidence and a locked approval. Deliberately removing the captured-fact readback condition made the test fail again; restoring it passed.
- A second red-first assertion caught the false `required workflow step remains` summary; it now identifies one open required evidence item without claiming the workflow input is missing.
- Three focused and adjacent suites passed 97/97 tests. TypeScript and scoped ESLint passed. Release check and applicable CI are required before merge.
- A post-deploy signed-in replay of the exact stage remains required; local tests are not live acceptance.

## Rollout Plan

Squash merge through protected main. Only the repo-owned ACA main workflow builds and deploys the merge SHA. No migration, flag or data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: Only that workflow.
- Approved image digest: Record after successful main deploy.
- ACA runtime invariant: Digest-pinned web template and sole healthy 100%-traffic revision match.
- Worker image invariant: Both required delivery-worker job templates match the web digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Confirm captured fact readback, the correct remaining evidence request and unchanged approval lock.

## Rollback Plan

Revert through a new protected-branch PR and redeploy via the same workflow. No data rollback is needed.

## Audit Evidence

Mounted red/green and mutation output, PR CI, official main deploy run, immutable digest/revision readback and signed-in stage replay.

## Known Gaps

Capturing an internal checklist does not approve legal terms, Client Finals, recipient authority or external package release. Those remain separate gates.
