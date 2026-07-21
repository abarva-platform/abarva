# 2026-07-21-home-cxo-page-polish — Home CXO Page Polish

## Release ID

`2026-07-21-home-cxo-page-polish`

## Status

`candidate`

## Plain-English Summary

Polishes the Home / Knowledge executive pages so they read more like a CXO context cockpit and less like a raw data inventory. The Enterprise Brief now leads with the boardroom read, selected traceable facts, and context concentration before lower-level exploration cards. The Use Cases page fixes a chart overflow defect that caused the Recharts visual to overlap cards and text.

## Layer Impact

- `global-control-lane`: Updates shared Home Knowledge UI rendering for approved design-contract packs.
- `public-demo`: Improves the signed-in demo experience for tenant Knowledge pages.

## Client Applicability

- All clients: Any tenant using the Home Knowledge design-contract surface receives the layout and chart containment fixes.
- Specific clients: Meridian / Healthcare Demo is the current visual proof target because the reported screenshots came from that tenant.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`
  - Reorders Enterprise Brief content toward executive narrative before exploration scaffolding.
  - Limits at-a-glance facts to selected traceable facts.
  - Constrains the Use Cases Recharts container so bars cannot overlap priority cards.
  - Makes use-case cards responsive and text-safe.

## QA / Validation

- pass — `npx eslint src/components/home/HomeKnowledgeDesignContractSurface.tsx`
- pass — `npm test -- --runTestsByPath src/components/home/__tests__/HomeSurface.test.tsx src/components/home/__tests__/buildRelationshipTopology.test.ts --runInBand` (21/21 tests passed; Jest emitted existing duplicate manual mock warnings)
- pass — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- not-run — signed-in Meridian / Healthcare Demo Home page screenshot; to be captured after ACA deploy.
- not-run — live Use Cases tab overlap check; to be captured after ACA deploy.
- not-run — live Enterprise Brief readability check; to be captured after ACA deploy.

## Rollout Plan

Merge via PR to `main`, deploy through the repo-owned ACA main lane, then run signed-in browser proof on `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy the previous digest through the ACA main lane if the Home page layout regresses.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Live proof bundle: Pending.

## Known Gaps

The floating aVa launcher is shared shell behavior and is not repositioned in this release unless follow-up proof shows the Home surface owns that overlap.
