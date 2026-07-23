# 2026-07-23-source-pricing-lifecycle-prompt-contracts — Pricing prompt-backed lifecycle projection

## Release ID

`2026-07-23-source-pricing-lifecycle-prompt-contracts`

## Status

`candidate`

## Plain-English Summary

The deployed Pricing prompt slice made d19/d20/d21 generatable, but signed-in Apex proof showed the Source Files and artifact standards matrix still described those artifacts as having "No dedicated prompt." This fixes the projection layer so the lifecycle matrix derives prompt-backed status, model label, and token budget from the authoritative Source generation registry instead of a duplicate hand-maintained table.

## Layer Impact

- `global-control-lane`: Corrects Source artifact lifecycle and standards reporting for prompt-backed artifacts. No schema, route, or permission change.
- `client-data-lane`: No data mutation. Existing event rows are only read and displayed with corrected prompt-contract metadata.

## Client Applicability

- All clients: Any Source Files / artifact standards matrix now gets prompt-backed labels from the current prompt registry.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/artifact-lifecycle-matrix.ts`: replaces the duplicate prompt contract table with `getPromptTemplate()` from the Source generation registry and formats model/token labels from the real template.
- `src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts`: adds a regression test asserting `d19_pricing_workbook`, `d20_trap_log`, and `d21_assumption_set` export as prompt-backed and do not say "No dedicated prompt."
- `docs/backlog/source-product-backlog.md`: records the signed-in proof finding and follow-up scope for item #9.

## QA / Validation

- PASS: `npm test -- --runInBand --runTestsByPath src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts` — 7/7 tests passed.
- Pending: focused ESLint, `npm run release:check`, PR checks, ACA deploy, runtime invariant, and signed-in Apex proof after deploy.

## Rollout Plan

Merge via PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the merged SHA to `app.abarva.ai`. After deploy, run the independent ACA runtime invariant, then open Apex Source Pricing Files signed in and confirm d19/d20/d21 no longer display "No dedicated prompt."

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending repo-owned deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, read-only Apex Source Pricing Files proof.

## Rollback Plan

Revert the application PR and redeploy through the repo-owned ACA main workflow. No migration rollback, data repair, or artifact cleanup is required.

## Audit Evidence

- Root live finding: signed-in Apex event `apex-retail-ams-outsourcing-2026?stage=pricing` showed `d19_pricing_workbook`, `d20_trap_log`, and `d21_assumption_set` with "No dedicated prompt" after PR #5392 deploy.
- Focused regression: local pass listed above.
- PR: Pending.
- ACA deploy/invariant: Pending merge.
- Live signed-in proof: Pending deploy.

## Known Gaps

- This does not add new prompt templates for Responses, Evaluation, Transition, or Value. Those remain open under Source backlog item #9.
- This does not generate or mutate any Source artifact bodies.
