# 2026-10-03 — Synthetic Moves Kit Approval Authority

## Release ID

`2026-10-03-moves-synthetic-kit-approval-authority`

## Status

`candidate`

## Plain-English Summary

The offline synthetic Moves smoke kit now matches the product's approval model: listed sponsors are informational contacts, and an authorized workspace user records in-product decisions and phase approvals. A package validator prevents sponsor-approval wording from returning in the P1 decision record or P5 handoff RACI.

## Layer Impact

- **Layer 4 — Products:** test and demonstration fixtures only; no product runtime behavior changes.
- **Governance:** the synthetic fixture's approval-authority statements and checks now match the approved workspace-user workflow.

## Client Applicability

- All clients: None.
- Specific clients: None.
- Internal only: Synthetic QA package and validator.
- Public/demo only: No live product content is changed by this PR.
- Feature flag: None.

## Changes Included

- Commit `70bfb12ccf` updates the synthetic P1 decision record and P5 RACI, versions the package, and adds validator/test assertions for the approval boundary.

## QA / Validation

- `npm run test:moves:adaptive-e2e-kit` — 8 tests passed; 14-file allowlist and estimate arithmetic validated.
- Mutation check: restoring sponsor approval wording in either P1 or P5 causes the validator to fail.
- `npx eslint scripts/qa/validate-moves-adaptive-e2e-kit.mjs scripts/qa/__tests__/moves-adaptive-kit.test.mjs` — passed.
- `git diff --check` — passed.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pending rerun after this record is added.

## Rollout Plan

Merge through the protected PR workflow. There is no runtime deployment or data load in this change. The corrected files may be used by a later explicitly synthetic, signed-in application smoke.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable; no runtime files changed.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No runtime behavior changed.

## Rollback Plan

Revert the PR commit to restore the previous offline fixture and validator. No database, tenant state, or runtime rollback is required.

## Audit Evidence

- PR and CI run to be linked after creation.
- Local validation output is recorded in the PR and task checkpoint ledger.

## Known Gaps

This change does not upload the package, approve evidence, or advance a Move. Those remain separate signed-in workflow steps.
