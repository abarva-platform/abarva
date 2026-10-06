# 2026-09-30 Home Segment Source-Set Gate

## Release ID

`2026-09-30-home-segment-source-set-gate`

## Status

`candidate`

## Plain-English Summary

The dry-run Home segment planner now refuses candidates unless the full canonical file set matches a reviewed binding, the accepted source catalog, a passed context snapshot, and its passed Home projection. File identity includes the registered path as well as content hash. This release makes no serving-row write and changes no Home page.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 1: no intake change.
- Layer 2: no adapter change.
- Layer 3: validates source-set and snapshot identity; does not write canonical objects or relationships.
- Layer 4: blocks dry-run Home segment candidates when the source-set proof is absent or mismatched; no publication.

## Client Applicability

- All clients: shared pure admission contract.
- Specific clients: no tenant is loaded or promoted.
- Internal only: operator planning and tests.
- Public/demo only: no surface change.
- Feature flag: none.

## Changes Included

- Hash the complete registered source-file path and content-hash set deterministically.
- Require an approved binding for the exact tenant and assessment.
- Require the target snapshot and projection to carry that same source-set hash and passed quality state.
- Require the accepted ECL source-file catalog to match the reviewed file set exactly, including duplicate and extra-file rejection.
- Withhold every segment and function candidate when the source-set gate fails.

## QA / Validation

- Focused planted-failure tests cover changed content, moved paths, absent or candidate review, mismatched snapshot/projection, missing/extra/duplicate catalog files, and ambiguous basenames.
- Typecheck, lint, release check, and PR CI must pass before merge.
- No database write, human approval, source-catalog production read, or signed-in segment proof is claimed.

## Rollout Plan

Merge through a protected PR and deploy through the repo-owned ACA main workflow. This is a fail-closed contract for a future governed producer. A real reviewed manifest, scoped digest-pinned ACA data-build job, quality/readback, human review, and serving publication remain separate gates.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only for shared web traffic.
- Shared runtime mutators: none in this release.
- Approved image digest: determined by the main deploy run.
- Runtime invariant: verify web template, 100%-traffic revision, and required worker job images.
- Live signed-in proof: confirm existing record-source and missing-segment states remain honest.

## Rollback Plan

Revert through protected main and the approved deploy workflow. No tenant data or schema reversal is involved.

## Audit Evidence

Inspect focused tests, PR CI, ACA deploy, and signed-in Home record-state proof. Future data-build proof is separate.

## Known Gaps

- The reviewed binding is an input contract, not an approval mechanism. A future operator must read and validate the approved dataset manifest rather than construct one from unreviewed input.
- The existing serving assessment cannot be assumed compatible with a different active intake merely because tenant and assessment labels match.
- No Home segment family is live until a governed producer and publication review complete.
