# 2026-10-01 Home Record Detail Headings

## Release ID

`2026-10-01-home-record-detail-headings`

## Status

`candidate`

## Plain-English Summary

Selected records in Home now use the name declared by their record type. Newer evidence families no longer open with a blank heading when their name is present. A relationship identifies both declared endpoints; a record with no name uses its declared row ID or says it is unnamed.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 3 canonical model: unchanged.
- Layer 4 Home: selected-record presentation only; underlying rows, counts, and source-link states are unchanged.

## Client Applicability

- All clients: Home record browser for typed evidence families.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag; existing Home access applies.

## Changes Included

- Declare the selected-record name field for every supported record family, with compile-time coverage when a family is added.
- Identify a relationship by its declared source and target names.
- Fall back to the row's declared ID or an explicit unnamed state when the name is missing.
- No intake, adapter, canonical record, model call, schema, tenant write, or runtime setting change.

## QA / Validation

- Focused selected-record suite: 33 tests pass, including every record type and missing-name fallbacks.
- Broader Home tests, typecheck, release gate, CI, deployment, and signed-in proof: pending at candidate stage.

## Rollout Plan

Squash merge after PR checks pass. Deploy through `.github/workflows/aca-main-deploy.yml` only, then check digest-pinned runtime invariants and a signed-in selected record from a newer family.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: record after deployment.
- ACA runtime invariant: web template and 100%-traffic revision match the approved digest.
- Worker image invariant: required delivery jobs match the approved digest.
- Feature/env flag update path: no change.
- Live signed-in proof required: a newer-family selected record displays its declared name rather than an empty heading.

## Rollback Plan

Revert in a new PR and redeploy through the repository-owned main workflow. No data or schema rollback is needed.

## Audit Evidence

PR checks, deploy run, digest readback, and signed-in browser proof are recorded in the private execution ledger after release.

## Known Gaps

- This repairs record identity in the browser, not the quality or approval state of source content.
- A displayed relationship remains a declared edge; endpoint resolution and graph quality are separate gates.
