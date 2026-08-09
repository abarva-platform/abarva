# 2026-08-09-source-final-semantic-cleanup — Source Final Semantic Cleanup

## Release ID

`2026-08-09-source-final-semantic-cleanup`

## Status

`candidate`

## Plain-English Summary

This release tightens the final visible wording on the Source workspace and Contract 360 pages so the demo does not imply inconsistent grains or mismatched economics. It labels portfolio counts by their actual grain, shows a partial contract economics baseline when only annual value and actual spend are loaded, separates invoice billing-rate variance from VMS/labor rate-card variance, and replaces internal readiness jargon with plain executive language.

## Layer Impact

Affected lane: `global-control-lane`.

Layer 4 PRODUCTS only. Source presentation labels and Contract 360 view copy changed; no canonical data, schema, loader, calculation, cube, or economic value changed.

## Client Applicability

- All clients: yes, shared Source presentation behavior.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Source workspace count labels now distinguish active contracts, contract records, active strategic vendors, and supplier entities.
- Contract 360 Story baseline card now says `Contract economics loaded` and shows annual contract value, actual annual spend, and unreconciled pricing schedule baseline separately.
- Contract 360 Story readiness copy now uses plain-English opportunity readiness language.
- Contract 360 Performance labels now separate potential recoverable leakage from commercial baseline and distinguish invoice billing-rate exceptions from VMS/labor rate-card variance.

## QA / Validation

- `pass` Focused ESLint on changed Source files and tests.
- `pass` Focused Jest for Source workspace view-model and Contract 360 executive story tests.
- `pass` `npm run release:check`.
- `pass` `git diff --check`.
- `pending` Live signed-in Source browser proof after merge/deploy.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the approved image to the shared web runtime. No manual data-plane, schema, migration, loader, cube, or feature-flag action is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change
- Approved image digest: produced by the repo-owned deploy workflow after merge
- ACA runtime invariant: required before claiming live proof
- Worker image invariant: not applicable
- Feature/env flag update path: not applicable
- Live signed-in proof required: yes, Source workspace and Contract 360 Story/Performance pages

## Rollback Plan

Revert the Source presentation PR and allow the repo-owned ACA main deploy workflow to redeploy the previous presentation behavior. No migration rollback is required.

## Audit Evidence

PR, merge commit, GitHub Actions deploy run, focused test output, release-check output, and live signed-in proof bundle.

## Known Gaps

This release does not change calculations, loader behavior, cube definitions, golden-contract economics, or Contract 360 layout beyond the named semantic labels.
