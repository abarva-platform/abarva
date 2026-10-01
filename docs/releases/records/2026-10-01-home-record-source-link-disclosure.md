# 2026-10-01 Home Record Source Link Disclosure

## Release ID

`2026-10-01-home-record-source-link-disclosure`

## Status

`candidate`

## Plain-English Summary

The Home record browser now shows whether a selected served row has a verified link to a canonical source-record ID. It keeps the link separate from business fields and explicitly says that an ID match does not establish source-file acceptance or claim review. Reviewed stored copies, which lack this bridge, do not acquire a fabricated link status.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 3 canonical model: unchanged; existing tenant-scoped source-record links are read, not written.
- Layer 4 Home: served record types carry row-aligned source IDs for selected-record provenance disclosure.

## Client Applicability

- All clients: Home served projections with the existing source-record bridge.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag; existing Home access applies.

## Changes Included

- Preserve admitted, verified source-record IDs through Home's typed record projection, including combined record families.
- Show matched or missing link state in selected-record details without adding technical IDs to the business table.
- Keep reviewed stored copies unchanged. No migration, ingest, generation, tenant write, or shared-runtime setting change.

## QA / Validation

- Focused projection and browser identity suites pass, including unverified links, duplicate declared IDs, and combined-family ordering.
- TypeScript check passes with the repository's established larger Node heap.
- Broader tests, CI, deployment, and signed-in proof: pending at candidate stage.

## Rollout Plan

Squash merge after PR checks pass. Deploy through `.github/workflows/aca-main-deploy.yml` only, then check digest-pinned runtime invariants and signed-in Home record details.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: record after deployment.
- ACA runtime invariant: web template and 100%-traffic revision match the approved digest.
- Worker image invariant: required delivery jobs match the approved digest.
- Feature/env flag update path: no change.
- Live signed-in proof required: matched and missing source-record link states in the served record browser.

## Rollback Plan

Revert in a new PR and redeploy through the repository-owned main workflow. No data or schema rollback is needed.

## Audit Evidence

PR checks, deploy run, digest readback, and signed-in browser proof are recorded in the private execution ledger after release.

## Known Gaps

- A matched ID does not attest to source-file quality, claim review, or a finding-to-citation chain.
- Rows without a verified bridge remain visibly unlinked; this release does not repair their data lineage.
