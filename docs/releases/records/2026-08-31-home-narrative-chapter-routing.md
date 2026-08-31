# 2026-08-31 Home Narrative Chapter Routing

## Release ID

`2026-08-31-home-narrative-chapter-routing`

## Status

`candidate`

## Plain-English Summary

Home narrative chapter assembly now routes organization, workforce, process, and service-delivery evidence into the operating-model chapter instead of treating it as unrelated leadership or technology context. The visible-quality gate also rejects claim-backed chapters that still render generic refusal language.

## Layer Impact

Release lane: `client-data-lane`.

Layer 3 canonical/context: no schema or data mutation.

Layer 4 products: Home narrative generation uses the existing verified evidence packet more accurately when assembling chapter-level prose and terminal states.

## Client Applicability

All clients: applies to Home narrative generation behavior.

Specific clients: none named in this public record.

Internal only: no.

Public/demo only: no.

Feature flag: none.

## Changes Included

- Update Home chapter assembly so operating-model claims can be selected from organization, workforce, process, and service-delivery evidence.
- Update Home page prompt contracts to name the source files that support strategy and operating-model pages.
- Add a visible-quality gate for claim-backed chapters that still render refusal-like prose.
- Add Home narrative regression assertions for the routing and visible-quality gate.

## QA / Validation

- `node scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs` passed.
- `git diff --check` passed.
- `npm run release:check` is required before merge.

## Rollout Plan

Merge by GitHub PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the runtime image from the merged commit. Any data write must use the governed operator job path and must pass plan-only inspection before write-gated execution.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the workflow
- Approved image digest: resolved by the deploy workflow after merge
- ACA runtime invariant: required before claiming live
- Worker image invariant: required by the deploy workflow
- Feature/env flag update path: not used
- Live signed-in proof required: required before claiming product proof

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy workflow. Previously published narrative rows are not modified by this code change unless a separate write-gated operator job is run.

## Audit Evidence

- Pull request and CI output for this change.
- Home narrative plan-only proof bundle from the deployed digest before any write-gated execution.
- Home narrative readback proof after any approved write-gated execution.

## Known Gaps

This release does not itself publish refreshed Home narrative rows. It only fixes the routing and quality gate used by the next plan-only/write-gated narrative run.
