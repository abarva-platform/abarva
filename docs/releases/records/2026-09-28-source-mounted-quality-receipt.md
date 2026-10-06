# 2026-09-28 Source mounted quality receipt

## Release ID

`2026-09-28-source-mounted-quality-receipt`

## Status

`candidate`

## Plain-English Summary

The mounted Source Files view now shows the persisted generation review result for the exact registry draft it belongs to. An unlinked or different-body draft does not inherit another draft's review result.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source event page and Files read model.
- Layer 3 Canonical Model: read-only use of existing artifact IDs, authored state, and review metadata. No schema, canonical fact, approval, or event-state write.

## Client Applicability

- All clients: Source events with generated registry artifacts linked to authored state.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Carry the persisted linked artifact ID from the mounted event page into the Files read model.
- Attribute a generation review receipt only to that linked registry artifact, and only when an available registry body matches the reviewed body.
- Keep the receipt absent for unlinked and body-mismatched registry drafts.

## QA / Validation

- Pass: red-first mounted Files test reproduced the missing review result, then passed after the exact-ID projection.
- Pass: mounted negative tests reject receipt attribution to a different registry body or an unlinked same-code file.
- Pass: 34 focused Source tests.
- Pass: deliberate mutations broke the exact-ID join and body-mismatch protection; each failed its targeted mounted test and was restored.
- Pass: TypeScript check with an 8 GB Node heap. The default 4 GB heap exhausted memory before returning diagnostics.
- Not run: PR CI, runtime readback, and signed-in Files replay; required before live claims.

## Rollout Plan

Squash merge after local validation, applicable CI, and review. Deploy only through the repo-owned ACA main workflow. Verify digest-pinned web and worker runtimes, then inspect the Files audit matrix signed in.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Resolve from the successful main workflow.
- ACA runtime invariant: Verify digest-pinned template and 100%-traffic revision.
- Worker image invariant: Verify both required workers match the approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert through a reviewed PR and the same main deploy workflow. No migration or data rollback is required.

## Audit Evidence

PR, applicable CI, official deploy, runtime readback, and signed-in read-model review are tracked in the private execution ledger.

## Known Gaps

This change projects an existing receipt; it does not create or rerun a review. A draft without a persisted receipt remains `Not run`. A failed review does not approve a draft or advance a stage gate.
