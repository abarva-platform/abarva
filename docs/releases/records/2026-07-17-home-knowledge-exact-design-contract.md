# 2026-07-17-home-knowledge-exact-design-contract — Home Knowledge Design Contract Alignment

## Release ID

`2026-07-17-home-knowledge-exact-design-contract`

## Status

`candidate`

## Plain-English Summary

This release aligns the Meridian Home / Knowledge surface with the supplied Nexus Home Knowledge design contract. The page keeps the tenant as the primary hero, presents the enterprise briefing first, moves Context Confidence into a separate readiness view, removes the duplicate enterprise/dimension tab stack from drill-down pages, and gives dimension data tabs full-row browsing with search, segment filtering, confidence filtering, selected-row detail, and CSV export.

## Layer Impact

- `global-control-lane` / Experience layer: updates the Meridian Home Knowledge React surface so it follows the approved design structure rather than the older dimension-directory shell.
- `global-control-lane` / Data consumption layer: continues reading the approved Home Knowledge design-contract pack and does not generate, mutate, promote, or reprocess tenant data.
- `public-demo` / Governance layer: preserves planning-grade and not-client-certified copy where the content is synthetic/demo context.

## Client Applicability

- All clients: No.
- Specific clients: Meridian Health / Healthcare Demo Home Knowledge design-contract path.
- Internal only: No.
- Public/demo only: Demo-safe tenant experience.
- Feature flag: Uses the existing Home Knowledge design-contract availability path.

## Changes Included

- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`
- `reports/home-knowledge-design-contract-ui-wiring/summary.md`
- `reports/home-knowledge-design-contract-ui-wiring/blocked-content-audit.csv`

## QA / Validation

- `npx eslint src/components/home/HomeKnowledgeDesignContractSurface.tsx` — passed.
- `npm run audit:home-knowledge-design-contract-ui` — passed.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false` — passed.
- Static component render generated `/private/tmp/nexus-home-exact-design-contract-preview.html`.
- Static screenshot generated `/private/tmp/nexus-home-exact-design-contract-preview.png` and visually checked against the supplied design contract.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned web image to `ca-abarva-web-lab-eastus`. After deployment, verify runtime invariant, health, and signed-in Meridian Home browser proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Only the repo-owned ACA main deploy workflow may shift shared web traffic.
- Approved image digest: To be produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deploy before claiming live.
- Worker image invariant: No worker image changes expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Meridian Home / Knowledge route.

## Rollback Plan

Revert the PR and redeploy the previous good `main` SHA through the ACA main deploy workflow. No database rollback or tenant data rollback is required because this release changes only the render surface.

## Audit Evidence

- PR URL: To be added after PR creation.
- Deploy workflow run: To be added after merge/deploy.
- Runtime invariant: To be captured after deploy.
- Signed-in screenshot/proof: To be captured after deploy.

## Known Gaps

Live ACA deploy and signed-in browser proof are pending until this candidate is merged and deployed.
