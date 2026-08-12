# 2026-08-11-source-optimize-specific-evidence-requests — Source Optimize Evidence Request Specificity

## Release ID

`2026-08-11-source-optimize-specific-evidence-requests`

## Status

`candidate`

## Plain-English Summary

The Source Optimize Contract evidence request board now turns common opportunity requirements into named, actionable pull instructions instead of repeating a generic "optimization evidence requirement" label. The board can distinguish signed concession evidence, invoice/PO coverage, usage and scope approval, SLA credit support, and rate-card exception searches. This helps a sourcing user understand exactly what to collect, from which system, at what grain, and what decision the evidence blocks.

## Layer Impact

Release lane: `global-control-lane`.

Canonical model / Source read model: no schema or persistence change. The component only improves how existing opportunity requirement strings are classified for display.

Products: Source Optimize Contract evidence-request board becomes clearer for every tenant using the shared optimization opportunity read path.

## Client Applicability

- All clients: Yes, for tenants using Source Optimize Contract.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/SourceOptimizeContractPage.tsx`
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`

## QA / Validation

- `npx jest src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand` passed.
- `npx jest src/components/source/__tests__/SourceOptimizeContractPage.test.tsx src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts src/lib/source/data-model/__tests__/contract-optimization-opportunity.test.ts src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts --runInBand` passed.

## Rollout Plan

Merge through the protected GitHub PR lane. The repo-owned Azure Container Apps main deployment workflow builds and deploys the exact merged SHA.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: GitHub Actions workflow only.
- Approved image digest: To be captured after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Optimize Contract evidence request board for a selected contract.

## Rollback Plan

Revert the PR and allow the repo-owned ACA main deployment workflow to redeploy the prior generic requirement mapper. No migration rollback is required.

## Audit Evidence

- PR URL: To be added after PR creation.
- CI/deploy run: To be added after merge and deploy.
- Live proof: Verify the optimize page shows specific evidence rows such as invoice/PO coverage, SLA credit support, usage/scope approval, signed concession evidence, or rate-card exception search where applicable.

## Known Gaps

This release does not parse new files or create new evidence rows. It improves the actionability of already-loaded opportunity requirement rows on the Optimize Contract page.
