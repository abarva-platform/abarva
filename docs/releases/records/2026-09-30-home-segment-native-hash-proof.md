# 2026-09-30 Home Segment Native Hash Proof

## Release ID

`2026-09-30-home-segment-native-hash-proof`

## Status

`candidate`

## Plain-English Summary

The candidate-only Home segment gate now checks the file set, context snapshot, and Home projection using each layer's own content hash. It compares independently read target metadata with the approved source-set binding. A matching file set alone cannot stand in for a matching snapshot or projection. No segment is published by this change.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 1: no intake change.
- Layer 2: no adapter change.
- Layer 3: validates source-set and target metadata; does not write canonical objects or edges.
- Layer 4: changes a dry-run Home admission plan only; no serving writer or page change.

## Client Applicability

- All clients: shared pure planning contract.
- Specific clients: no tenant data is loaded or promoted.
- Internal only: operator planning and tests.
- Public/demo only: no surface change.
- Feature flag: none.

## Changes Included

- Separate the registered file-set hash from native context-snapshot and projection source hashes.
- Require independent target readback to match the reviewed snapshot and Home projection identifiers, content hashes, and passed quality states.
- Include the Home projection output hash and key in the comparison.
- Refuse any extra or non-accepted file in the scoped source catalog.

## QA / Validation

- Focused tests cover distinct valid native hashes, mismatched target hashes, a wrong projection, missing readback, and an extra partial file.
- Typecheck, lint, release check, and PR CI must pass before merge.
- No database write, human approval, production source-catalog read, or signed-in segment proof is claimed.

## Rollout Plan

Merge through a protected PR and deploy through the repo-owned ACA main workflow. This only changes a planning contract used by a future governed producer. Publication still requires a reviewed dataset manifest, scoped digest-pinned data-build job, quality/readback, and human review.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only for shared web traffic.
- Shared runtime mutators: none in this release.
- Approved image digest: determined by the main deploy run.
- Runtime invariant: verify web template, 100%-traffic revision, and required worker job images.
- Live signed-in proof required: confirm the current source-state and absent segment family remain honest.

## Rollback Plan

Revert through protected main and the approved deploy workflow. No tenant data or schema reversal is involved.

## Audit Evidence

Inspect focused tests, PR checks, ACA deploy, and signed-in Home source-state proof. Data-build evidence remains a separate release gate.

## Known Gaps

- The approved binding remains an input contract, not an approval mechanism or live catalog reader.
- Existing source files and projections have not been promoted to passing quality by this release.
- No Home segment family is live until a separately governed producer and publication review complete.
