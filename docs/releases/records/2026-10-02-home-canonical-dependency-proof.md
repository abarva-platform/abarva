# 2026-10-02-home-canonical-dependency-proof - Governed dependency paths in Home

## Release ID

`2026-10-02-home-canonical-dependency-proof`

## Status

`candidate`

## Plain-English Summary

Home can explain selected risk and change-program dependencies using canonical relationship IDs and independently linked source records. Its page, advisor, graph exhibit, record browser, and walkthrough export use the same declared projection. The new projection is versioned and written in shadow; merging this release does not change which record any tenant sees. A separate, proof-gated private operation can promote the reviewed synthetic lab projection. The source remains explicitly synthetic and not client-attested.

## Layer Impact

- Release lanes: `global-control-lane` for shared Home readers and rendering; `client-data-lane` for the explicitly scoped synthetic projection and promotion jobs.
- Client intake and adapters: no intake files or adapter mappings change.
- Canonical model: existing object and relationship IDs are read and validated; no canonical rows are written by this release.
- Products: Home gets deterministic dependency readouts, a cited advisor answer and graph exhibit, browser rows, and export content when an admitted version-2 projection is active. Other products do not switch read paths.

## Client Applicability

- All clients: the additive Home reader and presentation code; no automatic data switch.
- Specific clients: only a separately approved synthetic lab tenant with a matching source-set hash may be promoted by the private job.
- Internal only: digest-pinned projection, check, promotion, and rollback operations.
- Public/demo only: the synthetic reference record remains visibly not client-attested.
- Feature flag: none; the active tenant-scoped projection declaration is the switch.

## Changes Included

- Version-2 shadow Home projection includes a bounded set of canonical risk, program, application, vendor, contract, data-product, and platform edges, with endpoint and edge source links.
- Promotion validates the exact projection version, manifest, source hash, row counts, source links, serving views, and Home context before switching the active declaration. Rollback validates the prior version-1 projection before restoring it.
- Home renders the same selected paths in its Technology & Data context, advisor narrative and graph exhibit, record browser, and walkthrough export.
- Pure builder, reader, advisor, UI, export, and projection-job tests cover the versioned contract. The Home selection tenant-fence workflow watches the new proof module.

## QA / Validation

- Synthetic projection proof test: passed locally, including 3,643 object rows, 346 selected relationship rows, and canonical source references.
- Focused Home advisor, dependency, UI, and export tests: 41 passed locally after rebasing, including an exact-edge drill click test.
- Home ratchet: 911/939 passing; the same 12 baselined suites, with no new or worsened failure. Typecheck and touched-file lint passed locally after rebasing.
- Local PostgreSQL projection integration: not run because no local admission-test database is configured. Release check: 11/11 gates passed. CI, private-job readback, and signed-in proof: pending at candidate creation; update evidence before merge or promotion.

## Rollout Plan

1. Merge the reviewed PR after required checks; deploy the exact main SHA through the repo-owned ACA main workflow.
2. Prove the approved image digest matches the web template, the 100-percent traffic revision, and required worker jobs.
3. Run the digest-pinned private projection job against the already accepted synthetic source set. It writes a version-2 shadow projection and immutable proof; the active version-1 declaration remains unchanged.
4. Run a separate private check against the exact shadow proof, source-set hash, readback proof, and serving views. Promote only on pass.
5. Verify the declared record, dependency readout, advisor citations and graph, browser rows, and PDF in a signed-in session. Keep the completion score unchanged until that proof passes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: recorded by the successful main deploy and supplied to the private job.
- ACA runtime invariant: independently required before a live claim.
- Worker image invariant: independently required before a live claim.
- Feature/env flag update path: not used.
- Live signed-in proof required: yes.

## Rollback Plan

The private `rollback` mode verifies the exact prior version-1 manifest, 3,643 source-linked rows, active version-2 proof hash, and source-set hash before atomically restoring the version-1 declaration. It writes a rollback proof and deletes no canonical or projection rows. Code rollback requires a new PR and the repo-owned ACA main workflow. If version-2 promotion never occurs, no data rollback is needed.

## Audit Evidence

Review the PR and CI runs, exact-SHA ACA deploy, independent digest-invariant output, private projection/check/promotion job logs and Blob proofs, and signed-in Home, advisor, graph, browser, and PDF evidence. These are required before calling the release live-proven.

## Known Gaps

The graph is an explicitly bounded dependency slice, not the whole enterprise graph. Unresolved edges and undeclared relationships are not inferred. Historical change-over-time observations remain outside this release.
