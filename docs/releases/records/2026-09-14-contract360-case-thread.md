# 2026-09-14 — Contract 360 case thread and Optimize decision surface

## Release ID

`2026-09-14-contract360-case-thread`

## Status

`candidate`

## Plain-English Summary

Contract 360 now presents a compact case thread that connects the declared contract archetype to scope, evidence, and the next commercial action. Each contract tab also states the executive question it answers. Optimize keeps the governed lever table, charts, sequence view, and comparator as the decision surface while moving gate diagnostics into supporting context. Evidence and relationship labels use plain English, and unloaded evidence is no longer displayed as a numeric zero.

## Layer Impact

- **Release lane:** `global-control-lane`.
- **Products:** Source Contract 360 presentation and navigation only.
- **Canonical model:** No schema, loader, adapter, or canonical fact changes.
- **Client intake / source adapters:** No changes.

## Client Applicability

- All clients using the Source Contract 360 surface.
- No client-specific data or feature flag.

## Changes Included

- Added the persistent Contract 360 case thread: what the contract is, what it covers, what is proven, and what to do.
- Added tab-specific executive questions and handoff guidance.
- Kept the governed Optimize lever table as the primary surface and retained the Sequence and Comparator sub-tabs.
- Kept existing Recharts evidence visuals and the contract anatomy visualization.
- Reworded evidence and relationship labels for executive readability.
- Distinguished an unloaded lane from a loaded lane with zero rows.

## QA / Validation

- Focused Jest suite: 5 suites, 71 tests passed.
- TypeScript: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- ESLint passed for all changed TypeScript and test files.
- `git diff --check` passed.

## Rollout Plan

Merge through the protected main branch, then allow the repo-owned ACA main deploy workflow to build and deploy the exact merge SHA. After deployment, verify the ACA runtime invariant and run signed-in Contract 360 proof across Story, Scope, Economics, Performance, Relationship, Evidence, Education, and Optimize, including the Optimize sub-tabs.

## Deployment Authority

- **Repo-owned deploy workflow:** `.github/workflows/aca-main-deploy.yml`
- **Shared runtime mutators:** none in this change.
- **Approved image digest:** assigned by the main deploy workflow after merge.
- **ACA runtime invariant:** template image, 100%-traffic revision image, and required worker images must match the approved digest.
- **Live signed-in proof required:** yes, because the change affects a signed-in Source workflow.

## Rollback Plan

Redeploy the prior good main SHA through the repo-owned ACA workflow. No migration rollback is required.

## Audit Evidence

- Candidate branch diff and focused test output.
- Typecheck, lint, and diff checks listed above.
- Post-merge ACA deploy workflow run, runtime invariant output, and signed-in browser proof.

## Known Gaps

Live deployment and signed-in browser proof are pending. Data availability remains governed by the existing contract depth and evidence lanes; this change does not fabricate missing scope, documents, performance, or optimization rows.
