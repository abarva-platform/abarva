# 2026-08-14-source-evaluation-forward-gate-readiness — Source Evaluation Forward Gate Readiness

## Release ID

`2026-08-14-source-evaluation-forward-gate-readiness`

## Status

`candidate`

## Plain-English Summary

The Responses stage forward gate now explains whether proposal scoring is truly ready before users move to Evaluation. Instead of treating the presence of a scorecard as ready, it counts score cells that are scoreable, need clarification, or are not scoreable, then tells the user what must be resolved before continuing.

## Layer Impact

Layer 4 Products: Source presentation and read-model wording only. The change updates the Responses workflow gate that guides movement into Evaluation.

No Layer 1 client intake, Layer 2 adapter, or Layer 3 canonical model changes are included. No parser, workflow persistence, schema, approval automation, tenant data, or live data-plane mutation is included.

## Client Applicability

- All clients: Source users on the Responses workflow surface receive clearer score readiness guidance.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source route availability only.

## Changes Included

- Updates the Responses-to-Evaluation forward gate to summarize score eligibility counts.
- Adds regression coverage that prevents a scorecard with clarification gaps from appearing fully ready.

## QA / Validation

- Pass: `npx eslint src/components/source/canvas/responses/VendorResponseForwardGate.tsx src/components/source/canvas/responses/__tests__/VendorResponseForwardGate.test.tsx`
- Pass: `npm test -- --runTestsByPath src/components/source/canvas/responses/__tests__/VendorResponseForwardGate.test.tsx --runInBand`
- Pass: `git diff --check`
- Pass: `npm run release:check`

## Rollout Plan

Open a PR, merge through the protected repository flow, and deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge through `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: Not used by this change.
- Approved image digest: To be recorded after deployment.
- ACA runtime invariant: Required after deployment before claiming live.
- Worker image invariant: Required after deployment before claiming live.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on the Source Responses workflow surface after deployment.

## Rollback Plan

Revert the PR or redeploy the prior healthy Azure Container Apps image through the approved repo-owned deployment lane. No migration rollback is required.

## Audit Evidence

To be filled after PR, CI, merge, deploy, ACA invariant proof, and signed-in route proof are complete.

## Known Gaps

This does not parse new vendor documents, change scoring algorithms, automate approvals, or write workflow state. It only makes the forward gate more truthful and action-oriented.
