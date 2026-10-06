# 2026-09-15-source-archetype-intelligence-foundation — Source Archetype Intelligence Foundation

## Release ID

`2026-09-15-source-archetype-intelligence-foundation`

## Status

`candidate`

## Plain-English Summary

Source New Event analytics now select deterministic calculations from the event's governed archetype instead of silently using an arbitrary available rule pack. The release adds evidence-bound calculation packs for cloud optimization and contract renewal, retains the existing managed-services pack, defines industry-intelligence requirements for all ten Source archetypes, and reports which archetypes are analytics-ready versus workflow-only.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3, canonical semantics: adds typed fact definitions consumed by the new deterministic calculations. It does not add or mutate physical tenant rows.
- Layer 4, products: changes Source stage analytics, aVa grounding, and structured workbook validation to use the event's governed type and classifier result. It fails closed when deterministic rules are not authored.
- Context/corpus governance: adds code contracts for cited industry sources and comparable benchmark observations. No corpus dataset is included or loaded in this release.

## Client Applicability

- All clients: yes, after the standard shared-runtime release.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Strict event-archetype routing for stage analytics, aVa grounding, and composite workbook validation.
- Deterministic Cloud / FinOps and Contract Renewal value-lever formulas with canonical fact definitions.
- Governed industry-source and benchmark-observation contracts.
- Ten-archetype industry metric and comparability registry.
- Machine-readable readiness ledger that distinguishes analytics-ready from workflow-only archetypes.
- Focused formula, routing, ingestion, tenant-fencing, readiness, and refusal tests.

## QA / Validation

- `npx jest --runInBand <13 focused Source suites>`: PASS, 13 suites and 156 tests.
- `npx eslint <touched Source runtime and test files>`: PASS.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`: PASS.
- `git diff --check`: PASS.

## Rollout Plan

Merge through a protected pull request. Allow the repo-owned ACA main deploy workflow to build and deploy the exact merge SHA. Do not run a tenant data-build job for this code-only release. After deployment, run signed-in Source New Event proof for one managed-services event, one cloud event, one renewal event, and one workflow-only event to prove correct routing and fail-closed behavior.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: pending merge and workflow build.
- ACA runtime invariant: template image, 100% traffic revision image, and required worker images must match the approved digest before calling the release deployed.
- Worker image invariant: no worker image change expected; verify required workers remain digest-aligned.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, across ready and workflow-only archetypes.

## Rollback Plan

Revert the squash-merge commit through a protected pull request and redeploy the resulting main SHA with the repo-owned ACA workflow. No schema or tenant-data rollback is required because this release performs no migration or data mutation.

## Audit Evidence

- Pull request and CI run: pending.
- ACA deployment and digest invariant: pending.
- Signed-in Source proof bundle: pending.
- Local validation commands are recorded in this release candidate and the pull request description.

## Known Gaps

- Three of ten archetypes have deterministic value calculations in this increment: managed services, cloud optimization, and contract renewal. The other seven remain explicitly workflow-only.
- Industry metric requirements are defined for all ten archetypes, but no external source or benchmark dataset is introduced. Any future dataset requires its own passing governance manifest, ingestion proof, retrieval proof, and citation-render verification.
- Live signed-in and deployed-runtime proof are pending merge and deployment.
