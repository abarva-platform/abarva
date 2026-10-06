# 2026-09-21 Source Canonical Artifact Export Controls

## Release ID

`2026-09-21-source-canonical-artifact-export-controls`

## Status

`candidate`

## Plain-English Summary

The control catalog now distinguishes the two canonical Source artifact export paths that enforce the recorded human-approval decision from older compatibility render paths that do not yet share that enforcement. The canonical render and governed download routes are covered by real route-handler tests in the catalog CI job. Legacy per-format routes remain explicitly partial and are not represented as externally approved.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 products: Source export control declarations and CI ownership are corrected. Runtime route behavior is unchanged.
- Governance/control plane: the consequential-action catalog now states the exact boundary that is machine-covered.

## Client Applicability

- All clients: yes, for Source canonical d-code render and governed download controls.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Split the broad vendor-facing export catalog row into two covered canonical routes and one explicitly partial legacy route family.
- Add both covered routes to the AI surface control catalog.
- Run each route-handler behavior suite in the AI surface control catalog workflow.

## QA / Validation

- `npm run audit:ai-surface-controls`
- `npx jest --runTestsByPath 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render/__tests__/route.test.ts' 'src/app/api/v1/source/artifacts/[artifactId]/download/__tests__/route.test.ts' --runInBand`
- Mutation check: removing the governed-download workflow step makes the catalog audit fail.
- Mutation check: bypassing either route's `isExportEligible` decision makes its real-handler test fail.
- `git diff --check`

## Rollout Plan

Squash-merge through the protected main branch. The repo-owned ACA main deploy workflow may deploy the resulting documentation and CI declaration changes with the normal web image; no migration or data build is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: recorded by the deploy workflow after merge.
- ACA runtime invariant: verify template, 100% traffic revision, and required worker image digests after deploy.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: no; this release changes audit truth and CI ownership, not product behavior.

## Rollback Plan

Revert the squash commit. No database or tenant data rollback is required.

## Audit Evidence

- Pull request and CI run created from this release candidate.
- Local catalog audit, route-handler test output, and mutation checks recorded in the execution claim.

## Known Gaps

The five legacy per-format artifact render routes do not all enforce the canonical artifact-authority decision. They remain compatibility-only and must not be represented as externally approved until retired or routed through the canonical gate.
