# 2026-10-02-home-enterprise-profile-reader - Serve admitted enterprise context

## Release ID

`2026-10-02-home-enterprise-profile-reader`

## Status

`candidate`

## Plain-English Summary

Home now includes an admitted, source-linked enterprise profile when constructing its current-record business context. Previously, the profile was present in serving rows but removed before the business context was assembled, leaving the chapter without its intended depth.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: The Home projection reader admits a profile only when it carries a business model and a declared basis. No canonical objects, intake, adapters, or tenant data change.

## Client Applicability

- All clients: Home readers with an admitted enterprise-profile row.
- Specific clients: None hard-coded.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home ECL provider selection.

## Changes Included

- Include the qualified enterprise-profile row in Home's factual serving bundle.
- Add a regression test that builds the Home bundle from serving-shaped, source-linked rows rather than testing only the context builder directly.

## QA / Validation

- The regression failed before the reader change and passed after it.
- Run focused Home tests, typecheck, lint, release check, and CI before merge.
- Verify the signed-in Home business, strategy, and operating chapters after deployment.

## Rollout Plan

Squash-merge the PR to protected `main`, then deploy via `.github/workflows/aca-main-deploy.yml`. No migration or data-plane mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: The workflow only.
- Approved image digest: Record from the successful workflow run.
- ACA runtime invariant: Check template, 100% traffic revision, and health after deployment.
- Worker image invariant: Check required jobs against the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, including source state, chapter context, and citation drill-through.

## Rollback Plan

Revert the reader change in a new PR and deploy its merge commit through the same ACA workflow. The active assessment declaration and source records remain unchanged.

## Audit Evidence

The PR, failed-then-passed regression test, CI results, ACA deploy run, runtime invariant output, and signed-in chapter proof.

## Known Gaps

This does not reconcile older narrative with current deterministic rows or change aVa and export behavior.
