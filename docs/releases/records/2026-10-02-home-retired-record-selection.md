# 2026-10-02-home-retired-record-selection — Explicit retirement selects the reviewed record

## Release ID

`2026-10-02-home-retired-record-selection`

## Status

`candidate`

## Plain-English Summary

When an active Home assessment is explicitly retired and no other active assessment exists, Home now displays its reviewed stored record. Previously, that state caused Home to read an older undeclared default assessment. The record source remains visible to the reader. A tenant with an active declaration still sees its declared projection; a tenant with no declaration retains the existing default selection.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: Home assessment selection and record-source labelling for the Home page, preview, assistant, and export.
- Layer 3, Canonical model: read only. No schema, migration, or data mutation in this release.
- Layers 1 and 2: unchanged.

## Client Applicability

- All clients: shared Home reader behavior.
- Specific clients: none named or special-cased.
- Internal only: none.
- Public/demo only: none.
- Feature flag: existing Home provider selection is unchanged.

## Changes Included

- Home selection distinguishes an explicitly retired declaration from an absent declaration and continues to prefer a valid active declaration.
- The source-aware Home reader returns the reviewed bundle with a `reviewed_snapshot` marker for retirement; direct ECL-only reads refuse retired declarations.
- The preview route uses the source-aware reader, so it cannot label a reviewed record as a live projection.
- Unit and two-tenant database tests cover active, retired, and absent declarations.

## QA / Validation

- Focused Home selector and bundle suites: 38 tests passed.
- Two-tenant disposable PostgreSQL test: passed, including retirement and tenant isolation.
- Typecheck: passed with an 8 GB Node heap after the default 4 GB heap was exhausted.
- ESLint on touched TypeScript files: passed.
- Home ratchet: 910 of 938 tests passed; the same 12 baselined suites failed, with no movement away from baseline.
- Release check: all 11 gates passed.
- CI and signed-in browser proof: pending at candidate creation.

## Rollout Plan

Squash merge the PR to protected `main`, then deploy through `.github/workflows/aca-main-deploy.yml`. No migration, operator job, or feature flag is part of this release. Verify runtime image invariants and the signed-in Home record-source label before making a live claim.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: recorded by the deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: not used.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR through a new PR and deploy the revert through the same workflow. No schema or data rollback is required by this code change. Data-plane retirement and promotion remain separate operator actions.

## Audit Evidence

The PR and CI checks, disposable database test output, ACA deploy run, runtime-invariant report, and signed-in Home proof.

## Known Gaps

- A reviewed stored record is visibly distinct from a live governed projection and must not be described as live served data.
- This change does not validate or promote a new governed projection or narrative.
