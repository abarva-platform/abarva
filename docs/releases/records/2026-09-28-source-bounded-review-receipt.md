# 2026-09-28 Source bounded review receipt

## Release ID

`2026-09-28-source-bounded-review-receipt`

## Status

`candidate`

## Plain-English Summary

The event Files view now reads the persisted quality-review result for a generated draft without loading its full body or model reasoning into the default page. A receipt is attached only to its linked registered artifact. A later human edit leaves the prior result unclaimed until the body is reviewed again.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source event Files review status and its bounded read adapter.
- Layer 3 Canonical Model: No schema, fact, authority, or write change. Existing review metadata is read for the current event and stage only.

## Client Applicability

- All clients: Source events with a generated artifact and persisted review metadata.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Add a stage-scoped read for the review metadata, excluding draft body bytes and projecting only the quality-result fields used by Files.
- Join the result by the linked registry artifact ID on the metadata-only event page.
- Suppress a receipt after a newer or unorderable human edit, and decline to join it when registry body bytes are present but the state body is unavailable for comparison.

## QA / Validation

- Pass: red-first adapter, query, and mounted Files tests reproduced the absent review read and receipt join.
- Pass: stage-scoped projection, no draft body or reasoning, later human edit, unorderable edit, mismatched registry body, and unlinked artifact tests.
- Pass: deleting the review read failed the projection test; disabling the stale-edit check failed two negative tests. Both mutations were restored.
- Pass: 5 related suites / 71 tests, TypeScript `tsc --noEmit` with an 8 GB heap, scoped ESLint, release check, and diff check.
- Not run: applicable PR CI; required before merge.
- Not run: post-deploy signed-in review readback; required before a live claim.

## Rollout Plan

Squash merge after local validation, applicable CI, and review. Deploy only through the repo-owned ACA main workflow. Verify digest-pinned web template, the 100%-traffic revision, and both worker images, then replay the Files review status signed in.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Resolve from the successful main workflow.
- ACA runtime invariant: Verify digest-pinned template and 100%-traffic revision.
- Worker image invariant: Verify both required workers match the approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert via a reviewed PR and the same main deploy workflow. No migration or data rollback is required.

## Audit Evidence

PR, CI, main deploy run, runtime readback, and signed-in replay are recorded in the private execution ledger.

## Known Gaps

The review receipt is not human final acceptance, stage approval, release authority, or evidence that the draft prose is factually sound. Those remain separate gates.
