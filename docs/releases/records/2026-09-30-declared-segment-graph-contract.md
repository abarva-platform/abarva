# 2026-09-30 Declared Segment Graph Contract

## Release ID

`2026-09-30-declared-segment-graph-contract`

## Status

`candidate`

## Plain-English Summary

The inactive canonical graph build can now carry declared business-function membership in identified business segments. It accepts a link only when both canonical objects, the source row, and the graph function node agree. Missing or ambiguous links are held out with a reason. This release does not load the graph or publish new Home content.

## Layer Impact

Release lane: `client-data-lane`. The contract is shared, but no client dataset is changed by merging it.

- Layer 2: no intake shape change.
- Layer 3: registers the segment object and membership verb in the canonical dictionary, and prepares source-backed graph nodes and edges for the governed runtime build.
- Layer 4: no Home reader, claim, or UI change.

## Client Applicability

- All clients: shared validation and graph-build contract becomes available.
- Specific clients: none are loaded or promoted by this release.
- Internal only: dry-run proof can inspect accepted and quarantined links.
- Public/demo only: no surface change.
- Feature flag: none.

## Changes Included

- Add the canonical segment definition, source-owned segment fact rules, and the typed `BELONGS_TO_SEGMENT` relationship dictionary entry.
- Add a pure graph augmentation step for resolved, evidence-backed function-to-segment candidates; quarantine unresolved, unevidenced, mismatched, or ambiguous links.
- Preserve declared source file, row, and evidence reference on the proposed graph write set.
- Emit a local post-augmentation proof file and count accepted and withheld links in the dry-run summary.
- Derive the runtime-build tenant allowlist from the canonical registry.

## QA / Validation

- Focused graph and Layer 3 contract tests: 13 passed.
- TypeScript typecheck and touched-file ESLint: passed.
- Home behavior coverage gate: 167 suites and 1,764 tests passed, with 90.12% line and statement coverage against the 90% floor.
- Release control check: passed.
- A local dry-run completed with zero database writes and produced 22 accepted and 2 quarantined segment links from the selected synthetic fixture; this is a planned write set, not a readback from the data plane.
- PR CI: pending at release-record creation.
- No tenant data write, migration, Home projection publication, or signed-in segment proof is claimed.

## Rollout Plan

Merge through a protected PR. The repo-owned ACA main workflow deploys the shared image; this does not activate a data build. A dataset manifest, digest-pinned ACA data-build job, proof bundle, quality gate, human review, and explicit serving promotion are required before Home may use these links.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only for shared web traffic.
- Shared runtime mutators: none in this release.
- Approved image digest: determined by the main deploy run.
- ACA runtime invariant: verify template, 100%-traffic revision, and required worker images after deployment.
- Worker image invariant: must match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: confirm existing Home state is unchanged; do not call segment graph live without a governed load and readback.

## Rollback Plan

Revert through protected main and the repo-owned deploy workflow. No tenant data or schema migration needs reversal from this code-only release.

## Audit Evidence

Inspect the PR, CI and deploy runs, focused tests, the local dry-run summary and post-augmentation proof file, and the signed-in Home record-state check. A production data-build proof bundle does not yet exist.

## Known Gaps

- The segment graph is not loaded, quality-reviewed, or served to Home.
- The existing graph reconciler's own CSV report is the pre-augmentation input; the post-augmentation proof is a separate file.
- Reviewed Home narrative remains older than serving rows.
